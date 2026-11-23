import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { measureSpacing } from "./shortcut_panorama_spacing.mjs";

const { VISUALIZE_RENDER, PLAYWRIGHT_MODULE, CHROMIUM_EXECUTABLE, CLOSEOUT_ARTIFACT, IMPROVEMENT_ARTIFACT } =
  process.env;
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const { chromium } = await import(pathToFileURL(PLAYWRIGHT_MODULE).href);
const renderer = fileURLToPath(new URL("./render_shortcut_panorama.py", import.meta.url));
const path = "automations/weekly-self-improvement-observer-review/scripts/observer_panorama.html";
const title = "Uma alteração fora do escopo continua no checkout após a conclusão da sessão";
const variants = {
  closeout: {
    heading: "Itens possivelmente em aberto",
    fields: {
      "Prioridade": "Não se aplica.",
      "Situação": `O arquivo ${path} continua no checkout.`,
      "Justificativa": "O arquivo pertence a outra frente.",
      "Próxima ação necessária": null,
    },
  },
  improvement: {
    heading: "Melhorias recomendadas",
    fields: {
      "Evidências e datas": `O arquivo ${path} foi conferido em 16/11.`,
      "Frequência e confiança": "Duas ocorrências confirmadas.",
      "Forma recomendada": "Verificação local.",
      "Justificativa": "Uma checagem evita retrabalho.",
    },
  },
};
const artifacts = { closeout: CLOSEOUT_ARTIFACT, improvement: IMPROVEMENT_ARTIFACT };

