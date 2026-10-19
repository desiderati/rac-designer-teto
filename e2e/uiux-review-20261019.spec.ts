import {expect, test, type Page} from '@playwright/test';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import JSZip from 'jszip';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {createHouse, getActiveCanvasObjectSummaryByDebug, openPilotiEditorByDebug, closePilotiEditorByDebug, updatePilotiByDebug, getPilotiScreenPositionByDebug, getCanvasObjectsSummary, getCanvasPosition, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';
import type {StoredConstructionSitesDocument} from '../client/src/infra/storage/indexed-db-construction-sites.storage';

const evidence = resolve('outputs/uiux-20261019-a001-a014');
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
  await showCanvasTopBar(page);
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
}

test.beforeEach(async ({page}) => {startConsoleErrorCapture(page);});
test.afterEach(async ({page}) => {expectNoConsoleErrors(page);});

test('A002 A003 A005 A012: navegação correta e carregamento local', async ({page}) => {
  await fixture(page, false, true);
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  const roots = page.getByRole('button', {name: /^CC260[34] -/});
  await expect(roots).toHaveCount(2);
  await page.getByRole('button', {name: /^CC2604 -/}).click();
  await expect(page.getByRole('button', {name: /^CC2603 -/})).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', {name: /^CC2604 -/})).toHaveAttribute('aria-expanded', 'true');
  await capture(page, 'a002-a003-menu-desktop.png');
  await page.getByRole('button', {name: /^Editar construção CC2604/}).click();
  await expect(page.getByTestId('construction-form-grid')).toBeVisible();
  await capture(page, 'a002-construcao-correta.png');
  await page.getByRole('button', {name: 'Voltar', exact: true}).click();
  await page.getByRole('button', {name: 'Voltar', exact: true}).click();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await constructionList(page);
  await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();
  const started = Date.now();
  await page.getByRole('row', {name: /Casa demonstração Azul/}).click();
  await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
  const elapsed = Date.now() - started;
  writeFileSync(resolve(evidence, 'artifacts/a005-timing.json'), JSON.stringify({scenario: 'abrir formulário, fixture de duas casas', elapsedMs: elapsed, viewport: page.viewportSize(), baseline: 'não medido; sem alegação percentual'}, null, 2));
  await capture(page, 'a005-formulario-desktop.png');
  await page.getByRole('button', {name: 'Abrir Canvas da casa'}).click();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  const frames = resolve('.agents/work-items/2026-10/20261019-uiux-a001-a014.work-item.assets/loading-frames');
  mkdirSync(frames, {recursive: true});
  const recording = await page.context().newCDPSession(page);
  let frameIndex = 0;
  recording.on('Page.screencastFrame', async ({data, sessionId}) => {
    if (frameIndex < 20) writeFileSync(resolve(frames, 'frame-' + String(frameIndex++).padStart(2, '0') + '.png'), Buffer.from(data, 'base64'));
    await recording.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
  });
  await recording.send('Page.startScreencast', {format: 'png', everyNthFrame: 1});
  await page.evaluate(() => {
    const state = window as unknown as {uiuxLoadingObserved: boolean};
    state.uiuxLoadingObserved = false;
    new MutationObserver(() => {
      if (document.querySelector('[data-testid="house-canvas-loading"]')) state.uiuxLoadingObserved = true;
    }).observe(document.body, {subtree: true, childList: true});
  });
  await page.getByRole('button', {name: 'Casa demonstração Terra', exact: true}).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as {uiuxLoadingObserved: boolean}).uiuxLoadingObserved)).toBe(true);
  await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toBeEnabled();
  await expect.poll(async () => (await getCanvasObjectsSummary(page)).length).toBeGreaterThan(2000);
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await expect(page.getByRole('button', {name: /Editar nome da família.*Terra/})).toBeVisible();
  await capture(page, 'a012-casa-carregada.png');
  await recording.send('Page.stopScreencast');
  await recording.detach();
});

