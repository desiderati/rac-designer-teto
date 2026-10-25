import {expect, test, type Locator} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {selectCanvasObjectByMyTypeByDebug, triggerElementsAction, triggerLinesAction} from './helpers/rac-editor.helpers';

test.beforeEach(async ({page}) => {
  // Estado de um usuário que já concluiu as dicas; os tours têm sua própria suíte.
  await page.addInitScript(() => {
    for (const kind of ['siteHouse', 'fence']) localStorage.setItem(`guided-tour:rac-tip:${kind}`, 'true');
  });
});

async function focusPaint(input: Locator) {
  await input.focus();
  return input.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const outset = Math.max(0, parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth));
    const paint = {left: rect.left - outset, top: rect.top - outset,
      right: rect.right + outset, bottom: rect.bottom + outset};
    const clippedBy = [];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor);
      const bounds = ancestor.getBoundingClientRect();
      const left = bounds.left + ancestor.clientLeft, top = bounds.top + ancestor.clientTop;
      const clipsX = ['auto', 'scroll', 'hidden', 'clip'].includes(css.overflowX);
      const clipsY = ['auto', 'scroll', 'hidden', 'clip'].includes(css.overflowY);
      if ((clipsX && (paint.left < left - .75 || paint.right > left + ancestor.clientWidth + .75))
        || (clipsY && (paint.top < top - .75 || paint.bottom > top + ancestor.clientHeight + .75))) {
        clippedBy.push({region: ancestor.getAttribute('data-rac-modal-region'),
          className: ancestor.className, overflowX: css.overflowX, overflowY: css.overflowY,
          left, top, width: ancestor.clientWidth, height: ancestor.clientHeight});
      }
    }
    return {visibleFocus: element.matches(':focus-visible'), outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth), clippedBy, paint,
      input: {width: rect.width, height: rect.height},
      pageOverflow: document.documentElement.scrollWidth > innerWidth};
  });
}

for (const item of [
  {label: 'Casa', kind: 'siteHouse', name: 'Casa'},
  {label: 'Cerca', kind: 'fence', name: 'Cerca'},
  {label: 'Muro', kind: 'wall', name: 'Muro'},
  {label: 'Linha Reta', kind: 'line', name: 'Linha Reta'},
]) {
  test(`foco completo no editor desktop de ${item.name}`, async ({page}, testInfo) => {
    await page.setViewportSize({width: 1243, height: 1077});
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
    if (item.kind === 'line') await triggerLinesAction(page, item.label);
    else await triggerElementsAction(page, item.label);
    expect(await selectCanvasObjectByMyTypeByDebug(page, item.kind, true, true)).toBe(true);
    const editor = page.getByRole('dialog', {name: `Editar ${item.name}`, exact: true});
    const input = editor.getByRole('textbox', {name: item.name, exact: true});
    await expect(input).toBeFocused();
    await page.evaluate(() => document.fonts.ready);
    const before = (await input.boundingBox())!;
    const metrics = await focusPaint(input);
    await testInfo.attach('geometria-foco', {body: JSON.stringify(metrics, null, 2), contentType: 'application/json'});
    await page.screenshot({path: testInfo.outputPath('campo-focado.png')});
    expect(metrics.visibleFocus).toBe(true);
    expect(metrics.outlineStyle).toBe('solid');
    expect(metrics.outlineWidth).toBeGreaterThan(0);
    expect(metrics.clippedBy, 'O indicador de foco deve caber nos ancestrais que recortam a pintura').toEqual([]);
    expect(metrics.pageOverflow).toBe(false);
    await input.fill('Rótulo de teste');
    expect((await input.boundingBox())!.width).toBe(before.width);
    expect((await input.boundingBox())!.height).toBe(before.height);
    await editor.getByRole('button', {name: 'Cancelar', exact: true}).click();
    await expect(editor).toBeHidden();
  });
}

test.describe('controle mobile e desktop compacto', () => {
  test.use({hasTouch: true});
  test('mantém foco completo, ações e descarte ao redimensionar o painel', async ({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1100});
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
    await triggerElementsAction(page, 'Casa');
    await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites[0]
      .houses[0].drawingDocument.canvas.objects.some(object => object.kind === 'siteHouse')).toBe(true);
    const original = await readConstructionSiteDocument(page);
    for (const viewport of [{width: 915, height: 393}, {width: 740, height: 320},
      {width: 1024, height: 600}, {width: 1440, height: 1100}]) {
      await page.setViewportSize(viewport);
      const mobile = viewport.width <= 767 || viewport.height <= 600;
      if (mobile) await expect(page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true})).toBeVisible();
      else await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
      expect(await selectCanvasObjectByMyTypeByDebug(page, 'siteHouse', true, true)).toBe(true);
      if (mobile) await page.getByRole('button', {name: 'Editar', exact: true}).tap();
      const editor = page.getByRole('dialog', {name: 'Editar Casa', exact: true});
      await expect(editor).toBeVisible();
      const input = editor.getByRole('textbox', {name: 'Casa', exact: true});
      await page.evaluate(() => document.fonts.ready);
      await input.fill('Rascunho que será descartado');
      const metrics = await focusPaint(input);
      expect(metrics.visibleFocus).toBe(true);
      expect(metrics.clippedBy).toEqual([]);
      expect(metrics.pageOverflow).toBe(false);
      const content = editor.locator('[data-rac-modal-region="content"]');
      expect(await content.evaluate(element => getComputedStyle(element).overflowY)).toBe('auto');
      await expect(editor.getByRole('button', {name: 'Confirmar', exact: true})).toBeInViewport();
      await page.screenshot({path: testInfo.outputPath(`campo-${viewport.width}-${viewport.height}.png`)});
      await editor.getByRole('button', {name: 'Cancelar', exact: true}).click();
      await expect(editor).toBeHidden();
    }
    expect((await readConstructionSiteDocument(page))?.constructionSites[0].houses[0].drawingDocument)
      .toEqual(original?.constructionSites[0].houses[0].drawingDocument);
  });
});
