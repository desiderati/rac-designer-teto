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

  test('alinha foto e salvar monitor ao rodapé do resumo da construção', async ({page}) => {
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    await page.getByRole('row', {name: /CC2603.*Em andamento/i})
      .getByRole('button', {name: 'Gerenciar monitores da construção CC2603'})
      .click();
    await page.getByRole('button', {name: '+ Adicionar Monitor'}).click();

    await expect(page.getByRole('heading', {name: 'Cadastrar Monitor'})).toBeVisible();

    const constructionSummaryBox = await page.getByTestId('monitor-form').locator('aside').boundingBox();
    const photoBox = await page.getByTestId('monitor-photo-field')
      .getByRole('button', {name: 'Foto do Monitor', exact: true})
      .boundingBox();
    const saveButtonBox = await page.getByRole('button', {name: 'Cadastrar Monitor'}).boundingBox();

    expect(constructionSummaryBox).not.toBeNull();
    expect(photoBox).not.toBeNull();
    expect(saveButtonBox).not.toBeNull();

    const constructionSummaryBottom = constructionSummaryBox!.y + constructionSummaryBox!.height;
    const photoBottom = photoBox!.y + photoBox!.height;
    const saveButtonBottom = saveButtonBox!.y + saveButtonBox!.height;

    expect(Math.abs(photoBottom - constructionSummaryBottom)).toBeLessThanOrEqual(1);
    expect(Math.abs(saveButtonBottom - constructionSummaryBottom)).toBeLessThanOrEqual(1);
  });
});
