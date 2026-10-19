import {expect, test, type Page} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {getActiveCanvasObjectSummaryByDebug, getCanvasPosition, setCanvasPositionByDebug, showCanvasTopBar,
  startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';

const evidence = resolve('outputs/uiux-20261019-v002-correcoes');
mkdirSync(resolve(evidence, 'screenshots'), {recursive: true});
mkdirSync(resolve(evidence, 'artifacts'), {recursive: true});
test.use({viewport: {width: 852, height: 393}, isMobile: true, hasTouch: true});
test.beforeEach(async ({page}) => startConsoleErrorCapture(page));
test.afterEach(async ({page}) => expectNoConsoleErrors(page));

async function fixture(page: Page, built = false) {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {insertInitialViews: false, canvasObjects: [600, 800].map((left, index) => ({
    id: `v002-square-${index}`, kind: 'square', shape: 'group',
    geometry: {left, top: 600, width: 60, height: 60}, metadata: {originX: 'center', originY: 'center'},
    children: [{id: `v002-body-${index}`, kind: 'square-body', shape: 'rect',
      geometry: {left: -30, top: -30, width: 60, height: 60}, style: {fill: index ? '#93c5fd' : '#c4b5fd'}}],
  }))});
  if (built) {
    const data = (await readConstructionSiteDocument(page))!;
    data.constructionSites[0].houses[0].status = 'built';
    await page.evaluate<void, unknown>(data => new Promise<void>((done, reject) => {
      const request = indexedDB.open('rac-designer-teto', 2);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('construction-site-documents', 'readwrite');
        tx.objectStore('construction-site-documents').put(data, 'construction-sites');
        tx.oncomplete = () => {db.close(); done();};
        tx.onerror = () => {db.close(); reject(tx.error);};
      };
      request.onerror = () => reject(request.error);
    }), data);
    await page.reload({waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
  }
  await page.setViewportSize({width: 852, height: 393});
  await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  for (let i = 0; i < 20 && (await getCanvasPosition(page))!.zoom < 1; i++) {
    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {ctrlKey: true, deltaY: -100});
  }
  const zoom = (await getCanvasPosition(page))!.zoom;
  await setCanvasPositionByDebug(page, 700 * zoom - 426, 600 * zoom - 196);
  const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
  const center = (left: number) => ({x: surface.x + left * zoom, y: surface.y + 600 * zoom, id: 1});
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', touchPoints: Array<{x: number; y: number; id: number}>) =>
    cdp.send('Input.dispatchTouchEvent', {type, touchPoints});
  const document = async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas;
  return {cdp, touch, center, document, zoom};
}

async function mode(page: Page, name: 'Panning' | 'Seleção', choose = false) {
  await showCanvasTopBar(page);
  await page.getByRole('button', {name: /Zoom atual/}).click();
  const button = page.getByRole('button', {name: new RegExp(`^${name}`)});
  if (choose) await button.click();
  else await expect(button).toHaveClass(/bg-blue-50/);
  await page.keyboard.press('Escape');
}

