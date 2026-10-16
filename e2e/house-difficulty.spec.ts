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
    await page.getByRole('button', {name: 'Obstáculos', exact: true}).click();
    const menu = page.getByRole('menu', {name: 'Obstáculos', exact: true});
    for (const name of ['Obstáculos hidráulicos', 'Obstáculos subterrâneos', 'Obstáculos elevados', 'Servidões vizinhas']) {
      const option = menu.getByRole('menuitemcheckbox', {name, exact: true});
      await option.click();
      await expect(option).toHaveAttribute('aria-checked', 'true');
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', {name: 'Obstáculos', exact: true})).toHaveAttribute('aria-pressed', 'true');

    const updatedScore = Number(await canvasMeter.getAttribute('aria-valuenow'));
    expect(updatedScore).toBeGreaterThan(initialScore);

    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    await page.getByRole('row', {name: /CC2603.*Andamento/i})
      .click();

    const tableMeter = page.getByTestId('house-table-difficulty-gauge')
      .getByRole('meter', {name: 'Dificuldade da casa'});
    await expect(tableMeter).toHaveAttribute('aria-valuenow', String(updatedScore));
  });
});
