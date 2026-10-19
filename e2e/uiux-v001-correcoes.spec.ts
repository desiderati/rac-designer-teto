import {expect, test, type Page} from '@playwright/test';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import JSZip from 'jszip';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {createHouse, getActiveCanvasObjectSummaryByDebug, getPilotiScreenPositionByDebug, getCanvasObjectsSummary, getCanvasPosition, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';
import type {StoredConstructionSitesDocument} from '../client/src/infra/storage/indexed-db-construction-sites.storage';

const evidence = resolve(process.env.UIUX_EVIDENCE_DIR ?? 'outputs/uiux-20261019-v001-correcoes');
mkdirSync(resolve(evidence, 'screenshots'), {recursive: true});
mkdirSync(resolve(evidence, 'artifacts'), {recursive: true});
const seed = {
  insertInitialViews: true,
  selectedPilotiHeights: [1.5],
  pilotis: {piloti_0_0: {height: 1.5, nivel: 0.5, isMaster: true}},
  monitors: Array.from({length: 6}, (_, i) => ({name: `Monitor Demo ${i + 1}`, phone: '(11) 90000-0000'})),
  siteAssessment: {soilProfile: 'water_table' as const, hasUndergroundObstacles: true},
};

async function capture(page: Page, name: string) {
  await page.screenshot({path: resolve(evidence, 'screenshots', name), fullPage: false, animations: 'disabled'});
}

async function store(page: Page, data: StoredConstructionSitesDocument) {
  await page.evaluate<void, unknown>(data => new Promise<void>((done, reject) => {
    const request = indexedDB.open('rac-designer-teto', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('construction-site-documents', 'readwrite');
      tx.objectStore('construction-site-documents').put(data, 'construction-sites');
      tx.oncomplete = () => {db.close(); done();};
      tx.onerror = () => {db.close(); reject(tx.error);};
    };
  }), data);
}

async function fixture(page: Page, built = false, complex = false) {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {...seed, houseType: null, insertInitialViews: false});
  await createHouse(page, 'tipo6');
  await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites[0].houses[0].drawingDocument.canvas.objects.length ?? 0).toBeGreaterThan(0);
  const data = (await readConstructionSiteDocument(page))!;
  const site = data.constructionSites[0];
  site.families[0].name = 'Casa demonstração Azul';
  if (built) site.houses[0].status = 'built';
  site.houses[0].drawingDocument.viewer3D = {wallColor: '#88b3d5', hideBelowTerrain: true, cameraPose: null};
  const second = structuredClone(site.houses[0]);
  second.id = 'house_second';
  second.familyId = 'family_second';
  second.drawingDocument.house!.id = second.id;
  second.drawingDocument.viewer3D = {wallColor: '#d5a088', hideBelowTerrain: true, cameraPose: null};
  if (complex) second.drawingDocument.canvas.objects.push(...Array.from({length: 2000}, (_, i) => ({
    id: 'demo_complex_' + i, kind: 'square', shape: 'rect',
    geometry: {left: 100 + i % 50 * 12, top: 100 + Math.floor(i / 50) * 12, width: 10, height: 10},
    style: {fill: '#cbd5e1'},
  })));
  site.houses.push(second);
  site.families.push({...site.families[0], id: 'family_second', name: 'Casa demonstração Terra'});
  const other = JSON.parse(JSON.stringify(site).replaceAll('construction_site_e2e', 'construction_other').replaceAll('house_e2e', 'house_other').replaceAll('house_second', 'house_other_second').replaceAll('family_e2e', 'family_other').replaceAll('family_second', 'family_other_second')) as typeof site;
  other.constructionSite.externalCode = 'CC2604';
  other.houses.forEach(house => {house.status = 'draft';});
  other.communities[0].name = 'Comunidade demonstração B';
  data.constructionSites.push(other);
  await store(page, data);
  await page.reload({waitUntil: 'domcontentloaded'});
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await expect.poll(async () => (await getCanvasObjectsSummary(page)).length).toBeGreaterThan(0);
  return data;
}

async function constructionList(page: Page) {
  await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true}).or(page.getByRole('button', {name: 'Abrir menu principal'}))).toBeVisible();
  if (await page.getByRole('heading', {name: 'Construções TETO', exact: true}).isVisible()) return;
  await showCanvasTopBar(page);
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
}