test('V002 A014: espera seleciona em Pan, arrasta só o objeto e pinça cancela a espera', async ({page}) => {
  const {touch, center, document, cdp} = await fixture(page);
  await mode(page, 'Panning');
  const before = structuredClone(await document()), viewport = await getCanvasPosition(page), start = center(600);
  await touch('touchStart', [start]);
  expect(await getActiveCanvasObjectSummaryByDebug(page)).toBeNull();
  await page.waitForTimeout(600); // Tempo do gesto solicitado, não espera de preparação da página.
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
  await expect(page.getByText('Item selecionado · arraste para mover apenas o item')).toBeVisible();
  await page.screenshot({path: resolve(evidence, 'screenshots/a014-hold-panning.png'), animations: 'disabled'});
  await touch('touchMove', [{...start, x: start.x + 40, y: start.y + 20}]);
  await touch('touchEnd', []);
  await expect.poll(async () => (await document()).objects[0].geometry!.left!).toBeGreaterThan(before.objects[0].geometry!.left!);
  expect(await getCanvasPosition(page)).toEqual(viewport);
  await mode(page, 'Panning'); // A ferramenta não muda implicitamente.
  const releasedSelection = structuredClone(await document());
  const nextStart = {...start, x: start.x + 40, y: start.y + 20};
  await touch('touchStart', [nextStart]);
  await touch('touchMove', [{...nextStart, x: nextStart.x + 20}]);
  await touch('touchEnd', []);
  await expect.poll(async () => (await document()).objects[0].geometry!.left!)
    .toBeGreaterThan(releasedSelection.objects[0].geometry!.left!);
  expect(await getCanvasPosition(page)).toEqual(viewport);
  const afterDrag = structuredClone(await document());
  await page.screenshot({path: resolve(evidence, 'screenshots/a014-arrasto-isolado.png'), animations: 'disabled'});
  const second = center(800);
  await touch('touchStart', [second]);
  await page.waitForTimeout(150);
  await touch('touchStart', [second, {...second, x: second.x + 70, id: 2}]);
  await page.waitForTimeout(500);
  await touch('touchMove', [{...second, x: second.x - 10}, {...second, x: second.x + 90, id: 2}]);
  await touch('touchEnd', []);
  expect(await getActiveCanvasObjectSummaryByDebug(page)).toBeNull();
  expect(await document()).toEqual(afterDrag);
  expect((await getCanvasPosition(page))!.zoom).toBeGreaterThan(viewport!.zoom);
  writeFileSync(resolve(evidence, 'artifacts/a014-pan-hold.json'), JSON.stringify({viewport: page.viewportSize(), before,
    afterDrag, viewportBefore: viewport, viewportAfterPinch: await getCanvasPosition(page), panningStillSelected: true,
    secondFingerCancelledHold: true, device: 'Chromium CDP; sem iPhone físico'}, null, 2));
  await cdp.detach();
});

test('V002 A014: Seleção usa toque simples e retângulo múltiplo sem pan; mantém pinça', async ({page}) => {
  const {touch, center, document, zoom, cdp} = await fixture(page);
  await mode(page, 'Seleção', true);
  const before = structuredClone(await document()), viewport = await getCanvasPosition(page), first = center(600), second = center(800);
  await touch('touchStart', [first]); await touch('touchEnd', []);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
  const start = {x: first.x - 55 * zoom, y: first.y - 65 * zoom, id: 1};
  const end = {x: second.x + 55 * zoom, y: second.y + 65 * zoom, id: 1};
  await touch('touchStart', [start]); await touch('touchMove', [end]); await touch('touchEnd', []);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.type?.toLowerCase()).toBe('activeselection');
  expect(await getCanvasPosition(page)).toEqual(viewport);
  expect(await document()).toEqual(before);
  await page.screenshot({path: resolve(evidence, 'screenshots/a014-selecao-multipla.png'), animations: 'disabled'});
  await touch('touchStart', [{x: 360, y: 196, id: 1}, {x: 460, y: 196, id: 2}]);
  await touch('touchMove', [{x: 340, y: 196, id: 1}, {x: 480, y: 196, id: 2}]);
  await touch('touchEnd', []);
  expect((await getCanvasPosition(page))!.zoom).toBeGreaterThan(viewport!.zoom);
  expect(await document()).toEqual(before);
  writeFileSync(resolve(evidence, 'artifacts/a014-selecao.json'), JSON.stringify({viewport: page.viewportSize(),
    nativeMultipleSelection: true, tapSelection: true, viewportBefore: viewport, viewportAfterPinch: await getCanvasPosition(page),
    drawingUnchanged: true}, null, 2));
  await cdp.detach();
});

test('V002 A014: toque prolongado em consulta não move nem salva objetos', async ({page}) => {
  const {touch, center, document, cdp} = await fixture(page, true);
  await mode(page, 'Panning');
  const before = structuredClone(await document()), viewport = await getCanvasPosition(page), start = center(600);
  await touch('touchStart', [start]); await page.waitForTimeout(600);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('square');
  await touch('touchMove', [{...start, x: start.x + 40, y: start.y + 20}]); await touch('touchEnd', []);
  expect(await document()).toEqual(before);
  expect(await getCanvasPosition(page)).toEqual(viewport);
  await cdp.detach();
});
