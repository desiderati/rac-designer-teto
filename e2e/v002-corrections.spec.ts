import {expect, test} from '@playwright/test';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

const fixturePath = `/@fs${resolve('e2e/fixtures/v002-review.html')}`;
test.use({launchOptions: {ignoreDefaultArgs: ['--hide-scrollbars']}});

for (const viewport of [{width: 360, height: 800}, {width: 390, height: 844}, {width: 740, height: 360}]) {
  test(`A-006 aviso curto sem scroll e mensagem longa acessível em ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto(fixturePath);
    await page.addStyleTag({content: '*::-webkit-scrollbar {width: 16px; height: 16px;}'});
    await page.getByRole('button', {name: 'Salvar análise', exact: true}).click();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toHaveAttribute('data-mounted', 'true');
    await expect(toast).toContainText('Análise de Campo salva.');
    const metrics = await toast.evaluate((element) => {
      const icon = element.querySelector('[data-icon]')!;
      const svg = icon.querySelector('svg')!;
      const a = icon.getBoundingClientRect(), b = svg.getBoundingClientRect();
      const close = element.querySelector('button')!.getBoundingClientRect();
      return {height: element.clientHeight, scroll: element.scrollHeight, width: element.clientWidth,
        scrollWidth: element.scrollWidth, dx: (a.left + a.right - b.left - b.right) / 2,
        dy: (a.top + a.bottom - b.top - b.bottom) / 2, closeHeight: close.height};
    });
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.height);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    expect(Math.abs(metrics.dx)).toBeLessThan(1);
    expect(Math.abs(metrics.dy)).toBeLessThan(1);
    expect(metrics.closeHeight).toBeGreaterThanOrEqual(44);
    await toast.screenshot({path: test.info().outputPath('A-006-curto.png')});
    await toast.getByRole('button', {name: 'Close toast'}).click();
    await expect(toast).toHaveCount(0);
    await page.getByRole('button', {name: 'Mensagem longa', exact: true}).click();
    await expect(toast).toHaveAttribute('data-mounted', 'true');
    const long = await toast.evaluate((element) => ({height: element.clientHeight, scroll: element.scrollHeight}));
    expect(long.scroll).toBeGreaterThan(long.height);
    const action = toast.getByRole('button', {name: 'Revisar análise'});
    await action.focus();
    await expect(action).toBeInViewport();
    await toast.screenshot({path: test.info().outputPath('A-006-longo.png')});
    await toast.getByRole('button', {name: 'Close toast'}).click();
    await expect(toast).toHaveCount(0);
  });
}

for (const width of [360, 767]) {
  test(`A-008 e A-014 em ${width}px preservam planta selecionável e resumo sem bloco textual`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.goto(fixturePath);
    await page.getByRole('button', {name: 'Planta', exact: true}).click();
    const preview = page.getByLabel('Planta da casa: selecione um piloti', {exact: true});
    await expect(preview.getByRole('button')).toHaveCount(12);
    await preview.getByRole('button', {name: 'Selecionar piloti C4', exact: true}).click();
    await expect(preview.getByRole('button', {name: 'Selecionar piloti C4', exact: true})).toHaveAttribute('aria-pressed', 'true');
    await expect(preview.getByRole('button', {name: 'Selecionar piloti A2', exact: true})).toHaveAttribute('aria-pressed', 'false');
    const bounds = await preview.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return [...element.querySelectorAll('button')].every((button) => {
        const b = button.getBoundingClientRect();
        return b.width >= 44 && b.height >= 44 && b.left >= rect.left && b.right <= rect.right
          && b.top >= rect.top && b.bottom <= rect.bottom;
      });
    });
    expect(bounds).toBe(true);
    await preview.screenshot({path: test.info().outputPath('A-008-planta.png')});
    await page.getByRole('button', {name: 'Resumo', exact: true}).click();
    await page.getByRole('button', {name: 'Resumo da Casa de Validação V-002', exact: true}).click();
    const content = page.getByRole('dialog', {name: 'Resumo da Casa'});
    await expect(content).toBeVisible();
    await expect(content).not.toContainText(/Tipo da casa|Tamanho da casa|Pilotis .* m:/);
    await expect(content).toContainText('Vigas p/ Escada');
    await expect(content).toContainText('Manta Asfáltica');
    const miniature = content.locator('svg[role="img"]').first();
    await expect(miniature).toBeVisible();
    await expect(miniature).toHaveAccessibleName(/porta no lado inferior/);
    await expect(miniature.getByText('Porta', {exact: true})).toBeVisible();
    await content.screenshot({path: test.info().outputPath('A-014-resumo.png')});
    await page.keyboard.press('Escape');
    await expect(content).toHaveCount(0);
  });
}

test('A-021 volta às construções em retrato usando a navegação real e preserva a casa', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {insertInitialViews: true, pilotis: {
    piloti_0_0: {height: 1.2, nivel: .25, isMaster: true},
  }});
  await page.setViewportSize({width: 390, height: 844});
  const dialog = page.getByRole('dialog', {name: 'Gire seu celular'});
  await expect(dialog).toBeVisible();
  const before = await readConstructionSiteDocument(page);
  await expect(page.getByRole('button', {name: 'Mostrar barra superior'})).toHaveCount(0);
  await expect(dialog.getByRole('button', {name: 'Close', exact: true})).toHaveCount(0);
  const back = dialog.getByRole('button', {name: 'Voltar às construções', exact: true});
  const colors = await back.evaluate((element) => {
    const style = getComputedStyle(element);
    return {background: style.backgroundColor, foreground: style.color};
  });
  expect(colors.background).toBe('rgba(226, 232, 240, 0.6)');
  expect(colors.foreground).toBe('rgb(15, 23, 42)');
  await back.focus();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.screenshot({path: test.info().outputPath('A-021-retrato.png')});
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
  await expect(dialog).toHaveCount(0);
  const after = await readConstructionSiteDocument(page);
  expect(after?.constructionSites[0].houses[0].drawingDocument).toEqual(before?.constructionSites[0].houses[0].drawingDocument);
  await page.screenshot({path: test.info().outputPath('A-021-construcoes.png')});
});
