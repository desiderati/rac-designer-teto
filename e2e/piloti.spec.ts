import {expect, test} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  getHousePilotiByDebug,
  setPilotiMasterByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-helpers';

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

    const opened = await page.evaluate(() => {
      const debug = (window as { __racDebug?: { openPilotiEditor?: (pilotiId: string) => boolean } }).__racDebug;
      return debug?.openPilotiEditor?.('piloti_0_0') ?? false;
    });
    expect(opened).toBe(true);

    await expect(page.getByText('Definir como Mestre?')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Confirmar'})).toBeVisible();
  });
});

