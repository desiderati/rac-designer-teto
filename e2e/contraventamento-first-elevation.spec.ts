import {expect, test, type Page} from '@playwright/test';
import {
  createHouse,
  expectNoConsoleErrors,
  getCanvasPosition,
  getContraventamentoProjectionSignatures,
  getPilotiScreenPositionByDebug,
  openPilotiEditorByDebug,
  removeViewByDebug,
  setCanvasPositionByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerHouseAction,
  updatePilotiByDebug,
} from './helpers/rac-editor.helpers';

test.describe('RAC contraventamento em primeira vista elevada', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('tipo6: contraventamento horizontal nasce com a mesma geometria após reinserir a frontal', async ({page}) => {
    await createHouse(page, 'tipo6');
    await makePilotisEligible(page, ['piloti_0_0', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0']);

    await insertContraventamento(page, 'piloti_0_0', 'Inferior', 'piloti_3_0');
    await triggerHouseAction(page, 'Frontal');

    const firstProjection = await waitForProjectionSignatures(page, 'front', 'top');
    expect(firstProjection.length).toBeGreaterThan(0);

    expect(await removeViewByDebug(page, 'front', 'top')).toBe(true);
    await triggerHouseAction(page, 'Frontal');

    await expect
      .poll(() => getContraventamentoProjectionSignatures(page, 'front', 'top'))
      .toEqual(firstProjection);
  });

  test('tipo3: contraventamento vertical nasce com a mesma geometria após reinserir o quadrado aberto', async ({page}) => {
    await createHouse(page, 'tipo3');
    await makePilotisEligible(page, ['piloti_0_0', 'piloti_0_1', 'piloti_0_2']);

    await insertContraventamento(page, 'piloti_0_0', 'Esquerdo', 'piloti_0_2');
    await triggerHouseAction(page, 'Quadrado Aberto');

    const firstProjection = await waitForProjectionSignatures(page, 'side2', 'left');
    expect(firstProjection.length).toBeGreaterThan(0);

    expect(await removeViewByDebug(page, 'side2', 'left')).toBe(true);
    await triggerHouseAction(page, 'Quadrado Aberto');

    await expect
      .poll(() => getContraventamentoProjectionSignatures(page, 'side2', 'left'))
      .toEqual(firstProjection);
  });
});

async function makePilotisEligible(page: Page, pilotiIds: string[]) {
  for (const pilotiId of pilotiIds) {
    await updatePilotiByDebug(page, pilotiId, {height: 1.0, nivel: 0.5});
  }
}

async function insertContraventamento(
  page: Page,
  sourcePilotiId: string,
  sideButtonName: 'Esquerdo' | 'Direito' | 'Superior' | 'Inferior',
  targetPilotiId: string,
) {
  expect(await openPilotiEditorByDebug(page, sourcePilotiId)).toBe(true);
  await expect(page.getByRole('button', {name: sideButtonName})).toBeEnabled();
  await page.getByRole('button', {name: sideButtonName}).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  const targetPosition = await bringPilotiIntoViewport(page, targetPilotiId);
  expect(targetPosition).not.toBeNull();
  await page.mouse.click(targetPosition!.x, targetPosition!.y);
}

async function bringPilotiIntoViewport(page: Page, pilotiId: string) {
  const viewport = page.viewportSize() ?? {width: 1280, height: 720};
  let targetPosition = await getPilotiScreenPositionByDebug(page, pilotiId);
  expect(targetPosition).not.toBeNull();

  const margin = 48;
  const isVisible =
    targetPosition!.x >= margin
    && targetPosition!.x <= viewport.width - margin
    && targetPosition!.y >= margin
    && targetPosition!.y <= viewport.height - margin;

  if (isVisible) return targetPosition;

  const canvasPosition = await getCanvasPosition(page);
  expect(canvasPosition).not.toBeNull();

  await setCanvasPositionByDebug(
    page,
    canvasPosition!.x + (viewport.width / 2 - targetPosition!.x),
    canvasPosition!.y + (viewport.height / 2 - targetPosition!.y),
  );

  targetPosition = await getPilotiScreenPositionByDebug(page, pilotiId);
  expect(targetPosition).not.toBeNull();
  return targetPosition;
}

async function waitForProjectionSignatures(
  page: Page,
  viewType: 'front' | 'back' | 'side1' | 'side2',
  side: 'top' | 'bottom' | 'left' | 'right',
) {
  await expect
    .poll(async () => (await getContraventamentoProjectionSignatures(page, viewType, side)).length)
    .toBeGreaterThan(0);

  return getContraventamentoProjectionSignatures(page, viewType, side);
}