test("os dois atalhos preservam o layout na prévia oficial do Visualize", async (suite) => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_EXECUTABLE }).catch((error) => {
    throw new Error(
      "Não foi possível abrir o Chromium local. Confira CHROMIUM_EXECUTABLE ou o navegador configurado no Playwright.",
      { cause: error },
    );
  });
  let dir;
  try {
    dir = mkdtempSync(join(realpathSync(tmpdir()), "shortcut-panorama-"));
    for (const [kind, { heading, fields }] of Object.entries(variants)) {
      const file = join(dir, `${kind}.html`);
      const items = [{ title: "Primeiro item <literal>", ...fields }, { title, ...fields }];
      execFileSync(python, ["-B", renderer, kind, file], { input: JSON.stringify(items) });
      assert.match(readFileSync(file, "utf8"), /&lt;literal&gt;/);
      if (kind === "closeout") {
        const invalid = { ...items[0], "Próxima ação necessária": "Nenhuma. Avaliar o envio." };
        const result = spawnSync(python, ["-B", renderer, kind, join(dir, "invalid.html")], {
          input: JSON.stringify([invalid]), encoding: "utf8",
        });
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Use null/);
      }
      const previews = [[file, kind]];
      if (artifacts[kind]) previews.push([artifacts[kind], `artefato ${kind}`]);
      for (const [source, name] of previews) {
        const html = execFileSync(python, ["-B", VISUALIZE_RENDER, source], {
          encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
        });
        const cases = [320, 736].flatMap((width) =>
          ["light", "dark"].map((colorScheme) => ({ width, colorScheme })));
        for (const { width, colorScheme } of cases) {
          await suite.test(`${name} a ${width}px (${colorScheme})`, async () => {
            const page = await browser.newPage({
              viewport: { width: 900, height: 1100 }, colorScheme,
            });
            try {
              await page.route(/^https?:/, (route) => route.abort());
              await page.setContent(html);
              const iframe = page.locator("iframe#codex-visualization");
              await iframe.evaluate((frame, px) => { frame.style.width = `${px}px`; }, width);
              const root = iframe.contentFrame().locator("#shortcut-panorama");
              assert.equal(await root.getAttribute("aria-label"), heading);
              assert.equal(await root.getByText(heading, { exact: true }).count(), 0);
              assert.equal(await root.locator("code").count(), 0);
              const itemCount = await root.locator("article").count();
              assert.ok(itemCount > 0);
              if (kind === "improvement" && source === file) {
                assert.equal(itemCount, items.length, "todos os itens da amostra devem aparecer");
                for (const item of items) {
                  const title = root.getByRole("heading", { name: item.title, exact: true });
                  assert.equal(await title.count(), 1, `título esperado na amostra: ${item.title}`);
                  assert.ok(await title.isVisible(), `título visível na amostra: ${item.title}`);
                }
              }
              assert.equal(await root.locator("article > hr").count(), itemCount);
              const paired = kind === "closeout" && width === 736;
              const fieldRows = paired ? [[1, 2], [2, 4]] : [[1, 2], [2, 3], [3, 4]];
              assert.deepEqual(await root.evaluate(measureSpacing, {
                width,
                topSpaceUnits: source === file ? 1 : null,
                firstLine: [{ scope: ".item-title", badge: ".item-number", heading: "h2" }],
                content: ["h2", "dt", "dd"],
                gaps: [
                  { label: "title to fields", scope: "article", before: ".item-title", after: "dl", units: .5 },
                  ...fieldRows.map(([before, after]) => ({
                    label: `field row ${before} to ${after}`,
                    scope: "article dl",
                    before: `.field-${before}`,
                    after: `.field-${after}`,
                    units: .75,
                  })),
                  { label: "label to detail", scope: "dl > div", before: "dt", after: "dd", units: .25 },
                  { label: "item to divider", scope: "article", before: "dl", after: "hr", units: 1 },
                ],
              }), []);
              const problems = await root.evaluate((element, paired) => {
                const issues = [];
                const canvas = element.ownerDocument.createElement("canvas");
                const context = canvas.getContext("2d", { willReadFrequently: true });
                function luminance(color) {
                  context.clearRect(0, 0, 1, 1);
                  context.fillStyle = color;
                  context.fillRect(0, 0, 1, 1);
                  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
                  if (a !== 255) throw new Error("cor translúcida fora do contrato do número");
                  const linear = [r, g, b].map((value) => {
                    const srgb = value / 255;
                    return srgb <= .04045 ? srgb / 12.92 : ((srgb + .055) / 1.055) ** 2.4;
                  });
                  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
                }
                for (const article of element.querySelectorAll("article")) {
                  const badge = getComputedStyle(article.querySelector(".item-number"));
                  const ink = luminance(badge.color);
                  const paper = luminance(badge.backgroundColor);
                  const ratio = (Math.max(ink, paper) + .05) / (Math.min(ink, paper) + .05);
                  if (ratio < 4.5) issues.push(`contraste do número: ${ratio.toFixed(2)}:1`);
                  const [a, b, c, d] = [...article.querySelectorAll("dl > div")].map((field) =>
                    field.getBoundingClientRect());
                  if (paired
                    ? b.top !== c.top || a.width !== d.width || a.width <= b.width || d.top < Math.max(b.bottom, c.bottom)
                    : !(a.bottom <= b.top && b.bottom <= c.top && c.bottom <= d.top)
                      || [b, c, d].some((field) => field.width !== a.width)) {
                    issues.push("posição ou largura dos campos");
                  }
                  const divider = getComputedStyle(article.querySelector("hr"));
                  const green = getComputedStyle(element).getPropertyValue("--green").trim();
                  const probe = element.ownerDocument.createElement("span");
                  probe.style.color = "var(--green)";
                  element.append(probe);
                  const expected = getComputedStyle(probe).color;
                  probe.remove();
                  if (!green || divider.borderTopColor !== expected || divider.borderTopWidth !== "1px") {
                    issues.push("divisória verde ausente");
                  }
                  for (const label of article.querySelectorAll("dt")) {
                    if (getComputedStyle(label).borderInlineStartWidth !== "0px"
                      || getComputedStyle(label.nextElementSibling).borderInlineStartStyle !== "dashed") {
                      issues.push("tracejado fora da descrição");
                    }
                  }
                }
                return issues;
              }, paired);
              assert.deepEqual(problems, []);
              if (kind === "closeout" && source === file) {
                assert.equal(await root.getByText("Nenhuma.", { exact: true }).count(), 2);
              }
            } finally {
              await page.close();
            }
          });
        }
      }
    }
  } finally {
    try {
      await browser.close();
    } finally {
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  }
});
