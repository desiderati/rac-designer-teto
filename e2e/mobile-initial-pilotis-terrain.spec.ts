import {expect, test, type Locator, type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {expectBoundsWithinViewport} from './helpers/geometry.helpers';
import {
  createHouse, expectNoConsoleErrors, getActiveCanvasObjectSummaryByDebug,
  getHouseSnapshot, selectCanvasObjectByMyTypeByDebug, setupRacEditorPage,
  startConsoleErrorCapture, triggerHouseAction,
} from './helpers/rac-editor.helpers';

const evidence = resolve(process.env.F1_O2_EVIDENCE_DIR ?? 'outputs/revalidacao-f1-o2-20261022');
test.use({isMobile: true, hasTouch: true});
test.beforeEach(async ({page}) => {
  startConsoleErrorCapture(page);
  await page.setViewportSize({width: 1280, height: 900});
  await setupRacEditorPage(page);
});
test.afterEach(({page}) => expectNoConsoleErrors(page));

async function screenshot(page: Page, name: string) {
  mkdirSync(evidence, {recursive: true});
  await page.screenshot({path: resolve(evidence, `${name}.png`), animations: 'disabled'});
}

async function expectInsideViewport(locator: Locator) {
  await expect(locator).toBeInViewport({ratio: 1});
  const bounds = (await locator.boundingBox())!;
  expectBoundsWithinViewport(bounds, {width: 667, height: 375});
}

test('F1: assistente inicial permite visitar os quatro cantos e inserir em 667x375 com toque', async ({page}) => {
  await page.setViewportSize({width: 667, height: 375});
  await page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).tap();
  await page.getByRole('button', {name: 'Casa TETO (Opções)', exact: true}).tap();
  await page.getByRole('button', {name: 'Casa Tipo 6', exact: true}).tap();
  await page.getByRole('button', {name: 'Superior', exact: true}).tap();
  const wizard = page.getByRole('dialog', {name: 'Janela de confirmação', exact: true});
  await expect(wizard).toBeVisible();
  await expectInsideViewport(wizard);
  const insert = wizard.getByRole('button', {name: 'Inserir', exact: true});
  await expect(insert).toBeDisabled();
  const master = wizard.getByRole('switch', {name: 'Definir como Mestre?'});
  await master.scrollIntoViewIfNeeded();
  await master.tap();
  await expect(master).toBeChecked();
  const next = wizard.getByRole('button', {name: 'Próximo piloti', exact: true});
  for (const corner of ['A1', 'A4', 'C1', 'C4']) {
    await next.scrollIntoViewIfNeeded();
    await expectInsideViewport(next);
    await expect(wizard.getByText(`Piloti ${corner}`, {exact: true})).toBeVisible();
    await screenshot(page, `f1-${corner}`);
    if (corner !== 'C4') await next.tap();
  }
  await expect(next).toBeDisabled();
  await expect(insert).toBeEnabled();
  await expectInsideViewport(insert);
  await insert.tap();
  await expect(wizard).toBeHidden();
  await expect.poll(async () => (await getHouseSnapshot(page))?.views.top.length).toBe(1);
});

test('O2: barra de seleção some no editor de terreno e retorna ao cancelar ou confirmar', async ({page}) => {
  await createHouse(page, 'tipo6');
  await triggerHouseAction(page, 'Frontal');
  await page.setViewportSize({width: 667, height: 375});
  await expect(page.getByTestId('house-canvas-loading')).toHaveCount(0);
  await expect(page.getByText('Vista Frontal adicionada!', {exact: true})).toBeHidden();
  await expect.poll(() => selectCanvasObjectByMyTypeByDebug(page, 'house', true)).toBe(true);
  const selection = page.getByLabel('Ações da seleção', {exact: true});
  await expect(selection).toBeVisible();
  const selected = await getActiveCanvasObjectSummaryByDebug(page);
  await screenshot(page, 'o2-selecao');
  for (const action of ['Cancelar', 'Confirmar']) {
    await selection.getByRole('button', {name: 'Editar', exact: true}).tap();
    const terrain = page.getByRole('dialog', {name: 'Editar Terreno', exact: true});
    await expect(terrain).toBeVisible();
    await screenshot(page, `o2-terreno-${action.toLowerCase()}`);
    await expect(selection).toHaveCount(0);
    await expectInsideViewport(terrain);
    const close = terrain.getByRole('button', {name: action, exact: true});
    await close.scrollIntoViewIfNeeded();
    await close.tap();
    await expect(terrain).toHaveCount(0);
    await expect(selection).toBeVisible();
    expect(await getActiveCanvasObjectSummaryByDebug(page)).toEqual(selected);
  }
  await screenshot(page, 'o2-selecao-restaurada');
});
