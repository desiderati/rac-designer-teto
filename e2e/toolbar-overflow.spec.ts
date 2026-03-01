import {expect, test} from '@playwright/test';
import {
  createHouse,
  ensureOverflowMenuOpen,
  expectNoConsoleErrors,
  getCanvasObjectsSummary,
  getUiState,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerElementsAction,
  triggerLinesAction,
} from './helpers/rac-helpers.spec';

test.describe('RAC toolbar and overflow', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('toolbar: elementos e linhas inserem objetos no canvas', async ({page}) => {
    await createHouse(page, 'tipo6');

    const before = await getCanvasObjectsSummary(page);
    const beforeCount = before.length;

    await triggerElementsAction(page, 'Objeto / Muro');
    await triggerElementsAction(page, 'Escada');
    await triggerElementsAction(page, 'Árvore');
    await triggerElementsAction(page, 'Água / Rio');
    await triggerElementsAction(page, 'Fossa');

    await triggerLinesAction(page, 'Linha Reta');
    await triggerLinesAction(page, 'Seta Simples');
    await triggerLinesAction(page, 'Distância');

    const after = await getCanvasObjectsSummary(page);
    expect(after.length).toBeGreaterThanOrEqual(beforeCount + 8);

    const myTypes = new Set(after.map((obj) => obj.myType).filter((myType): myType is string => !!myType));
    expect(myTypes.has('wall')).toBe(true);
    expect(myTypes.has('stairs')).toBe(true);
    expect(myTypes.has('tree')).toBe(true);
    expect(myTypes.has('water')).toBe(true);
    expect(myTypes.has('fossa')).toBe(true);
    expect(myTypes.has('line')).toBe(true);
    expect(myTypes.has('arrow')).toBe(true);
    expect(myTypes.has('distance')).toBe(true);
  });

  test('overflow: alterna dicas e abre configurações', async ({page}) => {
    await createHouse(page, 'tipo6');

    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Dicas'}).click();
    await expect.poll(async () => (await getUiState(page))?.showTips ?? false).toBe(true);

    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Dicas'}).click();
    await expect.poll(async () => (await getUiState(page))?.showTips ?? true).toBe(false);

    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Configurações'}).click();
    await expect(page.getByRole('heading', {name: 'Configurações'})).toBeVisible();

    const zoomSettingSwitch = page.getByRole('switch', {name: /Zoom\/Minimap por padrão/});
    await zoomSettingSwitch.click();
    await page.getByRole('button', {name: 'Confirmar'}).click();
    await expect(page.getByRole('heading', {name: 'Configurações'})).toBeHidden();
    await expect.poll(async () => (await getUiState(page))?.showZoomControls ?? true).toBe(false);
  });
});

