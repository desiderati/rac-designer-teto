import {expect, test} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  getActiveCanvasObjectSummaryByDebug,
  selectCanvasObjectByMyTypeByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerElementsAction,
  triggerLinesAction,
} from './helpers/rac-helpers.spec';

test.describe('RAC inline editor sync', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('inline editor: alterna entre wall e line mantendo seleção/estado sincronizados', async ({page}) => {
    await createHouse(page, 'tipo6');

    await triggerElementsAction(page, 'Objeto / Muro');
    const wallSelected = await selectCanvasObjectByMyTypeByDebug(page, 'wall', true, true);
    expect(wallSelected).toBe(true);

    const wallInput = page.getByPlaceholder('Ex.: Muro, Vizinho, etc.');
    await expect(wallInput).toBeVisible();
    await wallInput.fill('Muro teste e2e');
    await page.locator('button[title="Azul"]').first().click();
    await page.getByRole('button', {name: 'Confirmar'}).last().click();

    await selectCanvasObjectByMyTypeByDebug(page, 'wall', true, false);
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('wall');
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.labelText).toBe('Muro teste e2e');

    await triggerLinesAction(page, 'Linha Reta');
    const lineSelected = await selectCanvasObjectByMyTypeByDebug(page, 'line', true, true);
    expect(lineSelected).toBe(true);

    const lineInput = page.getByPlaceholder('Ex: 5m, limite, etc.');
    await expect(wallInput).toBeHidden();
    await expect(lineInput).toBeVisible();
    await lineInput.fill('Linha teste e2e');
    await page.locator('button[title="Vermelho"]').first().click();
    await page.getByRole('button', {name: 'Confirmar'}).last().click();

    await selectCanvasObjectByMyTypeByDebug(page, 'line', true, false);
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.myType).toBe('line');
    await expect.poll(async () => (await getActiveCanvasObjectSummaryByDebug(page))?.labelText).toBe('Linha teste e2e');
  });
});