test.beforeEach(async ({page}) => {startConsoleErrorCapture(page);});
test.afterEach(async ({page}) => {expectNoConsoleErrors(page);});

async function equalActions(page: Page, name: string) {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  const sizes = await dialog.locator('button').evaluateAll(buttons => buttons.map(button => {
    const r = button.getBoundingClientRect(); return {label: button.textContent, width: r.width, height: r.height};
  }));
  expect(sizes).toHaveLength(2);
  expect(Math.abs(sizes[0].width - sizes[1].width)).toBeLessThan(1);
  expect(Math.abs(sizes[0].height - sizes[1].height)).toBeLessThan(1);
  await capture(page, name);
  return sizes;
}

test('V001 A003: formulário da construção abre sua primeira casa', async ({page}) => {
  await fixture(page);
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: /^Editar construção CC2604/}).click();
  await expect(page.getByTestId('construction-form-grid')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Abrir Canvas da primeira casa'})).toBeEnabled();
  await capture(page, 'a003-formulario-construcao.png');
  await page.getByRole('button', {name: 'Abrir Canvas da primeira casa'}).click();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await expect(page.getByRole('button', {name: /Editar nome da família.*Azul/})).toBeVisible();
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await expect(page.getByRole('button', {name: /^CC2604 -/})).toHaveAttribute('aria-expanded', 'true');
  await capture(page, 'a003-primeira-casa-destino.png');
});

test('V001 A004 A006: concluir e reabrir restaura status; ações têm dimensões iguais', async ({page}) => {
  await fixture(page);
  const data = (await readConstructionSiteDocument(page))!;
  data.constructionSites[0].houses[1].status = 'rac_printed';
  data.constructionSites[0].houses[1].hasRacBeenPrinted = true;
  const previous = data.constructionSites[0].houses.map(house => house.status);
  const other = structuredClone(data.constructionSites[1]);
  await store(page, data); await page.reload({waitUntil: 'domcontentloaded'});
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await constructionList(page);
  await page.getByRole('button', {name: 'Exportar RACs ZIP da construção CC2603'}).click();
  const dimensions = [await equalActions(page, 'a006-exportar-zip.png')];
  await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
  await page.getByRole('button', {name: 'Concluir construção CC2603'}).click();
  dimensions.push(await equalActions(page, 'a006-concluir-construcao.png'));
  await page.getByRole('button', {name: 'Concluir construção', exact: true}).click();
  await expect.poll(async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses.map(house => house.status)).toEqual(['built', 'built']);
  await page.getByRole('row', {name: /CC2603.*Concluída/}).click();
  await capture(page, 'a004-casas-construidas.png');
  // Recarregar para comprovar que o histórico sobrevive à persistência.
  await page.reload({waitUntil: 'domcontentloaded'});
  await constructionList(page);
  await page.getByRole('button', {name: /Voltar construção CC2603 para andamento/}).click();
  dimensions.push(await equalActions(page, 'a004-a006-reabrir-construcao.png'));
  await page.getByRole('button', {name: 'Voltar para andamento', exact: true}).click();
  await expect.poll(async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses.map(house => house.status)).toEqual(previous);
  expect((await readConstructionSiteDocument(page))!.constructionSites[1]).toEqual(other);
  await page.getByRole('row', {name: /CC2603.*Andamento/}).click();
  await capture(page, 'a004-status-restaurados.png');
  writeFileSync(resolve(evidence, 'artifacts/a004-restauracao.json'), JSON.stringify({before: previous, after: (await readConstructionSiteDocument(page))!.constructionSites[0].houses.map(house => house.status), persistedAcrossReload: true, unrelatedConstructionUnchanged: true}, null, 2));
  writeFileSync(resolve(evidence, 'artifacts/a006-dimensoes-status.json'), JSON.stringify(dimensions, null, 2));
});