test('A004 A008 A009 A011: conclusão, consulta e bloqueios', async ({page}) => {
  const original = await fixture(page);
  await constructionList(page);
  await page.getByRole('button', {name: 'Concluir construção CC2603', exact: true}).click();
  await page.getByRole('button', {name: 'Concluir construção', exact: true}).click();
  await expect.poll(async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses.every(house => house.status === 'built')).toBe(true);
  const completed = (await readConstructionSiteDocument(page))!;
  expect(completed.constructionSites[1]).toEqual(original.constructionSites[1]);
  writeFileSync(resolve(evidence, 'artifacts/a004-statuses.json'), JSON.stringify(completed.constructionSites.map(site => ({code: site.constructionSite.externalCode, status: site.constructionSite.status, houses: site.houses.map(house => ({id: house.id, status: house.status}))})), null, 2));
  await capture(page, 'a004-construcao-concluida.png');
  await page.getByRole('row', {name: /CC2603.*Concluída/i}).click();
  await capture(page, 'a004-casas-construidas.png');
  await page.getByRole('row', {name: /Casa demonstração Azul/}).click();
  await expect(page.getByRole('button', {name: 'Abrir Canvas da casa'})).toBeEnabled();
  await capture(page, 'a011-canvas-habilitado.png');
  await page.getByRole('button', {name: 'Abrir Canvas da casa'}).click();
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await expect(page.getByRole('button', {name: /Editar perfil do solo/})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Obstáculos', exact: true})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Casa TETO (Opções)'})).toBeDisabled();
  await page.getByRole('button', {name: /Zoom atual/}).click();
  for (const name of [/Seleção/, /Panning/, /Fit to View/]) await expect(page.getByRole('button', {name})).toBeEnabled();
  await capture(page, 'a008-a009-canvas-consulta.png');
  await page.keyboard.press('Escape');
  const first = (await getPilotiScreenPositionByDebug(page, 'piloti_0_0'))!;
  const last = (await getPilotiScreenPositionByDebug(page, 'piloti_3_2'))!;
  const center = {x: (first.x + last.x) / 2, y: (first.y + last.y) / 2};
  await page.mouse.click(center.x, center.y);
  await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('house');
  const documentBeforeDrag = await readConstructionSiteDocument(page);
  await page.mouse.move(center.x, center.y); await page.mouse.down();
  await page.mouse.move(center.x + 60, center.y + 30, {steps: 6}); await page.mouse.up();
  expect(await getPilotiScreenPositionByDebug(page, 'piloti_0_0')).toEqual(first);
  expect(await readConstructionSiteDocument(page)).toEqual(documentBeforeDrag);
  await capture(page, 'a009-selecao-consulta.png');
  const before = await getCanvasObjectsSummary(page);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.keyboard.press('ControlOrMeta+v');
  expect(await getCanvasObjectsSummary(page)).toEqual(before);
  await page.getByRole('button', {name: 'Visualização 3D'}).click();
  await expect(page.getByRole('button', {name: 'Enquadrar casa'})).toBeEnabled();
  await expect(page.getByRole('button', {name: 'Cor das Paredes'})).toBeDisabled();
  await expect(page.getByRole('button', {name: /Inserir.*Canvas/i})).toBeDisabled();
  await capture(page, 'a009-viewer3d-consulta.png');
});

test('A006 e textos adicionais: confirmação consistente e configurações', async ({page}) => {
  await fixture(page);
  if (!(await page.getByRole('menu', {name: 'Menu da conta'}).isVisible())) await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await page.getByRole('button', {name: 'Reiniciar Desenho'}).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('heading', {name: 'Reiniciar Canvas'})).toBeVisible();
  const [cancel, confirm] = await dialog.locator('button').evaluateAll(buttons => buttons.map(button => {const box = button.getBoundingClientRect(); return {width: box.width, height: box.height};}));
  expect(Math.abs(cancel.width - confirm.width)).toBeLessThan(1);
  expect(cancel.height).toBe(confirm.height);
  await capture(page, 'a006-reiniciar-desktop.png');
  await dialog.getByRole('button', {name: 'Cancelar'}).click();
  if (!(await page.getByRole('menu', {name: 'Menu da conta'}).isVisible())) await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await page.getByRole('button', {name: 'Redefinir Casa'}).click();
  await expect(page.getByRole('heading', {name: 'Redefinir Casa?'})).toBeVisible();
  const [resetCancel, resetConfirm] = await dialog.locator('button').evaluateAll(buttons => buttons.map(button => {const box = button.getBoundingClientRect(); return {width: box.width, height: box.height};}));
  expect(Math.abs(resetCancel.width - resetConfirm.width)).toBeLessThan(1);
  expect(resetCancel.height).toBe(resetConfirm.height);
  await capture(page, 'a006-redefinir-desktop.png');
  await dialog.getByRole('button', {name: 'Cancelar'}).click();
  if (!(await page.getByRole('menu', {name: 'Menu da conta'}).isVisible())) await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await page.getByRole('button', {name: 'Configurações'}).click();
  await expect(page.getByLabel('Mostrar rótulos nos menus laterais do canvas')).toBeVisible();
  await expect(page.getByLabel('Habilitar mini-mapa no canvas')).toBeVisible();
  await capture(page, 'textos-configuracoes.png');
});

