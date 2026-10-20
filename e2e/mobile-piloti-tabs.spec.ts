import {expect, test, type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import type {CanvasGroup} from '../client/src/components/rac-editor/@canvas/lib/canvas';
import type {HouseDrawingElementDocument} from '../client/src/shared/types/house-drawing-document';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {
  createHouse, ensureOverflowMenuOpen, getCanvasPosition, selectCanvasObjectByMyTypeByDebug,
  setCanvasPositionByDebug, setupRacEditorPage, startConsoleErrorCapture,
  expectNoConsoleErrors, triggerHouseAction,
} from './helpers/rac-editor.helpers';

const evidence = resolve(process.env.PILOTI_EVIDENCE_DIR ?? 'outputs/pilotis-abas-mobile-20261020');
test.use({isMobile: true, hasTouch: true});
test.beforeEach(({page}) => startConsoleErrorCapture(page));
test.afterEach(({page}) => expectNoConsoleErrors(page));

async function fixture(page: Page, {front = false, built = false} = {}) {
  await page.setViewportSize({width: 1280, height: 900});
  await setupRacEditorPage(page);
  await createHouse(page, 'tipo6');
  if (front) await triggerHouseAction(page, 'Frontal');
  await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites[0].houses[0]
    .drawingDocument.canvas.objects.filter(object => object.kind === 'house').length).toBe(front ? 2 : 1);
  // A fábrica cria a planta real. Somente os dados fictícios deste navegador E2E são preparados.
  const document = (await readConstructionSiteDocument(page))!;
  const house = document.constructionSites[0].houses[0];
  house.designSettings.selectedPilotiHeights = [1, 1.2, 1.5, 1.8, 2, 2.2, 2.5, 3];
  Object.entries(house.drawingDocument.house!.pilotis).forEach(([id, piloti]) => {
    Object.assign(piloti, {height: 3, nivel: 1.5, isMaster: id === 'piloti_0_0'});
  });
  if (built) house.status = 'built';
  await page.evaluate<void, unknown>(data => new Promise<void>((done, reject) => {
    const request = indexedDB.open('rac-designer-teto', 2);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('construction-site-documents', 'readwrite');
      tx.objectStore('construction-site-documents').put(data, 'construction-sites');
      tx.oncomplete = () => {db.close(); done();};
      tx.onerror = () => {db.close(); reject(tx.error);};
    };
    request.onerror = () => reject(request.error);
  }), document);
  await page.reload({waitUntil: 'domcontentloaded'});
  await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
  if (!built) {
    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Configurações', exact: true}).click();
    await page.getByLabel('Permitir o contraventamento mesmo que os pilotis estejam dentro da proporção').check();
    await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width: 852, height: 393});
  await expect(page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true})).toBeVisible();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  const bounds = await page.evaluate(() => {
    const debug = (window as unknown as {__racDebug: {getHouse: () => {views: {top: {group: CanvasGroup}[]}}}}).__racDebug;
    return debug.getHouse().views.top[0].group.getBoundingRect();
  });
  const zoom = (await getCanvasPosition(page))!.zoom;
  const x = (bounds.left + bounds.width / 2) * zoom - 210;
  const y = (bounds.top + bounds.height / 2) * zoom - 180;
  await setCanvasPositionByDebug(page, x, y);
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeCloseTo(x);
  await expect.poll(async () => (await getCanvasPosition(page))!.y).toBeCloseTo(y);
  await expect.poll(() => selectCanvasObjectByMyTypeByDebug(page, 'house', false)).toBe(true);
  const savedHouse = async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0];
  const screenshot = async (name: string) => {
    mkdirSync(evidence, {recursive: true});
    await page.screenshot({path: resolve(evidence, `${name}.png`), animations: 'disabled'});
  };
  const editor = page.getByRole('dialog', {name: 'Editar pilotis da planta', exact: true});
  return {editor, savedHouse, screenshot};
}

