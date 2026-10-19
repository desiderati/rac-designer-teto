import {expect, test, type Page} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {expectCanvasObjectsPersisted, getCanvasPosition, setCanvasPositionByDebug, triggerElementsAction} from './helpers/rac-editor.helpers';

test.use({viewport: {width: 680, height: 320}, isMobile: true, hasTouch: true});

async function fenceText(page: Page) {
  const doc = await readConstructionSiteDocument(page);
  return doc?.constructionSites[0].houses[0].drawingDocument.canvas.objects
    .find(object => object.kind === 'fence')?.children?.find(child => child.kind === 'siteLabel')?.text ?? '';
}

async function openFence(page: Page) {
  await expectCanvasObjectsPersisted(page, ['fence']);
  const doc = (await readConstructionSiteDocument(page))!;
  const fence = doc.constructionSites[0].houses[0].drawingDocument.canvas.objects.find(object => object.kind === 'fence')!;
  const zoom = (await getCanvasPosition(page))!.zoom;
  const viewport = page.viewportSize()!;
  const x = Math.max(0, fence.geometry.left! * zoom - viewport.width / 2);
  const y = Math.max(0, fence.geometry.top! * zoom - viewport.height / 2);
  await setCanvasPositionByDebug(page, x, y);
  await expect.poll(async () => (await getCanvasPosition(page))!.x).toBeCloseTo(x, 0);
  const surface = (await page.getByTestId('rac-canvas-surface').boundingBox())!;
  await page.touchscreen.tap(surface.x + fence.geometry.left! * zoom, surface.y + fence.geometry.top! * zoom);
  await expect(page.getByRole('dialog', {name: 'Editar Cerca'})).toBeVisible();
}

test.beforeEach(async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await setupSeededRacEditorPage(page, {insertInitialViews: true});
  await triggerElementsAction(page, 'Cerca');
  await expectCanvasObjectsPersisted(page, ['fence']);
  await page.setViewportSize({width: 680, height: 320});
  await expect(page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true})).toBeVisible();
  await openFence(page);
});

test('não abre o teclado automaticamente ao editar a cerca no celular', async ({page}) => {
  await expect(page.getByPlaceholder('Texto opcional')).not.toBeFocused();
});

test('permite editar e confirmar em celular horizontal com altura reduzida', async ({page}, testInfo) => {
  const input = page.getByPlaceholder('Texto opcional');
  await input.fill('Divisa lateral');
  // Redução real da janela é evidência de layout; teclado Android real é validação posterior.
  await page.setViewportSize({width: 680, height: 180});
  const dialog = page.getByRole('dialog', {name: 'Editar Cerca'});
  await expect.poll(async () => (await dialog.boundingBox())!.y).toBeGreaterThanOrEqual(-1);
  await input.tap();
  const inputBox = (await input.boundingBox())!;
  expect(inputBox.y).toBeGreaterThanOrEqual(0);
  expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(180);
  const confirm = dialog.getByRole('button', {name: 'Confirmar', exact: true});
  await confirm.click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => fenceText(page)).toBe('Divisa lateral');
  await page.setViewportSize({width: 680, height: 320});
  await page.reload();
  await page.getByRole('button', {name: 'Abrir casas da construção CC2603 Andamento', exact: true}).tap();
  await page.getByTestId('house-mobile-card').filter({hasText: 'Família E2E'}).tap();
  await page.getByRole('button', {name: 'Abrir Canvas da casa', exact: true}).tap();
  await expectCanvasObjectsPersisted(page, ['fence']);
  await openFence(page);
  await expect(input).toHaveValue('Divisa lateral');
  await page.screenshot({path: testInfo.outputPath('cerca-texto-mobile.png')});
});

test('Cancelar descarta o texto e mantém a cerca sem rótulo', async ({page}) => {
  await page.getByPlaceholder('Texto opcional').fill('Não salvar');
  await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
  await expect.poll(() => fenceText(page)).toBe('');
  await openFence(page);
  await expect(page.getByPlaceholder('Texto opcional')).toHaveValue('');
});


test('acompanha a viewport visual do teclado sem redimensionar a janela', async ({page}, testInfo) => {
  const input = page.getByPlaceholder('Texto opcional');
  await input.fill('Limite do terreno');
  // Contrato de VisualViewport simulado; não equivale ao teclado Android real.
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, 'height', {configurable: true, get: () => 180});
    Object.defineProperty(window.visualViewport, 'offsetTop', {configurable: true, get: () => 20});
    window.visualViewport!.dispatchEvent(new Event('resize'));
    window.visualViewport!.dispatchEvent(new Event('scroll'));
  });
  const dialog = page.getByRole('dialog', {name: 'Editar Cerca'});
  await expect.poll(async () => (await dialog.boundingBox())!.y).toBeGreaterThanOrEqual(20);
  const box = (await dialog.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(201);
  await input.tap();
  const inputBox = (await input.boundingBox())!;
  expect(inputBox.y).toBeGreaterThanOrEqual(20);
  expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(201);
  const confirm = dialog.getByRole('button', {name: 'Confirmar', exact: true});
  const actionBox = (await confirm.boundingBox())!;
  expect(actionBox.y).toBeGreaterThanOrEqual(20);
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(201);
  await page.screenshot({path: testInfo.outputPath('cerca-viewport-visual.png')});
  await confirm.tap();
  await expect.poll(() => fenceText(page)).toBe('Limite do terreno');
});

test('mantém o rascunho ao girar entre retrato e paisagem', async ({page}) => {
  const input = page.getByPlaceholder('Texto opcional');
  await input.fill('Rascunho da cerca');
  await page.setViewportSize({width: 375, height: 740});
  await expect(input).toHaveValue('Rascunho da cerca');
  await expect(page.getByRole('heading', {name: 'Gire seu celular', exact: true})).toBeVisible();
  await page.setViewportSize({width: 680, height: 320});
  await expect(page.getByRole('heading', {name: 'Gire seu celular', exact: true})).toBeHidden();
  await expect(page.getByRole('dialog', {name: 'Editar Cerca'})).toBeVisible();
  await expect(input).toHaveValue('Rascunho da cerca');
  await page.getByRole('button', {name: 'Cancelar', exact: true}).tap();
  await expect.poll(() => fenceText(page)).toBe('');
});


test('permite digitar e alcançar Confirmar com apenas 120 px de altura', async ({page}) => {
  await page.setViewportSize({width: 680, height: 120});
  const input = page.getByPlaceholder('Texto opcional');
  await input.tap({timeout: 5000});
  await input.fill('Pouca altura');
  await page.getByRole('button', {name: 'Confirmar', exact: true}).tap();
  await expect.poll(() => fenceText(page)).toBe('Pouca altura');
});