test('A001 A007 A010: ZIP com 3D por casa e PDF com monitoria na segunda página', async ({page}) => {
  test.setTimeout(90_000);
  await fixture(page);
  await constructionList(page);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Exportar RACs ZIP da construção CC2603'}).click();
  await page.getByRole('button', {name: 'Exportar RACs ZIP', exact: true}).click();
  await expect(page.getByText('Geração dos PDFs da construção', {exact: true})).toBeVisible();
  await capture(page, 'a007-progresso-zip-desktop.png');
  const download = await downloaded;
  const destination = resolve(evidence, 'artifacts', download.suggestedFilename());
  await download.saveAs(destination);
  const zip = await JSZip.loadAsync(readFileSync(destination));
  await page.route('**/__e2e/pdfjs.mjs', route => route.fulfill({contentType: 'application/javascript', body: readFileSync(resolve('node_modules/pdfjs-dist/build/pdf.mjs'))}));
  await page.route('**/__e2e/pdf.worker.mjs', route => route.fulfill({contentType: 'application/javascript', body: readFileSync(resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs'))}));
  const files = Object.values(zip.files).filter(file => file.name.endsWith('.pdf'));
  expect(files).toHaveLength(2);
  for (const [index, file] of files.entries()) {
    const bytes = await file.async('nodebuffer');
    writeFileSync(resolve(evidence, `artifacts/casa-${index + 1}.pdf`), bytes);
    await page.route(`**/__e2e/pdf-${index}`, route => route.fulfill({contentType: 'application/pdf', body: bytes}));
    await page.route(`**/__e2e/pdf-review-${index}`, route => route.fulfill({contentType: 'text/html', body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>PDF extraído do ZIP</title></head><body style="margin:0;background:#e2e8f0"><script type="module">
      import * as pdfjs from '/__e2e/pdfjs.mjs';
      pdfjs.GlobalWorkerOptions.workerSrc = '/__e2e/pdf.worker.mjs';
      const pdf = await pdfjs.getDocument({url:'/__e2e/pdf-${index}'}).promise;
      window.pdfTexts = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        window.pdfTexts.push((await page.getTextContent()).items.map(item => item.str).join(' '));
        const canvas = document.createElement('canvas'); canvas.id = 'page-' + number;
        const view = page.getViewport({scale:1.5}); canvas.width = view.width; canvas.height = view.height;
        canvas.style.cssText='display:block;max-width:100%;height:auto;margin:0 auto 16px'; document.body.appendChild(canvas);
        await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
      }
      document.body.dataset.ready='true';
    </script></body></html>`}));
    await page.goto(`/__e2e/pdf-review-${index}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const texts = await page.evaluate(() => (window as unknown as {pdfTexts: string[]}).pdfTexts);
    expect(texts[0]).not.toContain('MONITORIA');
    expect(texts[1]).toContain('MONITORIA');
    for (let monitor = 1; monitor <= 6; monitor++) expect(texts[1]).toContain(`Monitor Demo ${monitor}`);
    writeFileSync(resolve(evidence, `artifacts/casa-${index + 1}-texto.json`), JSON.stringify(texts, null, 2));
    await capture(page, `a001-a010-casa-${index + 1}-pagina1.png`);
    await page.locator('#page-2').scrollIntoViewIfNeeded();
    await capture(page, `a001-a010-casa-${index + 1}-pagina2.png`);
  }
});

test.describe('Mobile horizontal', () => {
  test.use({viewport: {width: 852, height: 393}, isMobile: true, hasTouch: true});
  test('A013 A014: FABs recuados, seleção evidente e arrasto do objeto sem pan', async ({page}) => {
    await fixture(page);
    await page.setViewportSize({width: 852, height: 393});
    const left = page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true});
    const right = page.getByRole('button', {name: 'Dificuldade da casa', exact: true});
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();
    const l = (await left.boundingBox())!;
    const r = (await right.boundingBox())!;
    expect(l.x).toBeGreaterThanOrEqual(32);
    expect(r.x + r.width).toBeLessThanOrEqual(852 - 32);
    await capture(page, 'a013-fabs-landscape.png');
    await left.click();
    await page.getByRole('button', {name: 'Objetos Geométricos', exact: true}).click();
    await page.getByRole('button', {name: 'Quadrado', exact: true}).click();
    await expect.poll(async () => (await getCanvasObjectsSummary(page)).some(object => object.myType === 'square')).toBe(true);
    await page.keyboard.press('Escape');
    const square = async () => (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas.objects.find(object => object.kind === 'square');
    await expect.poll(async () => Boolean(await square())).toBe(true);
    const object = (await square())!.geometry;
    const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
    const position = (await getCanvasPosition(page))!;
    const x = surface.x + (object.left! + object.width! * (object.scaleX ?? 1) / 2) * position.zoom;
    const y = surface.y + (object.top! + object.height! * (object.scaleY ?? 1) / 2) * position.zoom;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y, id: 1}]});
    await page.waitForTimeout(650); // gesto real de manter pressionado
    await expect(page.getByText('Item selecionado · arraste para mover apenas o item')).toBeVisible();
    await capture(page, 'a014-selecao-landscape.png');
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + 40, y: y + 20, id: 1}]});
    await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await expect.poll(async () => (await square())!.geometry.left).toBeGreaterThan(object.left!);
    const after = (await square())!.geometry;
    expect(after.left).toBeGreaterThan(object.left!);
    expect(after.top).toBeGreaterThan(object.top!);
    const viewportAfter = (await getCanvasPosition(page))!;
    expect(viewportAfter.x).toBeCloseTo(position.x, 1);
    expect(viewportAfter.y).toBeCloseTo(position.y, 1);
    await capture(page, 'a014-arrasto-landscape.png');
    writeFileSync(resolve(evidence, 'artifacts/a014-gesture.json'), JSON.stringify({viewport: page.viewportSize(), before: {object, position}, after: {object: after, position: viewportAfter}}, null, 2));
    await showCanvasTopBar(page);
    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Panning/}).click();
    await page.keyboard.press('Escape');
    const panBefore = (await getCanvasPosition(page))!;
    await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 500, y: 200, id: 1}]});
    await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 440, y: 180, id: 1}]});
    await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeGreaterThan(panBefore.x);
    expect((await square())!.geometry).toEqual(after);
    await session.detach();
    await page.setViewportSize({width: 1280, height: 900});
    await expect(page.getByText('Item selecionado · arraste para mover apenas o item')).toHaveCount(0);
    await capture(page, 'a014-desktop-sem-destaque-mobile.png');
    await page.setViewportSize({width: 393, height: 852});
    await expect(page.getByRole('button', {name: /Voltar.*constru/i})).toBeVisible();
    await capture(page, 'a013-retrato-preservado.png');
  });
});


