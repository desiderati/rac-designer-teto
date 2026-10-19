import {expect, test} from '@playwright/test';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {createHouse, expectCanvasObjectsPersisted, getCanvasPosition, setCanvasPositionByDebug, setupRacEditorPage, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';

test.use({viewport: {width: 915, height: 320}, isMobile: true, hasTouch: true});

test.beforeEach(async ({page}) => {
  startConsoleErrorCapture(page);
  await page.setViewportSize({width: 1280, height: 900});
  await setupRacEditorPage(page);
  await createHouse(page, 'tipo6');
  await expectCanvasObjectsPersisted(page, ['house']);
  await page.setViewportSize({width: 915, height: 320});
  for (let i = 0; i < 20 && (await getCanvasPosition(page))!.zoom < 1.2; i++) {
    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {ctrlKey: true, deltaY: -100});
  }
  await expect.poll(async () => (await getCanvasPosition(page))!.zoom).toBeGreaterThan(1.1);
});
test.afterEach(async ({page}) => expectNoConsoleErrors(page));

test('Canvas horizontal usa a altura visível e enquadra a página inteira após zoom alto', async ({page}, testInfo) => {
  const container = page.getByTestId('rac-canvas-container');
  const viewport = page.viewportSize()!;
  const box = (await container.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(viewport.height);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  const before = (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas;
  expect(before.objects.length).toBeGreaterThan(0);
  for (let i = 0; i < 10; i++) await container.dispatchEvent('wheel', {ctrlKey: true, deltaY: -100});
  await setCanvasPositionByDebug(page, 1000, 800);
  await showCanvasTopBar(page);
  await page.getByRole('button', {name: /Zoom atual/}).click();
  await page.getByRole('button', {name: /Fit to View/}).click();
  await expect.poll(async () => (await page.getByTestId('rac-canvas-surface').boundingBox())!.height).toBeLessThanOrEqual(viewport.height * 0.96);
  const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
  expect(surface.x).toBeGreaterThanOrEqual(box.x);
  expect(surface.y).toBeGreaterThanOrEqual(box.y);
  expect(surface.x + surface.width).toBeLessThanOrEqual(box.x + box.width);
  expect(surface.y + surface.height).toBeLessThanOrEqual(box.y + box.height);
  expect(Math.abs(surface.x + surface.width / 2 - (box.x + box.width / 2))).toBeLessThan(1);
  expect(Math.abs(surface.y + surface.height / 2 - (box.y + box.height / 2))).toBeLessThan(1);
  expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas).toEqual(before);
  await page.screenshot({path: testInfo.outputPath('canvas-fit-mobile.png')});
});

test('arrasta com um dedo em celular acima de 767 px sem deslocar os objetos', async ({page}) => {
  await setCanvasPositionByDebug(page, 300, 200);
  const before = (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas;
  expect(before.objects.length).toBeGreaterThan(0);
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 500, y: 180, id: 1}]});
  await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 430, y: 140, id: 1}]});
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeCloseTo(370, 0);
  await expect.poll(async () => (await getCanvasPosition(page))!.y).toBeCloseTo(240, 0);
  expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas).toEqual(before);
  await session.detach();
});

test('pinça combina zoom e translação mantendo o ponto sob os dedos', async ({page}) => {
  // O fator parte do zoom real inicial, pois a abertura pode enquadrar o documento.
  await setCanvasPositionByDebug(page, 300, 200);
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBe(300);
  await expect.poll(async () => (await getCanvasPosition(page))!.y).toBe(200);
  const initial = (await getCanvasPosition(page))!;
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 200, y: 150, id: 1}, {x: 300, y: 150, id: 2}]});
  await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 250, y: 130, id: 1}, {x: 390, y: 130, id: 2}]});
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  await expect.poll(async () => (await getCanvasPosition(page))!.zoom).toBeGreaterThan(initial.zoom);
  const position = (await getCanvasPosition(page))!;
  const expectedX = (initial.x + 250) * position.zoom / initial.zoom - 320;
  const expectedY = (initial.y + 150) * position.zoom / initial.zoom - 130;
  expect(position.x).toBeCloseTo(expectedX, 0);
  expect(position.y).toBeCloseTo(expectedY, 0);
  await session.detach();
});
