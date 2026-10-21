import {expect, test, type Page} from '@playwright/test';
import type {CanvasGroup} from '../client/src/components/rac-editor/@canvas/lib/canvas';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {createHouse, setupRacEditorPage, ensureOverflowMenuOpen, getActiveCanvasObjectSummaryByDebug, getCanvasPosition,
  setCanvasPositionByDebug, selectCanvasObjectByMyTypeByDebug, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';

const evidence = resolve(process.env.SELECTION_EVIDENCE_DIR ?? 'outputs/selecao-redimensionamento-mobile-20261020');
test.use({isMobile: true, hasTouch: true});
test.beforeEach(async ({page}) => startConsoleErrorCapture(page));
test.afterEach(async ({page}) => expectNoConsoleErrors(page));

async function fixture(page: Page, enabled: boolean, mode: 'Seleção' | 'Panning') {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {insertInitialViews: false, canvasObjects: [600, 800].map((left, index) => ({
    id: `resize-square-${index}`, kind: 'square', shape: 'group',
    geometry: {left, top: 600, width: 60, height: 60}, metadata: {originX: 'center', originY: 'center'},
    children: [{id: `resize-body-${index}`, kind: 'square-body', shape: 'rect',
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

for (const mode of ['Seleção', 'Panning'] as const) {
  test(`redimensiona um item em ${mode} sem mover a viewport ou abrir edição`, async ({page}) => {
    const {cdp, touch, center, zoom, drawing, screenshot} = await fixture(page, false, mode);
    const viewport = await getCanvasPosition(page), before = await drawing(), first = center(600);
    await touch('touchStart', [first]);
    if (mode === 'Panning') await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
    await touch('touchEnd', []);
    await expect(page.getByText('Item selecionado. Arraste para movê-lo.')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Editar', exact: true})).toBeEnabled();
    for (const name of ['Editar', 'Escalar']) {
      const box = (await page.getByRole('button', {name, exact: true}).boundingBox())!;
      expect(box.width).toBe(80);
      expect(box.height).toBe(44);
    }
    await expect(page.getByRole('button', {name: 'Mover', exact: true})).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await screenshot(`${mode}-mover`);
    await page.getByRole('button', {name: 'Escalar', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Escalar', exact: true})).toHaveCount(0);
    const move = page.getByRole('button', {name: 'Mover', exact: true});
    await expect(move).toHaveAttribute('aria-pressed', 'true');
    expect((await move.boundingBox())!.width).toBe(80);
    expect((await move.boundingBox())!.height).toBe(44);
    await expect(page.getByText('Arraste os pontos destacados para escalar.')).toBeVisible();
    await screenshot(`${mode}-alcas`);
    const corner = {...first, x: first.x + 30.5 * zoom + 8, y: first.y + 30.5 * zoom + 8};
    await touch('touchStart', [corner]);
    await touch('touchMove', [{...corner, x: corner.x + 32, y: corner.y + 32}]);
    await touch('touchEnd', []);
    await expect.poll(async () => (await drawing()).objects[0].geometry!.scaleX ?? 1).toBeGreaterThan(before.objects[0].geometry!.scaleX ?? 1);
    expect(await getCanvasPosition(page)).toEqual(viewport);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await screenshot(`${mode}-redimensionado`);
    await page.getByRole('button', {name: 'Mover', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Escalar', exact: true})).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('Item selecionado. Arraste para movê-lo.')).toBeVisible();
    await cdp.detach();
  });
}

test('seleção múltipla redimensiona os dois itens e mantém barra dentro do viewport', async ({page}) => {
  const {cdp, touch, center, zoom, drawing, screenshot} = await fixture(page, false, 'Seleção');
  const viewport = await getCanvasPosition(page), before = await drawing(), first = center(600), second = center(800);
  await touch('touchStart', [{x: first.x - 60 * zoom, y: first.y - 60 * zoom, id: 1}]);
  await touch('touchMove', [{x: second.x + 60 * zoom, y: second.y + 60 * zoom, id: 1}]);
  await touch('touchEnd', []);
  await expect(page.getByText('Itens selecionados. Arraste para movê-los.')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Editar', exact: true})).toHaveCount(0);
  await screenshot('multiplos-mover');
  await page.getByRole('button', {name: 'Escalar', exact: true}).click();
  await screenshot('multiplos-alcas');
  const corner = {...second, x: second.x + 30.5 * zoom + 8, y: second.y + 30.5 * zoom + 8};
  await touch('touchStart', [corner]);
  await touch('touchMove', [{...corner, x: corner.x + 40, y: corner.y + 10}]);
  await touch('touchEnd', []);
  for (let i = 0; i < 2; i++) {
    await expect.poll(async () => (await drawing()).objects[i].geometry!.scaleX ?? 1).toBeGreaterThan(before.objects[i].geometry!.scaleX ?? 1);
  }
  expect(await getCanvasPosition(page)).toEqual(viewport);
  await screenshot('multiplos-redimensionados');
  await page.setViewportSize({width: 667, height: 375});
  const box = (await page.getByLabel('Ações da seleção').boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(375);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(667);
  await screenshot('multiplos-667x375');
  await cdp.detach();
});

test('planta real da fábrica escala pelos cantos sem abrir editor automaticamente', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await setupRacEditorPage(page);
  await createHouse(page, 'tipo6');
  await page.setViewportSize({width: 852, height: 393});
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  const bounds = await page.evaluate(() => {
    const debug = (window as unknown as {__racDebug: {getHouse: () => {views: {top: {group: CanvasGroup}[]}}}}).__racDebug;
    return debug.getHouse().views.top[0].group.getBoundingRect();
  });
  const zoom = (await getCanvasPosition(page))!.zoom;
  const x = (bounds.left + bounds.width / 2) * zoom - 426;
  const y = (bounds.top + bounds.height / 2) * zoom - 165;
  await setCanvasPositionByDebug(page, x, y);
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeCloseTo(x);
  await expect.poll(async () => (await getCanvasPosition(page))!.y).toBeCloseTo(y);
  await expect.poll(async () => selectCanvasObjectByMyTypeByDebug(page, 'house', false, true)).toBe(true);
  await expect(page.getByText('Item selecionado. Arraste para movê-lo.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  mkdirSync(evidence, {recursive: true});
  await expect(page.getByText('Vista Planta adicionada!', {exact: true})).toBeHidden();
  await page.screenshot({path: resolve(evidence, 'planta-mover.png')});
  await page.getByRole('button', {name: 'Escalar', exact: true}).click();
  await page.screenshot({path: resolve(evidence, 'planta-alcas.png')});
  const viewport = await getCanvasPosition(page);
  const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
  const corner = {x: surface.x + (bounds.left + bounds.width) * zoom + 8,
    y: surface.y + (bounds.top + bounds.height) * zoom + 8, id: 1};
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [corner]});
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{...corner, x: corner.x + 24, y: corner.y + 12}]});
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await expect.poll(() => page.evaluate(() => {
    const debug = (window as unknown as {__racDebug: {getHouse: () => {views: {top: {group: CanvasGroup}[]}}}}).__racDebug;
    return debug.getHouse().views.top[0].group.getBoundingRect().width;
  })).toBeGreaterThan(bounds.width);
  expect(await getCanvasPosition(page)).toEqual(viewport);
  await cdp.detach();
  await page.screenshot({path: resolve(evidence, 'planta-redimensionada.png')});
  await page.setViewportSize({width: 667, height: 375});
  const box = (await page.getByLabel('Ações da seleção').boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(375);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(667);
  await page.screenshot({path: resolve(evidence, 'planta-667x375.png')});
  await page.setViewportSize({width: 1280, height: 900});
  await expect(page.getByLabel('Ações da seleção')).toHaveCount(0);
});
