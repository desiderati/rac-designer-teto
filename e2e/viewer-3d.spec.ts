import {expect, test} from '@playwright/test';
import {
  createHouse,
  ensureOverflowMenuOpen,
  expectNoConsoleErrors,
  getCanvasObjectsSummary,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';

test.describe('RAC 3D viewer', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('viewer 3D: abre modal, executa controles e insere snapshot no canvas', async ({page}) => {
    await createHouse(page, 'tipo6');

    const beforeObjects = await getCanvasObjectsSummary(page);
    const beforeImageCount = beforeObjects.filter((obj) => obj.type === 'image').length;

    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Visualizar em 3D'}).click();
    await expect(page.getByRole('heading', {name: 'Visualizador 3D'})).toBeVisible();

    await page.locator('button[title="Cor das Paredes"]').click();
    await page.locator('button[title="Terracota"]').click();

    await page.locator('button[title="Resetar Câmera"]').click();
    await page.locator('button[title="Fullscreen"]').click();
    await expect(page.locator('button[title="Sair do Fullscreen"]')).toBeVisible();

    await expect.poll(async () => page.locator('canvas').count()).toBeGreaterThan(1);
    const insertButton = page.locator('button[title="Inserir no Canvas"]');
    await expect(insertButton).toBeEnabled();
    await insertButton.click();

    await expect
      .poll(async () => {
        const objects = await getCanvasObjectsSummary(page);
        return objects.filter((obj) => obj.type === 'image').length;
      })
      .toBeGreaterThan(beforeImageCount);

    await page.locator('button[title="Fechar"]').click();
    await expect(page.getByRole('heading', {name: 'Visualizador 3D'})).toBeHidden();
  });
});

