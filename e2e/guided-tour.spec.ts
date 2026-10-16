import {expect, test} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  getPilotiScreenPositionByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerHouseAction,
} from './helpers/rac-editor.helpers';

test.describe('RAC guided tour', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('guided-tour: mostra planta na inserção da casa e elevação na primeira vista elevada', async ({page}) => {
    await page.evaluate(() => {
      localStorage.removeItem('guided-tour:rac-house-top-view:completed');
      localStorage.removeItem('guided-tour:rac-house-elevation-view:completed');
    });

    await createHouse(page, 'tipo6', {dismissInitialHouseTour: false});

    const topViewDialog = page.getByRole('dialog').filter({hasText: 'Vista Planta'});
    await expect(topViewDialog).toBeVisible();
    await expect(topViewDialog).toContainText('Vista Planta');
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(2);
    const topViewHighlight = await page.getByTestId('guided-tour-highlight').boundingBox();
    expect(topViewHighlight).not.toBeNull();

    await topViewDialog.getByRole('button', {name: 'OK'}).click();

    const pilotiDialog = page.getByRole('dialog').filter({hasText: 'Na planta superior'});
    await expect(pilotiDialog).toBeVisible();
    await expect(pilotiDialog).toContainText('Na planta superior');
    await expect(pilotiDialog).not.toContainText('Editar Piloti');
    const pilotiHighlight = await page.getByTestId('guided-tour-highlight').boundingBox();
    expect(pilotiHighlight).not.toBeNull();
    const pilotiCenter = {
      x: pilotiHighlight!.x + pilotiHighlight!.width / 2,
      y: pilotiHighlight!.y + pilotiHighlight!.height / 2,
    };
    expect(pilotiCenter.x).toBeGreaterThanOrEqual(topViewHighlight!.x);
    expect(pilotiCenter.x).toBeLessThanOrEqual(topViewHighlight!.x + topViewHighlight!.width);
    expect(pilotiCenter.y).toBeGreaterThanOrEqual(topViewHighlight!.y);
    expect(pilotiCenter.y).toBeLessThanOrEqual(topViewHighlight!.y + topViewHighlight!.height);
    const pilotiScreenPosition = await getPilotiScreenPositionByDebug(page, 'piloti_0_0');
    expect(pilotiScreenPosition).not.toBeNull();
    expect(Math.abs(pilotiCenter.x - pilotiScreenPosition!.x)).toBeLessThanOrEqual(
      Math.max(12, pilotiHighlight!.width / 2 + 4)
    );
    expect(Math.abs(pilotiCenter.y - pilotiScreenPosition!.y)).toBeLessThanOrEqual(
      Math.max(12, pilotiHighlight!.height / 2 + 4)
    );
    await pilotiDialog.getByRole('button', {name: 'OK'}).click();
    await expect(pilotiDialog).toBeHidden();

    const elevationDialog = page.getByRole('dialog').filter({hasText: 'Vista Elevada'});
    await expect(elevationDialog).toBeHidden();

    await triggerHouseAction(page, 'Frontal');

    await expect(elevationDialog).toBeVisible();
    await expect(elevationDialog).toContainText('Vista Elevada');

    await elevationDialog.getByRole('button', {name: 'OK'}).click();
    await expect(elevationDialog).toBeHidden();
  });

  test('guided-tour: orienta ações principais da listagem de construções', async ({page}) => {
    await page.evaluate(() => {
      localStorage.setItem('guided-tour:rac-construction-add:completed', 'true');
      localStorage.setItem('guided-tour:rac-construction-add:completed:revision', 'construction-add-v1');
      localStorage.removeItem('guided-tour:rac-construction-actions:completed');
      localStorage.removeItem('guided-tour:rac-construction-actions:completed:revision');
      localStorage.setItem('guided-tour:rac-construction-back-to-canvas:completed', 'true');
      localStorage.setItem('guided-tour:rac-construction-back-to-canvas:completed:revision', 'construction-back-to-canvas-v1');
    });

    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();

    const monitorsDialog = page.getByRole('dialog').filter({hasText: 'Monitores'});
    await expect(monitorsDialog).toBeVisible();
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(5);

    await monitorsDialog.getByRole('button', {name: 'OK'}).click();
    const housesDialog = page.getByRole('dialog').filter({hasText: 'Editar Construção'});
    await expect(housesDialog).toBeVisible();

    await housesDialog.getByRole('button', {name: 'OK'}).click();
    const exportDialog = page.getByRole('dialog').filter({hasText: 'Exportar RACs'});
    await expect(exportDialog).toBeVisible();

    await exportDialog.getByRole('button', {name: 'OK'}).click();
    const completedDialog = page.getByRole('dialog').filter({hasText: 'Construção Concluída'});
    await expect(completedDialog).toBeVisible();

    await completedDialog.getByRole('button', {name: 'OK'}).click();
    const archiveDialog = page.getByRole('dialog').filter({hasText: 'Arquivar Construção'});
    await expect(archiveDialog).toBeVisible();

    await archiveDialog.getByRole('button', {name: 'OK'}).click();
    await expect(archiveDialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => (
      localStorage.getItem('guided-tour:rac-construction-actions:completed')
    ))).toBe('true');
  });

  test('guided-tour: orienta criação e edição de casas', async ({page}) => {
    await page.evaluate(() => {
      localStorage.removeItem('guided-tour:rac-house-add:completed');
      localStorage.removeItem('guided-tour:rac-house-add:completed:revision');
      localStorage.removeItem('guided-tour:rac-house-actions:completed');
      localStorage.removeItem('guided-tour:rac-house-actions:completed:revision');
    });

    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();

    const addDialog = page.getByRole('dialog').filter({hasText: 'Adicionar Casa'});
    await expect(addDialog).toBeVisible();
    await expect(addDialog).toContainText('Adicionar Casa');
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(0);

    await addDialog.getByRole('button', {name: 'OK'}).click();
    const previewDialog = page.getByRole('dialog', {name: 'Prévia do Canvas', exact: true});
    await expect(previewDialog).toBeVisible();
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(8);
    await previewDialog.getByRole('button', {name: 'OK'}).click();
    const statusDialog = page.getByRole('dialog').filter({hasText: 'Status da Casa'});
    await expect(statusDialog).toBeVisible();
    await expect(page.getByTestId('guided-tour-progress-dot')).toHaveCount(8);

    await statusDialog.getByRole('button', {name: 'OK'}).click();
    const difficultyDialog = page.getByRole('dialog').filter({hasText: 'Dificuldade'});
    await expect(difficultyDialog).toBeVisible();

    await difficultyDialog.getByRole('button', {name: 'OK'}).click();
    const materialsDialog = page.getByRole('dialog').filter({hasText: 'Materiais Extras'});
    await expect(materialsDialog).toBeVisible();

    await materialsDialog.getByRole('button', {name: 'OK'}).click();
    const pdfDialog = page.getByRole('dialog', {name: 'Exportar RAC PDF', exact: true});
    await expect(pdfDialog).toBeVisible();
    await pdfDialog.getByRole('button', {name: 'OK'}).click();
    const builtDialog = page.getByRole('dialog').filter({hasText: 'Casa Construída'});
    await expect(builtDialog).toBeVisible();
    await expect(builtDialog).toContainText('casa como construída');

    await builtDialog.getByRole('button', {name: 'OK'}).click();
    const archiveDialog = page.getByRole('dialog').filter({hasText: 'Arquivar Casa'});
    await expect(archiveDialog).toBeVisible();

    await archiveDialog.getByRole('button', {name: 'OK'}).click();
    const backDialog = page.getByRole('dialog').filter({hasText: 'Voltar para Construções'});
    await expect(backDialog).toBeVisible();

    await backDialog.getByRole('button', {name: 'OK'}).click();
    await expect(backDialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => (
      localStorage.getItem('guided-tour:rac-house-actions:completed')
    ))).toBe('true');
  });
});
