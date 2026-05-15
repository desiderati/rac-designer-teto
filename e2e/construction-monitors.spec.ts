import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.describe('Gerenciamento de monitores', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupSeededRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('abre Monitores pelo botão da Construção TETO na listagem', async ({page}) => {
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();

    await expect(page.getByRole('button', {name: 'Construções TETO'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Monitores'})).toHaveCount(0);
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    await page.getByRole('row', {name: /CC2603.*Em andamento/i})
      .getByRole('button', {name: 'Gerenciar monitores da construção CC2603'})
      .click();

    await expect(page.getByTestId('construction-management-shell')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Monitores - CC2603 · Tiradentes'})).toBeVisible();
    await expect(page.getByText('No. Monitores')).toHaveCount(0);
  });
});
