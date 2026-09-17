import {expect, test} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  getHousePilotiByDebug,
  openPilotiEditorByDebug,
  setPilotiMasterByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

test.describe('RAC piloti rules', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('pilotis: regra de mestre único permanece válida ao trocar mestre', async ({page}) => {
    await createHouse(page, 'tipo6');

    await setPilotiMasterByDebug(page, 'piloti_0_0');
    await setPilotiMasterByDebug(page, 'piloti_3_2');

    const a1 = await getHousePilotiByDebug(page, 'piloti_0_0');
    const c4 = await getHousePilotiByDebug(page, 'piloti_3_2');

    expect(c4?.isMaster).toBe(true);
    expect(a1?.isMaster).toBe(false);
  });

  test('pilotis: abre editor de piloti sem tela branca', async ({page}) => {
    await createHouse(page, 'tipo6');

    const opened = await openPilotiEditorByDebug(page, 'piloti_0_0');
    expect(opened).toBe(true);

    await expect(page.getByText('Definir como Mestre?')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Confirmar'})).toBeVisible();
  });

  test('pilotis: persiste primeiro ajuste manual do slider ao sair do auto', async ({page}) => {
    await createHouse(page, 'tipo6');

    const opened = await openPilotiEditorByDebug(page, 'piloti_0_0');
    expect(opened).toBe(true);

    const modeButton = page.getByRole('button', {name: 'Modo automático de altura dos pilotis'});
    await expect(modeButton).toHaveAttribute('aria-pressed', 'true');
    await modeButton.click();
    await expect(modeButton).toHaveAttribute('aria-pressed', 'false');

    const slider = page.getByRole('slider');
    const initialNivel = Number(await slider.getAttribute('aria-valuenow'));
    const expectedNivel = Math.round((initialNivel + 0.01) * 100) / 100;

    await slider.focus();
    await slider.press('ArrowRight');

    await expect.poll(async () => (await getHousePilotiByDebug(page, 'piloti_0_0'))?.nivel)
      .toBe(expectedNivel);
    await expect.poll(async () => {
      const document = await readConstructionSiteDocument(page);
      const site = document?.constructionSites[0];
      const activeHouseId = site?.constructionSite.activeHouseId;
      const activeHouse = site?.houses.find((house) => house.id === activeHouseId);
      return activeHouse?.drawingDocument.house.pilotis.piloti_0_0?.nivel ?? null;
    }).toBe(expectedNivel);
  });
});

