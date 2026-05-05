import {expect, test} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';

test.describe('RAC guided tour', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('guided-tour: mostra vista planta e vista elevada ao inserir a primeira casa no canvas', async ({page}) => {
    await createHouse(page, 'tipo6', {dismissInitialHouseTour: false});

    const topViewDialog = page.getByRole('dialog').filter({hasText: 'Vista Planta'});
    await expect(topViewDialog).toBeVisible();
    await expect(topViewDialog).toContainText('Vista Planta');
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(2);

    await topViewDialog.getByRole('button', {name: 'OK'}).click({force: true});

    const elevationDialog = page.getByRole('dialog').filter({hasText: 'Vista Elevada'});
    await expect(elevationDialog).toBeVisible();
    await expect(elevationDialog).toContainText('Vista Elevada');

    await elevationDialog.getByRole('button', {name: 'OK'}).click({force: true});
    await expect(elevationDialog).toBeHidden();
  });
});
