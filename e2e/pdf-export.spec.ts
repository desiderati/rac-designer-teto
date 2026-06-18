import {expect, test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {
  createHouse,
  expectNoConsoleErrors,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

const pdfExportSeed = {
  houseSize: 'large' as const,
  leaders: 'Ana + Bruno',
  extraMaterials: {
    floorBeams: 12,
    rafters: 24,
    secondaryBeams: 8,
    gutters: 4,
    justification: 'Material extra aprovado pela monitoria.',
  },
  notes: 'Casa deve manter acesso lateral livre.',
  selectedPilotiHeights: [1, 1.5, 2, 2.5],
  siteAssessment: {
    soilProfile: 'water_table' as const,
    hasElevatedObstacles: true,
  },
  monitors: [
    {name: 'Carioca', phone: '(41) 98889-7269', status: 'active' as const},
    {name: 'Senna', phone: '(41) 99512-0514', status: 'inactive' as const},
    {name: 'John', phone: '(51) 99117-9216', status: 'active' as const},
  ],
  pilotis: {
    piloti_0_0: {height: 1, nivel: 0.1, isMaster: true},
    piloti_1_0: {height: 1.5, nivel: 0.3},
    piloti_3_2: {height: 2, nivel: 0.8},
  },
};

test.describe('Exportação PDF do RAC', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('gera download de um relatório PDF A4 paisagem a partir do editor', async ({page}) => {
    await setupRacEditorPage(page);
    await createHouse(page, 'tipo6');
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Exportar RAC em PDF'}).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('RAC-CC2603-FAMILIA-E2E.pdf');

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const pdf = readFileSync(downloadPath!);
    const pdfText = pdf.toString('latin1');

    expect(pdfText.startsWith('%PDF')).toBe(true);
    expect(pdfText).toContain('/Creator (RAC Designer TETO)');
    expect(pdfText).toMatch(/\/MediaBox \[0 0 841\.88\d* 595\.27\d*\]/);
    expect((pdfText.match(/\/Type \/Page\b/g) ?? []).length).toBe(2);
  });

  test('gera download pelo menu móvel da conta', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
    });

    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toHaveCount(0);

    await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
    const exportButton = page.getByRole('button', {name: 'Exportar RAC em PDF'});
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('RAC-CC2603-FAMILIA-E2E.pdf');
  });
});