test('V001 A008 A009: menus não abrem e Panning permanece ativo em consulta', async ({page}) => {
  await fixture(page, true);
  const soil = page.getByRole('button', {name: /Editar perfil do solo/});
  const obstacles = page.getByRole('button', {name: 'Obstáculos', exact: true});
  for (const button of [soil, obstacles]) {
    await expect(button).toBeDisabled();
    const box = (await button.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole('menu')).toHaveCount(0);
  }
  await capture(page, 'a008-menus-bloqueados.png');
  const document = await readConstructionSiteDocument(page);
  await page.getByRole('button', {name: /Zoom atual/}).click();
  await page.getByRole('button', {name: /^Panning/}).click();
  await expect(page.getByRole('button', {name: /^Panning/})).toHaveClass(/bg-blue-50/);
  await capture(page, 'a009-panning-ativo-consulta.png');
  await page.keyboard.press('Escape');
  const before = (await getCanvasPosition(page))!;
  await page.mouse.move(600, 450); await page.mouse.down(); await page.mouse.move(530, 410, {steps: 6}); await page.mouse.up();
  const after = (await getCanvasPosition(page))!;
  expect(after.x).toBeGreaterThan(before.x);
  expect(await readConstructionSiteDocument(page)).toEqual(document);
  await capture(page, 'a009-pan-consulta.png');
  await page.getByRole('button', {name: /Zoom atual/}).click();
  await page.getByRole('button', {name: /^Seleção/}).click(); await page.keyboard.press('Escape');
  const a = (await getPilotiScreenPositionByDebug(page, 'piloti_0_0'))!;
  const b = (await getPilotiScreenPositionByDebug(page, 'piloti_3_2'))!;
  await page.mouse.click((a.x + b.x) / 2, (a.y + b.y) / 2);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('house');
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2); await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2 + 40, (a.y + b.y) / 2 + 20, {steps: 4}); await page.mouse.up();
  expect(await readConstructionSiteDocument(page)).toEqual(document);
  expect(await getPilotiScreenPositionByDebug(page, 'piloti_0_0')).toEqual(a);
  writeFileSync(resolve(evidence, 'artifacts/a009-consulta.json'), JSON.stringify({before, after, drawingUnchanged: true, readonlySelectionVerified: true}, null, 2));
});

test('V001 A004: desarquivar após conclusão e recarga restaura as casas', async ({page}) => {
  await fixture(page);
  const data = (await readConstructionSiteDocument(page))!;
  data.constructionSites[0].houses[1].status = 'rac_printed';
  data.constructionSites[0].houses[1].hasRacBeenPrinted = true;
  await store(page, data); await page.reload({waitUntil: 'domcontentloaded'});
  await constructionList(page);
  await page.getByRole('button', {name: 'Concluir construção CC2603'}).click();
  await page.getByRole('button', {name: 'Concluir construção', exact: true}).click();
  await page.getByRole('button', {name: 'Arquivar construção CC2603'}).click();
  await page.getByRole('button', {name: 'Arquivar construção', exact: true}).click();
  await expect.poll(async () => (await readConstructionSiteDocument(page))!.constructionSites[0].constructionSite.status).toBe('archived');
  await capture(page, 'a004-concluida-arquivada.png');
  await page.reload({waitUntil: 'domcontentloaded'}); await constructionList(page);
  await page.getByRole('button', {name: 'Desarquivar construção CC2603'}).click();
  await page.getByRole('button', {name: 'Desarquivar construção', exact: true}).click();
  const restored = (await readConstructionSiteDocument(page))!;
  expect(restored.constructionSites[0].constructionSite.status).toBe('in_progress');
  expect(restored.constructionSites[0].houses.map(house => house.status)).toEqual(['draft', 'rac_printed']);
  expect(restored.constructionSites[1]).toEqual(data.constructionSites[1]);
  await page.getByRole('row', {name: /CC2603.*Andamento/}).click();
  await expect(page.getByTestId('construction-desktop-table')).toBeHidden();
  await expect(page.getByTestId('house-desktop-table').getByText('Casa demonstração Azul', {exact: true})).toBeVisible();
  await capture(page, 'a004-desarquivada-status-restaurados.png');
  writeFileSync(resolve(evidence, 'artifacts/a004-arquivar-restaurar.json'), JSON.stringify({reload: true,
    before: data.constructionSites[0].houses.map(house => house.status),
    after: restored.constructionSites[0].houses.map(house => house.status), unrelatedConstructionUnchanged: true}, null, 2));
});

