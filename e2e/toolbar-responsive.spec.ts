import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';

test.describe('RAC responsive toolbar', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await page.setViewportSize({width: 390, height: 844});
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('mobile: 3D e PDF ficam no menu do usuário', async ({page}) => {
    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toHaveCount(0);

    await page.getByRole('button', {name: 'Abrir menu da conta'}).click();

    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();
  });

  test('mobile: menu de zoom mostra apenas ícones das opções', async ({page}) => {
    const zoomButton = page.getByRole('button', {name: /Zoom atual/});

    await expect(zoomButton).toContainText(/^\d+%$/);
    await expect(zoomButton.locator('svg[data-icon="magnifying-glass"]')).toHaveCount(0);

    await zoomButton.click();

    await expect(page.getByRole('button', {name: 'Seleção'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Panning'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Fit to View'})).toBeVisible();
    await expect(page.getByText('Seleção')).toHaveCount(0);
    await expect(page.getByText('Panning')).toHaveCount(0);
    await expect(page.getByText('Fit to View')).toHaveCount(0);

    const zoomDialog = page.getByRole('dialog');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Seleção'}).textContent())
      .toBe('');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Panning'}).textContent())
      .toBe('');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Fit to View'}).textContent())
      .toBe('');
  });

  test('mobile: menu lateral recolhe e reaparece por arraste', async ({page}) => {
    const closeHandle = page.getByRole('button', {name: 'Recolher menu lateral'});
    const rail = page.getByRole('toolbar', {name: 'Barra de ferramentas principal'});
    await expect(rail).toBeVisible();

    const closeBox = await closeHandle.boundingBox();
    const railBox = await rail.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    if (!closeBox) throw new Error('Alça de recolhimento não disponível.');
    if (!railBox) throw new Error('Menu lateral não disponível.');
    expect(closeBox.x).toBeGreaterThan(railBox.x + railBox.width - 4);

    await page.mouse.move(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(closeBox.x - 40, closeBox.y + closeBox.height / 2);
    await page.mouse.up();

    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toHaveCount(0);

    const openHandle = page.getByRole('button', {name: 'Abrir menu lateral'});
    const openBox = await openHandle.boundingBox();
    expect(openBox).not.toBeNull();
    if (!openBox) throw new Error('Alça de abertura não disponível.');

    await page.mouse.move(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(openBox.x + 50, openBox.y + openBox.height / 2);
    await page.mouse.up();

    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
  });
});
