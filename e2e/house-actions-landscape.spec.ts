import {expect, test} from '@playwright/test';
import {setupMobileFirstRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';

test.use({viewport: {width: 420, height: 844}, isMobile: true, hasTouch: true});
test.beforeEach(({page}) => startConsoleErrorCapture(page));
test.afterEach(({page}) => expectNoConsoleErrors(page));

test('alinha o resumo aos demais ícones e mantém os alvos nos cards responsivos', async ({page}, testInfo) => {
  await setupMobileFirstRacEditorPage(page, {insertInitialViews: true});
  await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).tap();
  const card = page.getByTestId('house-mobile-list').getByTestId('house-mobile-card').filter({hasText: 'Família E2E'});
  const actions = card.getByRole('group', {name: 'Ações da casa'});
  for (const viewport of [{width: 390, height: 844}, {width: 480, height: 844},
    {width: 740, height: 360}, {width: 915, height: 393}]) {
    await page.setViewportSize(viewport);
    await expect(actions).toBeVisible();
    await actions.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const metrics = await actions.evaluate(element => ({
      mode: element.getAttribute('data-label-mode'),
      width: element.clientWidth, scrollWidth: element.scrollWidth,
      buttons: [...element.querySelectorAll('button')].map(button => {
        const box = button.getBoundingClientRect();
        const icon = button.querySelector('svg')!.getBoundingClientRect();
        return {name: button.getAttribute('aria-label'), width: box.width, height: box.height,
          centerY: icon.y + icon.height / 2};
      }),
    }));
    const summary = metrics.buttons.find(button => button.name?.startsWith('Resumo da Casa'))!;
    const download = metrics.buttons.find(button => button.name?.startsWith('Exportar RAC PDF'))!;
    expect(metrics.buttons).toHaveLength(6);
    expect(Math.abs(summary.centerY - download.centerY)).toBeLessThanOrEqual(1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    for (const button of metrics.buttons) {
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(button.width - summary.width)).toBeLessThanOrEqual(1);
    }
    await testInfo.attach(`geometria-${viewport.width}`, {body: JSON.stringify(metrics), contentType: 'application/json'});
    await page.screenshot({path: testInfo.outputPath(`acoes-${viewport.width}.png`)});
  }
});

for (const viewport of [{width: 852, height: 393}, {width: 915, height: 320}]) {
  test(`cards e ações da casa no mobile horizontal em ${viewport.width} × ${viewport.height}`, async ({page}, testInfo) => {
    await setupMobileFirstRacEditorPage(page, {insertInitialViews: true});
    await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).tap();
    await expect(page.getByTestId('house-mobile-list')).toBeVisible();
    await page.setViewportSize(viewport);
    const table = page.getByTestId('house-desktop-table');
    const list = page.getByTestId('house-mobile-list');
    await expect(list).toBeVisible();
    await expect(table).toBeHidden();
    await expect(page.getByTestId('house-mobile-pagination')).toBeVisible();
    await expect(page.getByTestId('house-desktop-pagination')).toBeHidden();
    const card = list.getByTestId('house-mobile-card').filter({hasText: 'Família E2E'});
    const actions = card.getByRole('group', {name: 'Ações da casa'});
    await expect(actions.getByRole('button')).toHaveCount(6);
    const analysis = actions.getByRole('button', {name: 'Pilotis da casa Família E2E', exact: true});
    const reset = actions.getByRole('button', {name: 'Redefinir casa Família E2E', exact: true});
    await expect(analysis).toBeEnabled();
    await expect(reset).toBeEnabled();
    await actions.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const actionBoxes = await actions.getByRole('button').evaluateAll(buttons =>
      buttons.map(button => {const {x, y, width, height} = button.getBoundingClientRect(); return {x, y, width, height};}));
    for (const [index, box] of actionBoxes.entries()) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      for (const other of actionBoxes.slice(index + 1)) {
        const x = Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x);
        const y = Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y);
        expect(x <= 0 || y <= 0).toBe(true);
      }
    }
    await page.screenshot({path: testInfo.outputPath('cards-mobile-horizontal.png')});
    await analysis.tap();
    await expect(page.getByRole('region', {name: 'Análise de Campo da casa Família E2E'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Selecionar piloti A1', exact: true})).toBeVisible();
    await page.getByRole('button', {name: 'Voltar às casas', exact: true}).tap();
    await expect(list).toBeVisible();
    const before = (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0];
    await reset.tap();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', {name: 'Cancelar', exact: true}).tap();
    await expect(dialog).toBeHidden();
    expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0]).toEqual(before);
    await expect(list).toBeVisible();
    await reset.tap();
    await expect(dialog).toBeVisible();
    // O comando da confirmação continua válido se a viewport mudar enquanto ela estiver aberta.
    await page.setViewportSize({width: 1280, height: 900});
    await expect(table).toBeVisible();
    await expect(list).toBeHidden();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', {name: 'Redefinir Casa', exact: true}).tap();
    await expect(dialog).toBeHidden();
    await expect.poll(async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].houseType).toBeNull();
    await expect(table.getByRole('row', {name: /Família E2E/})).toContainText('Inicial');
    await page.reload({waitUntil: 'domcontentloaded'});
    expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].houseType).toBeNull();
  });
}

test('alterna cards e tabela nos limites da política nativa sem perder filtro e ordenação', async ({page}) => {
  await setupMobileFirstRacEditorPage(page, {insertInitialViews: true});
  await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).tap();
  const list = page.getByTestId('house-mobile-list');
  const table = page.getByTestId('house-desktop-table');
  for (const viewport of [
    {width: 767, height: 900, cards: true},
    {width: 768, height: 900, cards: false},
    {width: 1024, height: 600, cards: true},
    {width: 1024, height: 601, cards: false},
    {width: 915, height: 393, cards: true},
    {width: 420, height: 844, cards: true},
  ]) {
    await page.setViewportSize(viewport);
    await expect(list).toBeVisible({visible: viewport.cards});
    await expect(table).toBeVisible({visible: !viewport.cards});
    await expect(page.getByTestId('house-mobile-pagination')).toBeVisible({visible: viewport.cards});
    await expect(page.getByTestId('house-desktop-pagination')).toBeVisible({visible: !viewport.cards});
    await expect(page.getByRole('button', {name: 'Filtrar casas por status'})).toContainText('Todos');
    await expect(page.getByRole('button', {name: 'Ordenar casas por'})).toContainText('Última modificação');
  }
});

test.describe('Desktop com ponteiro fino', () => {
  test.use({isMobile: false, hasTouch: false});
  test('mantém a tabela mesmo com altura reduzida', async ({page}) => {
    await setupMobileFirstRacEditorPage(page, {insertInitialViews: true});
    await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).click();
    await page.setViewportSize({width: 915, height: 393});
    await expect(page.getByTestId('house-desktop-table')).toBeVisible();
    await expect(page.getByTestId('house-mobile-list')).toBeHidden();
    await expect(page.getByTestId('house-desktop-pagination')).toBeVisible();
    await expect(page.getByTestId('house-mobile-pagination')).toBeHidden();
  });
});