test('Preferência: contraventamento manual proporcional, persistência e recálculo', async ({page}) => {
  await fixture(page);
  for (let col = 0; col < 4; col++) for (let row = 0; row < 3; row++) {
    await updatePilotiByDebug(page, 'piloti_' + col + '_' + row, {height: 1.5, nivel: 0.4});
  }
  expect(await openPilotiEditorByDebug(page, 'piloti_0_0')).toBe(true);
  await expect(page.getByRole('button', {name: 'Esquerdo', exact: true})).toBeDisabled();
  await closePilotiEditorByDebug(page);
  if (!(await page.getByRole('menu', {name: 'Menu da conta'}).isVisible())) await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await page.getByRole('button', {name: 'Configurações'}).click();
  const setting = page.getByLabel('Permitir o contraventamento mesmo que os pilotis estejam dentro da proporção');
  await expect(setting).not.toBeChecked();
  await setting.click();
  await capture(page, 'contraventamento-configuracao.png');
  await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
  expect(await openPilotiEditorByDebug(page, 'piloti_0_0')).toBe(true);
  await expect(page.getByRole('button', {name: 'Esquerdo', exact: true})).toBeEnabled();
  await expect(page.getByRole('button', {name: 'Superior', exact: true})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Inferior', exact: true})).toBeEnabled();
  await capture(page, 'contraventamento-piloti-proporcional.png');
  await page.getByRole('button', {name: 'Esquerdo', exact: true}).click();
  const target = await getPilotiScreenPositionByDebug(page, 'piloti_0_2');
  expect(target).not.toBeNull();
  await page.mouse.click(target!.x, target!.y);
  const manualBraces = async () => {
    const data = (await readConstructionSiteDocument(page))!;
    const elements = data.constructionSites[0].houses[0].drawingDocument.canvas.objects;
    return JSON.stringify(elements).includes('contraventamentoAnchorPilotiId');
  };
  await expect.poll(manualBraces).toBe(true);
  await updatePilotiByDebug(page, 'piloti_0_0', {nivel: 0.3});
  await expect.poll(manualBraces).toBe(true);
  await capture(page, 'contraventamento-manual-canvas.png');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rac-settings')!).allowContraventamentoWithinProportion)).toBe(true);
  // Nova aba compartilha o armazenamento, sem o initScript que restaura a fixture a cada reload.
  const reopened = await page.context().newPage();
  startConsoleErrorCapture(reopened);
  await reopened.goto('/', {waitUntil: 'domcontentloaded'});
  await expect.poll(async () => (await getCanvasObjectsSummary(reopened)).length).toBeGreaterThan(0);
  await reopened.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await reopened.getByRole('button', {name: 'Configurações'}).click();
  await expect(reopened.getByLabel('Permitir o contraventamento mesmo que os pilotis estejam dentro da proporção')).toBeChecked();
  await reopened.getByRole('button', {name: 'Cancelar', exact: true}).click();
  await expect.poll(manualBraces).toBe(true);
  await capture(reopened, 'contraventamento-apos-reabrir.png');
  expectNoConsoleErrors(reopened);
  await reopened.close();
});
