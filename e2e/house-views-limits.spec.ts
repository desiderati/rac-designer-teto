import {expect, test} from '@playwright/test';
import {
  createHouse,
  ensureMainMenuOpen,
  expectNoConsoleErrors,
  getHouseSnapshot,
  removeViewByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerHouseAction,
} from './helpers/rac-editor.helpers';

test.describe('RAC views and limits', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('tipo6: bloqueia adicionar visão frontal além do limite', async ({page}) => {
    await createHouse(page, 'tipo6');

    await ensureMainMenuOpen(page);
    await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
    await page.getByRole('button', {name: 'Visão Frontal'}).click();

    await expect(page.getByText('Limite de Frontal atingido para este tipo de casa.')).toBeVisible();
  });

  test('M4: mantém planta e posição superior da vista inicial (tipo6)', async ({page}) => {
    await createHouse(page, 'tipo6');

    const snapshot = await getHouseSnapshot(page);

    expect(snapshot?.views.top.length).toBe(1);
    expect(snapshot?.views.front.length).toBe(1);
    expect(snapshot?.sideMappings.top).toBe('front');
  });

  test('tipo3: bloqueia adicionar quadrado aberto além do limite', async ({page}) => {
    await createHouse(page, 'tipo3');

    await ensureMainMenuOpen(page);
    await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
    await page.getByRole('button', {name: 'Quadrado Aberto'}).click();

    await expect(page.getByText('Limite de Quadrado Aberto atingido para este tipo de casa.')).toBeVisible();
  });

  test('M6: seleciona lado da lateral e bloqueia após atingir limite (tipo3)', async ({page}) => {
    await createHouse(page, 'tipo3');

    await ensureMainMenuOpen(page);
    await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
    await page.getByRole('button', {name: 'Visão Lateral'}).click();
    await page.getByRole('button', {name: 'Superior'}).click();

    await ensureMainMenuOpen(page);
    await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
    await page.getByRole('button', {name: 'Visão Lateral'}).click();
    await expect(page.getByRole('heading', {name: 'Qual das laterais deseja mostrar?'})).toBeHidden();

    await expect
      .poll(async () => (await getHouseSnapshot(page))?.views.back.length ?? 0)
      .toBe(2);

    const snapshot = await getHouseSnapshot(page);
    expect(snapshot?.sideMappings.top).toBe('back');
    expect(snapshot?.sideMappings.bottom).toBe('back');

    await triggerHouseAction(page, 'Visão Lateral');
    await expect(page.getByText('Limite de Lateral atingido para este tipo de casa.')).toBeVisible();
  });

  test('vistas tipo6: remove e reinsere visão traseira', async ({page}) => {
    await createHouse(page, 'tipo6');

    await triggerHouseAction(page, 'Visão Traseira');
    await expectViewCount(page, 'back', 1);
    let snapshot = await getHouseSnapshot(page);

    const removed = await removeViewByDebug(page, 'back');
    expect(removed).toBe(true);
    await expectViewCount(page, 'back', 0);
    snapshot = await getHouseSnapshot(page);
    expect(Object.values(snapshot?.sideMappings ?? {})).not.toContain('back');

    await triggerHouseAction(page, 'Visão Traseira');
    await expectViewCount(page, 'back', 1);
    snapshot = await getHouseSnapshot(page);
  });

  test('vistas tipo6: quadrado fechado libera novamente após remoção', async ({page}) => {
    await createHouse(page, 'tipo6');

    await triggerHouseAction(page, 'Quadrado Fechado', 'Direito');
    await triggerHouseAction(page, 'Quadrado Fechado');
    await triggerHouseAction(page, 'Quadrado Fechado');
    await expect(page.getByText('Limite de Quadrado Fechado atingido para este tipo de casa.')).toBeVisible();

    await expectViewCount(page, 'side1', 2);
    let snapshot = await getHouseSnapshot(page);

    const removed = await removeViewByDebug(page, 'side1');
    expect(removed).toBe(true);
    await expectViewCount(page, 'side1', 1);
    snapshot = await getHouseSnapshot(page);

    await triggerHouseAction(page, 'Quadrado Fechado');
    await expectViewCount(page, 'side1', 2);
    snapshot = await getHouseSnapshot(page);
  });

  test('vistas tipo3: lateral libera novamente após remoção', async ({page}) => {
    await createHouse(page, 'tipo3');

    await triggerHouseAction(page, 'Visão Lateral', 'Superior');
    await triggerHouseAction(page, 'Visão Lateral');
    await triggerHouseAction(page, 'Visão Lateral');
    await expect(page.getByText('Limite de Lateral atingido para este tipo de casa.')).toBeVisible();

    await expectViewCount(page, 'back', 2);
    let snapshot = await getHouseSnapshot(page);

    const removed = await removeViewByDebug(page, 'back', 'top');
    expect(removed).toBe(true);
    await expectViewCount(page, 'back', 1);
    snapshot = await getHouseSnapshot(page);
    expect(snapshot?.sideMappings.top).toBeNull();

    await triggerHouseAction(page, 'Visão Lateral', 'Superior');
    await expectViewCount(page, 'back', 2);
    snapshot = await getHouseSnapshot(page);
    expect(snapshot?.sideMappings.top).toBe('back');
  });

  test('vistas tipo3: quadrado aberto libera novamente após remoção', async ({page}) => {
    await createHouse(page, 'tipo3');

    await triggerHouseAction(page, 'Quadrado Aberto');
    await expect(page.getByText('Limite de Quadrado Aberto atingido para este tipo de casa.')).toBeVisible();

    const removed = await removeViewByDebug(page, 'side2');
    expect(removed).toBe(true);

    await expectViewCount(page, 'side2', 0);
    let snapshot = await getHouseSnapshot(page);

    await triggerHouseAction(page, 'Quadrado Aberto');
    await expectViewCount(page, 'side2', 1);
    snapshot = await getHouseSnapshot(page);
  });
});

async function expectViewCount(
  page: Parameters<typeof getHouseSnapshot>[0],
  viewType: 'top' | 'front' | 'back' | 'side1' | 'side2',
  expectedCount: number,
) {
  await expect
    .poll(async () => (await getHouseSnapshot(page))?.views[viewType].length ?? 0)
    .toBe(expectedCount);
}

