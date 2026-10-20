import {expect, test, type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {ensureOverflowMenuOpen, getActiveCanvasObjectSummaryByDebug, getCanvasPosition,
  setCanvasPositionByDebug, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';

const evidence = resolve('outputs/minimapa-arrasto-mobile-20261020');
test.use({isMobile: true, hasTouch: true});
test.beforeEach(async ({page}) => startConsoleErrorCapture(page));
test.afterEach(async ({page}) => expectNoConsoleErrors(page));

async function fixture(page: Page, enabled: boolean, mode: 'Seleção' | 'Panning') {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {insertInitialViews: false, canvasObjects: [600, 800].map((left, index) => ({
    id: `minimap-square-${index}`, kind: 'square', shape: 'group',
    geometry: {left, top: 600, width: 60, height: 60}, metadata: {originX: 'center', originY: 'center'},
    children: [{id: `minimap-body-${index}`, kind: 'square-body', shape: 'rect',
      geometry: {left: -30, top: -30, width: 60, height: 60}, style: {fill: index ? '#93c5fd' : '#c4b5fd'}}],
  }))});
  await ensureOverflowMenuOpen(page);
  await page.getByRole('button', {name: 'Configurações', exact: true}).click();
  await page.getByLabel('Habilitar mini-mapa no canvas').setChecked(enabled);
  await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
  await page.keyboard.press('Escape');
  await page.setViewportSize({width: 852, height: 393});
  for (let i = 0; i < 20 && (await getCanvasPosition(page))!.zoom < 1; i++) {
    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {ctrlKey: true, deltaY: -100});
  }
  const zoom = (await getCanvasPosition(page))!.zoom;
  await setCanvasPositionByDebug(page, 700 * zoom - 426, 600 * zoom - 196);
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeCloseTo(700 * zoom - 426);
  await expect.poll(async () => (await getCanvasPosition(page))!.y).toBeCloseTo(600 * zoom - 196);
  await showCanvasTopBar(page);
  await page.getByRole('button', {name: /Zoom atual/}).click();
  const tool = page.getByRole('button', {name: new RegExp(`^${mode}`)});
  await tool.click();
  await expect(tool).toHaveClass(/bg-blue-50/);
  await page.keyboard.press('Escape');
  if (mode === 'Panning') await expect(page.getByTestId('rac-canvas-container')).toHaveCSS('cursor', 'grab');
  const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
  const center = (left: number) => ({x: surface.x + left * zoom, y: surface.y + 600 * zoom, id: 1});
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', touchPoints: Array<{x: number; y: number; id: number}>) =>
    cdp.send('Input.dispatchTouchEvent', {type, touchPoints});
  const drawing = async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas;
  const minimap = page.locator('[data-testid="rac-minimap"]:visible');
  const screenshot = async (name: string) => {
    mkdirSync(evidence, {recursive: true});
    await page.screenshot({path: resolve(evidence, `${name}.png`)});
  };
  return {cdp, touch, center, zoom, drawing, minimap, screenshot};
}

for (const enabled of [false, true]) {
  test(`arrasto simples e múltiplo com preferência ${enabled}`, async ({page}) => {
    const {cdp, touch, center, zoom, drawing, minimap, screenshot} = await fixture(page, enabled, 'Seleção');
    const prefix = enabled ? 'habilitado' : 'temporario';
    const viewport = await getCanvasPosition(page);
    const before = await drawing();
    const first = center(600), second = center(800);
    await touch('touchStart', [first]); await touch('touchEnd', []);
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
    await expect(minimap).toHaveCount(enabled ? 1 : 0);
    await screenshot(`${prefix}-selecionado`);
    await touch('touchStart', [first]);
    await touch('touchMove', [{...first, x: first.x + 20, y: first.y + 20}]);
    await expect(minimap).toHaveCount(1);
    await screenshot(`${prefix}-um-item-durante`);
    await touch('touchEnd', []);
    await expect(minimap).toHaveCount(enabled ? 1 : 0);
    await expect.poll(async () => (await drawing()).objects[0].geometry!.left!).toBeGreaterThan(before.objects[0].geometry!.left!);

    await touch('touchStart', [{x: first.x - 70 * zoom, y: first.y - 70 * zoom, id: 1}]);
    await touch('touchMove', [{x: second.x + 70 * zoom, y: second.y + 70 * zoom, id: 1}]);
    await touch('touchEnd', []);
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.type?.toLowerCase()).toBe('activeselection');
    await expect(minimap).toHaveCount(enabled ? 1 : 0);
    const beforeGroup = await drawing();
    await touch('touchStart', [second]);
    await touch('touchMove', [{...second, x: second.x + 40, y: second.y + 20}]);
    await expect(minimap).toHaveCount(1);
    await screenshot(`${prefix}-multiplos-durante`);
    await touch(enabled ? 'touchCancel' : 'touchEnd', []);
    await expect(minimap).toHaveCount(enabled ? 1 : 0);
    for (let i = 0; i < 2; i++) {
      await expect.poll(async () => (await drawing()).objects[i].geometry!.left!).toBeGreaterThan(beforeGroup.objects[i].geometry!.left!);
    }
    expect(await getCanvasPosition(page)).toEqual(viewport);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rac-settings')!).zoomEnabledByDefault)).toBe(enabled);
    await screenshot(`${prefix}-depois`);
    await cdp.detach();
  });
}

test('arrasto após toque prolongado em Panning usa o mesmo minimapa temporário', async ({page}) => {
  const {cdp, touch, center, drawing, minimap, screenshot} = await fixture(page, false, 'Panning');
  const viewport = await getCanvasPosition(page), before = await drawing(), first = center(600);
  await touch('touchStart', [first]);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
  await expect(minimap).toHaveCount(0); // Seleção por espera não basta: precisa mover.
  await touch('touchMove', [{...first, x: first.x + 40, y: first.y + 20}]);
  await expect(minimap).toHaveCount(1);
  await screenshot('toque-prolongado-durante');
  await touch('touchCancel', []);
  await expect(minimap).toHaveCount(0);
  await expect.poll(async () => (await drawing()).objects[0].geometry!.left!).toBeGreaterThan(before.objects[0].geometry!.left!);
  expect(await getCanvasPosition(page)).toEqual(viewport);
  await screenshot('toque-prolongado-cancelado');
  await cdp.detach();
});