test('V001 A006: reiniciar e redefinir preservam proporções desktop e mobile', async ({page}) => {
  await fixture(page);
  const dimensions = [];
  for (const viewport of [{width: 1280, height: 900}, {width: 740, height: 393}]) {
    await page.setViewportSize(viewport);
    await showCanvasTopBar(page);
    for (const [action, name] of [['Reiniciar Desenho', 'reiniciar'], ['Redefinir Casa', 'redefinir']]) {
      await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
      await page.getByRole('button', {name: action, exact: true}).click();
      dimensions.push({viewport, action, sizes: await equalActions(page, 'a006-' + name + '-' + viewport.width + '.png')});
      await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
    }
  }
  writeFileSync(resolve(evidence, 'artifacts/a006-dimensoes-reiniciar.json'), JSON.stringify(dimensions, null, 2));
});

test('V001 A001: ZIP encaminha cada 3D à porta IA antes de compor o PDF', async ({page}) => {
  test.setTimeout(90_000);
  const calls: Array<{wallColor: string; base64: string}> = [];
  await page.route('**/api/trpc/storage.generateHouseIllustration**', async route => {
    const request = route.request().postDataJSON();
    const input = (request['0'] ?? request).json;
    calls.push(input);
    // Test double explícito: devolve o próprio raster de entrada. Não simula arte gerada por IA.
    await route.fulfill({contentType: 'application/json', body: JSON.stringify([{result: {data: {json: {dataUrl: 'data:image/png;base64,' + input.base64, url: null}}}}])});
  });
  await fixture(page);
  await constructionList(page);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Exportar RACs ZIP da construção CC2603'}).click();
  await page.getByRole('button', {name: 'Exportar RACs ZIP', exact: true}).click();
  const download = await downloaded;
  const destination = resolve(evidence, 'artifacts', download.suggestedFilename()); await download.saveAs(destination);
  expect(calls.map(call => call.wallColor)).toEqual(['#88b3d5', '#d5a088']);
  expect(calls[0].base64).not.toBe(calls[1].base64);
  writeFileSync(resolve(evidence, 'artifacts/a001-porta-ia.json'), JSON.stringify({integration: 'mock local devolvendo entrada; sem IA real', colors: calls.map(call => call.wallColor), distinctSceneInputs: true}, null, 2));
  const zip = await JSZip.loadAsync(readFileSync(destination));
  const files = Object.values(zip.files).filter(file => file.name.endsWith('.pdf')); expect(files).toHaveLength(2);
  await page.route('**/__e2e/pdfjs.mjs', route => route.fulfill({contentType: 'application/javascript', body: readFileSync(resolve('node_modules/pdfjs-dist/build/pdf.mjs'))}));
  await page.route('**/__e2e/pdf.worker.mjs', route => route.fulfill({contentType: 'application/javascript', body: readFileSync(resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs'))}));
  for (const [index, file] of files.entries()) {
    const bytes = await file.async('nodebuffer'); writeFileSync(resolve(evidence, 'artifacts/a001-casa-' + (index + 1) + '.pdf'), bytes);
    await page.route('**/__e2e/pdf-source', route => route.fulfill({contentType: 'application/pdf', body: bytes}));
    await page.route('**/__e2e/pdf-review', route => route.fulfill({contentType: 'text/html', body: '<!doctype html><html><head><title>PDF do ZIP com porta IA simulada</title></head><body style="margin:0"><script type="module">import * as pdfjs from "/__e2e/pdfjs.mjs"; pdfjs.GlobalWorkerOptions.workerSrc="/__e2e/pdf.worker.mjs";const pdf=await pdfjs.getDocument({url:"/__e2e/pdf-source"}).promise;const page=await pdf.getPage(2);const view=page.getViewport({scale:1.5});const canvas=document.createElement("canvas");canvas.width=view.width;canvas.height=view.height;canvas.style.cssText="max-width:100%;height:auto";document.body.append(canvas);await page.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;document.body.dataset.ready="true";</script></body></html>'}));
    await page.goto('/__e2e/pdf-review'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await capture(page, 'a001-pdf-casa-' + (index + 1) + '-mock-local.png');
  }
});

test.describe('V001 gestos mobile', () => {
  test.use({viewport: {width: 852, height: 393}, isMobile: true, hasTouch: true});
  test('A014: Pan padrão, seleção por espera, arrasto isolado e pinça estável', async ({page}) => {
    await fixture(page); await page.setViewportSize({width: 852, height: 393});
    await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
    await showCanvasTopBar(page); await page.getByRole('button', {name: /Zoom atual/}).click();
    await expect(page.getByRole('button', {name: /^Panning/})).toHaveClass(/bg-blue-50/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).click();
    await page.getByRole('button', {name: 'Objetos Geométricos', exact: true}).click();
    await page.getByRole('button', {name: 'Quadrado', exact: true}).click(); await page.keyboard.press('Escape');
    const square = async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas.objects.find(object => object.kind === 'square');
    await expect.poll(async () => Boolean(await square())).toBe(true);
    const object = structuredClone((await square())!.geometry);
    const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
    const position = (await getCanvasPosition(page))!;
    const x = surface.x + (object.left! + object.width! * (object.scaleX ?? 1) / 2) * position.zoom;
    const y = surface.y + (object.top! + object.height! * (object.scaleY ?? 1) / 2) * position.zoom;
    const cdp = await page.context().newCDPSession(page);
    const touch = async (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', points: Array<{x: number; y: number; id: number}>) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points});
    await touch('touchStart', [{x, y, id: 1}]);
    // O item adicionado estava ativo: o início em Pan precisa limpar antes de reconhecer a espera.
    expect(await getActiveCanvasObjectSummaryByDebug(page)).toBeNull();
    await page.waitForTimeout(600);
    await expect(page.getByText('Item selecionado · arraste para mover apenas o item')).toBeVisible();
    await capture(page, 'a014-toque-prolongado-landscape.png');
    await touch('touchMove', [{x: x + 40, y: y + 20, id: 1}]); await touch('touchEnd', []);
    await expect.poll(async () => (await square())!.geometry.left).toBeGreaterThan(object.left!);
    let afterObject = (await square())!.geometry;
    const afterDrag = (await getCanvasPosition(page))!;
    expect(afterDrag).toEqual(position);
    await capture(page, 'a014-arrasto-sem-pan.png');
    // Seleção é uma escolha explícita: o toque prolongado não troca a ferramenta Pan.
    await showCanvasTopBar(page); await page.getByRole('button', {name: /Zoom atual/}).click();
    await expect(page.getByRole('button', {name: /^Panning/})).toHaveClass(/bg-blue-50/);
    await page.getByRole('button', {name: /^Seleção/}).click(); await page.keyboard.press('Escape');
    // A próxima sequência em Seleção deve alcançar os controles nativos do Fabric.
    const selected = structuredClone(afterObject);
    const corner = {
      // O grupo do quadrado usa origem no centro.
      x: surface.x + (selected.left! + selected.width! * (selected.scaleX ?? 1) / 2 + 8) * position.zoom,
      y: surface.y + (selected.top! + selected.height! * (selected.scaleY ?? 1) / 2 + 8) * position.zoom,
    };
    writeFileSync(resolve(evidence, 'artifacts/a014-controle-diagnostico.json'), JSON.stringify({selected, surface,
      currentSurface: await page.getByTestId('rac-canvas-surface').boundingBox(), position, corner,
      active: await getActiveCanvasObjectSummaryByDebug(page)}, null, 2));
    await touch('touchStart', [{...corner, id: 1}]);
    await touch('touchMove', [{x: corner.x + 35, y: corner.y + 35, id: 1}]);
    await touch('touchEnd', []);
    await expect.poll(async () => (await square())!.geometry.scaleX ?? 1).toBeGreaterThan(selected.scaleX ?? 1);
    expect(await getCanvasPosition(page)).toEqual(position);
    afterObject = (await square())!.geometry;
    await capture(page, 'a014-redimensionamento-nativo.png');
    // Iniciar no objeto e acrescentar o segundo dedo não pode mover/resize durante pinça.
    const nativeStart = {x: surface.x + afterObject.left! * position.zoom,
      y: surface.y + afterObject.top! * position.zoom, id: 1};
    await touch('touchStart', [nativeStart]);
    await touch('touchStart', [nativeStart, {x: nativeStart.x + 100, y: nativeStart.y, id: 2}]);
    await touch('touchMove', [{x: nativeStart.x - 10, y: nativeStart.y, id: 1}, {x: nativeStart.x + 110, y: nativeStart.y, id: 2}]);
    await touch('touchEnd', []);
    expect((await square())!.geometry).toEqual(afterObject);
    const nativePinch = (await getCanvasPosition(page))!;
    expect(nativePinch.zoom).toBeCloseTo(position.zoom * 1.2, 2);
    await capture(page, 'a014-selecao-para-pinca.png');
    await showCanvasTopBar(page); await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Panning/}).click(); await page.keyboard.press('Escape');
    const beforePan = (await getCanvasPosition(page))!;
    await touch('touchStart', [{x: 500, y: 200, id: 1}]);
    await touch('touchMove', [{x: 450, y: 180, id: 1}]); await touch('touchEnd', []);
    const afterPan = (await getCanvasPosition(page))!;
    expect(afterPan.x).toBeGreaterThan(beforePan.x);
    expect((await square())!.geometry).toEqual(afterObject);
    // Dois dedos: razão 120 -> 180, mantendo o centro na mesma posição.
    await touch('touchStart', [{x: 360, y: 200, id: 1}, {x: 480, y: 200, id: 2}]);
    await touch('touchMove', [{x: 330, y: 200, id: 1}, {x: 510, y: 200, id: 2}]);
    const afterPinch = (await getCanvasPosition(page))!;
    expect(afterPinch.zoom).toBeCloseTo(afterPan.zoom * 1.5, 2);
    const anchorBefore = {x: (420 + afterPan.x) / afterPan.zoom, y: (200 + afterPan.y) / afterPan.zoom};
    const anchorAfter = {x: (420 + afterPinch.x) / afterPinch.zoom, y: (200 + afterPinch.y) / afterPinch.zoom};
    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x, 1); expect(anchorAfter.y).toBeCloseTo(anchorBefore.y, 1);
    await capture(page, 'a014-pinca-zoom.png');
    await touch('touchEnd', [{x: 330, y: 200, id: 1}]);
    await touch('touchMove', [{x: 300, y: 180, id: 1}]);
    expect(await getCanvasPosition(page)).toEqual(afterPinch);
    await touch('touchEnd', []);
    writeFileSync(resolve(evidence, 'artifacts/a014-gestos.json'), JSON.stringify({device: 'Chromium CDP; não iPhone físico', viewport: page.viewportSize(), object, afterObject, position, afterDrag, nativeResize: true, nativePinch, beforePan, afterPan, afterPinch, anchorBefore, anchorAfter, remainingFingerIgnored: true}, null, 2));
    await cdp.detach();
    await page.setViewportSize({width: 1280, height: 900});
    await expect(page.getByText('Item selecionado · arraste para mover apenas o item')).toHaveCount(0);
  });
});

test.describe('V001 consulta mobile', () => {
  test.use({viewport: {width: 852, height: 393}, isMobile: true, hasTouch: true});
  test('A009 A014: seleção por espera em casa construída não edita o desenho', async ({page}) => {
    await fixture(page, true);
    await page.setViewportSize({width: 852, height: 393});
    await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
    await showCanvasTopBar(page); await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Fit to View/}).click(); await page.keyboard.press('Escape');
    const document = await readConstructionSiteDocument(page);
    const position = (await getCanvasPosition(page))!;
    const a = (await getPilotiScreenPositionByDebug(page, 'piloti_0_0'))!;
    const b = (await getPilotiScreenPositionByDebug(page, 'piloti_3_2'))!;
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y, id: 1}]});
    await page.waitForTimeout(600);
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('house');
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + 50, y: y + 20, id: 1}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    expect(await readConstructionSiteDocument(page)).toEqual(document);
    expect(await getCanvasPosition(page)).toEqual(position);
    await capture(page, 'a009-a014-consulta-mobile.png');
    await showCanvasTopBar(page); await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Panning/}).click(); await page.keyboard.press('Escape');
    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Fit to View/}).click(); await page.keyboard.press('Escape');
    // Voltar ao zoom 100% com a pinça torna o deslocamento mensurável.
    const fitted = (await getCanvasPosition(page))!;
    const half = 20 / fitted.zoom;
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 400, y: 200, id: 1}, {x: 440, y: 200, id: 2}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 420 - half, y: 200, id: 1}, {x: 420 + half, y: 200, id: 2}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    const beforePan = (await getCanvasPosition(page))!;
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 500, y: 200, id: 1}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 450, y: 180, id: 1}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeGreaterThan(beforePan.x);
    expect(await readConstructionSiteDocument(page)).toEqual(document);
    await cdp.detach();
  });
});