test('planta abre o painel com a estética de campo e persiste edição pelas abas', async ({page}) => {
  const {editor, savedHouse, screenshot} = await fixture(page);
  await expect(editor).toHaveCount(0);
  const edit = page.getByRole('button', {name: 'Editar', exact: true});
  await expect(edit).toBeEnabled();
  await edit.click();
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('heading')).toHaveCount(0);
  await expect(editor.getByRole('button', {name: 'Fechar edição de pilotis', exact: true})).toHaveCount(0);
  expect((await editor.boundingBox())!.width).toBe(288);
  const tabWidths = await editor.getByRole('tab').evaluateAll(tabs => tabs.map(tab => tab.getBoundingClientRect().width));
  expect(Math.max(...tabWidths) - Math.min(...tabWidths)).toBeLessThanOrEqual(1);
  const viewport = await getCanvasPosition(page);
  await expect(editor.getByRole('tab', {name: 'Nível', exact: true})).toHaveAttribute('aria-selected', 'true');
  await screenshot('852x393-nivel');

  await editor.getByRole('button', {name: 'Selecionar piloti C4', exact: true}).click();
  await expect(editor.getByRole('button', {name: 'Selecionar piloti C4', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await editor.getByRole('switch', {name: 'Definir como Mestre?'}).setChecked(true);
  const auto = editor.getByRole('button', {name: 'Modo automático de altura dos pilotis'});
  if (await auto.getAttribute('aria-pressed') === 'true') await auto.click();
  await editor.getByRole('textbox', {name: 'Nível do piloti em metros'}).fill('0,50');
  await editor.getByRole('textbox', {name: 'Nível do piloti em metros'}).press('Enter');
  await expect.poll(async () => (await savedHouse()).drawingDocument.house!.pilotis.piloti_3_2)
    .toMatchObject({nivel: 0.5, isMaster: true});

  await editor.getByRole('tab', {name: 'Tamanho', exact: true}).click();
  const height = editor.getByRole('button', {name: 'Piloti de 1,2 metros', exact: true});
  const box = (await height.boundingBox())!;
  const grid = (await height.locator('..').boundingBox())!;
  const panel = (await editor.boundingBox())!;
  const choiceSize = (grid.width - 3 * 8) / 4;
  expect(box.width).toBeCloseTo(choiceSize);
  expect(box.height).toBeCloseTo(choiceSize);
  expect(grid.x - panel.x).toBe(12);
  expect(panel.x + panel.width - grid.x - grid.width).toBe(12);
  await screenshot('852x393-tamanho-largura-total');
  await height.click();
  await expect(editor).toBeVisible();
  await expect.poll(async () => (await savedHouse()).drawingDocument.house!.pilotis.piloti_3_2.height).toBe(1.2);

  await editor.getByRole('tab', {name: 'Contraventar', exact: true}).click();
  const brace = editor.getByRole('button', {name: 'Superior', exact: true});
  const braceBox = (await brace.boundingBox())!;
  expect(braceBox.width).toBeCloseTo(choiceSize);
  expect(braceBox.height).toBeCloseTo(choiceSize);
  await brace.click();
  await expect(editor.getByRole('button', {name: 'Selecionar piloti C1', exact: true})).toBeEnabled();
  await expect(editor.getByRole('button', {name: 'Selecionar piloti A1', exact: true})).toBeDisabled();
  await expect(editor.getByRole('button', {name: 'Selecionar piloti C4', exact: true})).toBeDisabled();
  const hint = editor.getByRole('status');
  await expect(hint).toHaveText('Selecione piloti de destino a contraventar.');
  const hintBox = (await hint.boundingBox())!;
  const buttonRow = (await brace.boundingBox())!;
  expect(hintBox.y).toBeGreaterThan(buttonRow.y + buttonRow.height);
  const sideToast = page.locator('[data-sonner-toast]').filter({hasText: 'Lado superior selecionado. Selecione o piloti final na mesma linha.'});
  await expect(sideToast).toBeVisible();
  const toastHost = sideToast.locator('xpath=..');
  await expect(toastHost).toHaveAttribute('data-x-position', 'center');
  await expect(toastHost).toHaveAttribute('data-y-position', 'top');
  await expect.poll(async () => {
    const bounds = (await sideToast.boundingBox())!;
    return Math.abs(bounds.x + bounds.width / 2 - 852 / 2);
  }).toBeLessThan(2);
  await expect.poll(async () => (await sideToast.boundingBox())!.y).toBeGreaterThanOrEqual(16);
  await screenshot('852x393-toast-topo-central');
  await expect(page.getByText('Lado superior selecionado. Selecione o piloti final na mesma linha.', {exact: true})).toBeHidden({timeout: 10000});
  await screenshot('852x393-destino-contraventamento');
  await editor.getByRole('button', {name: 'Selecionar piloti C1', exact: true}).click();
  await expect(editor).toBeVisible();
  const flatten = (elements: HouseDrawingElementDocument[]): HouseDrawingElementDocument[] =>
    elements.flatMap(element => [element, ...flatten(element.children ?? [])]);
  await expect.poll(async () => flatten((await savedHouse()).drawingDocument.canvas.objects)
    .filter(element => element.metadata?.isContraventamento).map(element => element.metadata))
    .toContainEqual(expect.objectContaining({
      contraventamentoOrientation: 'horizontal', contraventamentoRow: 2,
      contraventamentoStartCol: 0, contraventamentoEndCol: 3, contraventamentoSide: 'top',
      contraventamentoAnchorPilotiId: 'piloti_3_2', isAutoContraventamento: false,
    }));
  await screenshot('852x393-contraventamento');
  expect(await getCanvasPosition(page)).toEqual(viewport);
  expect(Object.values((await savedHouse()).drawingDocument.house!.pilotis).filter(p => p.isMaster)).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
});

test('painel permanece utilizável em 667x375 e altura reduzida', async ({page}) => {
  const {editor, screenshot} = await fixture(page);
  await page.getByRole('button', {name: 'Editar', exact: true}).click();
  await expect(editor).toBeVisible();
  await page.setViewportSize({width: 667, height: 375});
  await editor.getByRole('tab', {name: 'Tamanho', exact: true}).click();
  const dialogBox = (await editor.boundingBox())!;
  expect(dialogBox.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(667);
  expect(dialogBox.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(375);
  await expect(editor.getByRole('button', {name: 'Selecionar piloti A1', exact: true})).toBeVisible();
  const lastHeight = editor.getByRole('button', {name: 'Piloti de 3,0 metros', exact: true});
  await lastHeight.scrollIntoViewIfNeeded();
  await expect(lastHeight).toBeInViewport({ratio: 1});
  await screenshot('667x375-tamanho');
  await page.setViewportSize({width: 667, height: 320});
  await editor.getByRole('tab', {name: 'Contraventar', exact: true}).click();
  const bottomBrace = editor.getByRole('button', {name: 'Inferior', exact: true});
  await bottomBrace.scrollIntoViewIfNeeded();
  await expect(bottomBrace).toBeInViewport({ratio: 1});
  const targets = await editor.getByRole('button', {name: /^Selecionar piloti /}).evaluateAll(nodes =>
    nodes.map(node => {const {x, y, width, height} = node.getBoundingClientRect(); return {x, y, width, height};}));
  for (const [index, target] of targets.entries()) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    for (const other of targets.slice(index + 1)) {
      const overlapX = Math.min(target.x + target.width, other.x + other.width) - Math.max(target.x, other.x);
      const overlapY = Math.min(target.y + target.height, other.y + other.height) - Math.max(target.y, other.y);
      expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    }
  }
  await screenshot('667x320-contraventamento');
  await page.mouse.click(200, 25);
  await expect(editor).toHaveCount(0);
});

test('vista frontal não habilita edição de pilotis pelo novo acesso', async ({page}) => {
  const {editor, screenshot} = await fixture(page, {front: true});
  await expect.poll(() => selectCanvasObjectByMyTypeByDebug(page, 'house', true)).toBe(true);
  await expect(page.getByRole('button', {name: 'Editar', exact: true})).toBeDisabled();
  await expect(editor).toHaveCount(0);
  await screenshot('frontal-editar-bloqueado');
});

test('casa construída mantém o novo painel de edição indisponível', async ({page}) => {
  const {editor, screenshot, savedHouse} = await fixture(page, {built: true});
  await expect(page.getByRole('button', {name: 'Editar', exact: true})).toHaveCount(0);
  await expect(editor).toHaveCount(0);
  expect((await savedHouse()).status).toBe('built');
  await screenshot('construida-edicao-bloqueada');
});
