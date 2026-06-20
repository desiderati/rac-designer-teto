import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.describe('Dificuldade da casa', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupSeededRacEditorPage(page, {
      insertInitialViews: true,
      siteAssessment: {
        hasHydraulicObstacles: false,
        hasUndergroundObstacles: false,
        hasElevatedObstacles: false,
        hasNeighborSetbackConstraints: false,
      },
    });
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('sincroniza controles do canvas com o medidor da listagem', async ({page}) => {
    const canvasMeter = page.getByTestId('canvas-house-difficulty-gauge')
      .getByRole('meter', {name: 'Dificuldade da casa ativa'});
    await expect(canvasMeter).toBeVisible();

    const initialScore = Number(await canvasMeter.getAttribute('aria-valuenow'));

    await page.getByRole('button', {name: /Editar perfil do solo/i}).click();
    await page.getByRole('menuitem', {name: 'Selecionar solo Lençol Freático / Água no Fundo'}).click();
    await page.getByRole('button', {name: 'Obstáculos Hidráulicos'}).click();
    await page.getByRole('button', {name: 'Obstáculos Subterrâneos'}).click();
    await page.getByRole('button', {name: 'Obstáculos Elevados'}).click();
    await page.getByRole('button', {name: 'Servidões Vizinhas'}).click();

    await expect(page.getByRole('button', {name: 'Obstáculos Hidráulicos'})).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', {name: 'Obstáculos Subterrâneos'})).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', {name: 'Obstáculos Elevados'})).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', {name: 'Servidões Vizinhas'})).toHaveAttribute('aria-pressed', 'true');

    const updatedScore = Number(await canvasMeter.getAttribute('aria-valuenow'));
    expect(updatedScore).toBeGreaterThan(initialScore);

    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    await page.getByRole('row', {name: /CC2603.*Em andamento/i})
      .getByRole('button', {name: 'Gerenciar casas da construção CC2603'})
      .click();

    const tableMeter = page.getByTestId('house-table-difficulty-gauge')
      .getByRole('meter', {name: 'Dificuldade da casa'});
    await expect(tableMeter).toHaveAttribute('aria-valuenow', String(updatedScore));
  });
});
