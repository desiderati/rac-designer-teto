import {expect, test} from '@playwright/test';
import {writeFileSync} from 'node:fs';
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

  test.describe('Tours das ações mobile da casa', () => {
    test.use({hasTouch: true});
    test('segue a ordem dos botões no primeiro tour completo mobile', async ({page}, testInfo) => {
      await page.evaluate(() => {
        for (const key of Object.keys(localStorage)) {
          if (['guided-tour:rac-house-add:', 'guided-tour:rac-house-actions:', 'guided-tour:rac-house-field-analysis:', 'guided-tour:rac-house-reset:'].some(prefix => key.startsWith(prefix))) localStorage.removeItem(key);
        }
      });
      await page.getByRole('button', {name: 'Abrir menu principal'}).click();
      await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
      await page.setViewportSize({width: 736, height: 375});
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
      await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();
      const layouts = [];
      for (const title of ['Adicionar Casa', 'Prévia do Canvas', 'Status da Casa', 'Dificuldade', 'Análise de Campo', 'Materiais Extras', 'Exportar RAC PDF', 'Casa Construída', 'Arquivar Casa', 'Redefinir Casa', 'Voltar para Construções']) {
        const dialog = page.getByRole('dialog', {name: title, exact: true});
        await expect(dialog).toBeVisible();
        if (title === 'Prévia do Canvas') {
          await expect(dialog).toContainText('toque na foto ou nas iniciais da casa');
          await expect(dialog).toContainText('“Ir pro Canvas” no menu do canto superior direito da prévia');
        }
        const balloon = (await dialog.boundingBox())!;
        const highlight = (await page.getByTestId('guided-tour-highlight').boundingBox())!;
        const ok = (await dialog.getByRole('button', {name: 'OK', exact: true}).boundingBox())!;
        for (const box of [balloon, highlight, ok]) {
          expect(box.x, `${title}: margem esquerda`).toBeGreaterThanOrEqual(0);
          expect(box.y, `${title}: margem superior`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${title}: margem direita`).toBeLessThanOrEqual(736);
          expect(box.y + box.height, `${title}: margem inferior`).toBeLessThanOrEqual(375);
        }
        const overlapsHighlight = balloon.x < highlight.x + highlight.width && balloon.x + balloon.width > highlight.x
          && balloon.y < highlight.y + highlight.height && balloon.y + balloon.height > highlight.y;
        expect(overlapsHighlight, `${title}: destaque visível`).toBe(false);
        const screenshot = `${String(layouts.length + 1).padStart(2, '0')}-tour.png`;
        await page.screenshot({path: testInfo.outputPath(screenshot), animations: 'disabled'});
        layouts.push({order: layouts.length + 1, title, text: await dialog.innerText(), balloon, highlight, ok, overlapsHighlight, screenshot});
        await dialog.getByRole('button', {name: 'OK', exact: true}).tap();
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('region', {name: 'Listagem de casas', exact: true})).toBeVisible();
      for (const key of ['rac-house-add', 'rac-house-actions', 'rac-house-field-analysis', 'rac-house-reset']) {
        await expect.poll(() => page.evaluate(key => localStorage.getItem(`guided-tour:${key}:completed`), key)).toBe('true');
      }
      writeFileSync(testInfo.outputPath('tour-layout.json'), JSON.stringify({viewport: {width: 736, height: 375}, hasTouch: true, layouts}, null, 2));
      await page.screenshot({path: testInfo.outputPath('12-completo.png'), animations: 'disabled'});
    });
    for (const viewport of [{width: 736, height: 375}, {width: 390, height: 844}]) {
      test(`orienta Pilotis e Redefinir em ${viewport.width}×${viewport.height} sem executar as ações`, async ({page}) => {
        await page.evaluate(() => {
          localStorage.removeItem('guided-tour:rac-house-field-analysis:completed');
          localStorage.removeItem('guided-tour:rac-house-reset:completed');
        });
        await page.getByRole('button', {name: 'Abrir menu principal'}).click();
        await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
        await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();
        await expect(page.getByRole('region', {name: 'Listagem de casas', exact: true})).toBeVisible();
        await page.setViewportSize(viewport);

        for (const [id, title] of [['rac-house-field-analysis', 'Análise de Campo'], ['rac-house-reset', 'Redefinir Casa']]) {
          const dialog = page.getByRole('dialog', {name: title, exact: true});
          await expect(dialog).toBeVisible();
          const target = page.locator(`[data-guided-tour-id="${id}"]`);
          await expect(target).toBeEnabled();
          await expect.poll(async () => {
            const bounds = (await target.boundingBox())!;
            return bounds.y >= 8 && bounds.y + bounds.height <= viewport.height - 8;
          }).toBe(true);
          const balloon = (await dialog.boundingBox())!;
          expect(balloon.x).toBeGreaterThanOrEqual(0);
          expect(balloon.y).toBeGreaterThanOrEqual(0);
          expect(balloon.x + balloon.width).toBeLessThanOrEqual(viewport.width);
          expect(balloon.y + balloon.height).toBeLessThanOrEqual(viewport.height);
          const targetBounds = (await target.boundingBox())!;
          const overlapsTarget = balloon.x < targetBounds.x + targetBounds.width
            && balloon.x + balloon.width > targetBounds.x
            && balloon.y < targetBounds.y + targetBounds.height
            && balloon.y + balloon.height > targetBounds.y;
          expect(overlapsTarget).toBe(false);
          await page.screenshot({path: `.agents/work-items/2026-10/20261021-textos-tours-dicas.work-item.assets/${id}-${viewport.width}x${viewport.height}.png`});
          await dialog.getByRole('button', {name: 'OK', exact: true}).tap();
          await expect.poll(() => page.evaluate(key => localStorage.getItem(key), `guided-tour:${id}:completed`)).toBe('true');
        }
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByRole('alertdialog')).toHaveCount(0);
        await expect(page.getByRole('region', {name: 'Listagem de casas', exact: true})).toBeVisible();
        await page.setViewportSize({width: 1280, height: 800});
        await page.getByRole('button', {name: 'Voltar', exact: true}).click();
        await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();
        await page.setViewportSize(viewport);
        await expect(page.getByRole('dialog')).toHaveCount(0);
      });
    }
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

    const pilotiDialog = page.getByRole('dialog').filter({hasText: 'Ajuste nível, tamanho e contraventamento'});
    await expect(pilotiDialog).toBeVisible();
    await expect(pilotiDialog).toContainText('Ajuste nível, tamanho e contraventamento');
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
