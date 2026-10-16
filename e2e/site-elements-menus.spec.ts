import {expect, test, type Locator, type Page} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {
  ensureOverflowMenuOpen,
  getCanvasObjectsSummary,
  selectCanvasObjectByMyTypeByDebug,
  triggerElementsAction,
} from './helpers/rac-editor.helpers';

const variants = ['em cima', 'embaixo', 'à esquerda', 'à direita'];
const directions = ['para cima', 'para baixo', 'para a esquerda', 'para a direita'];

async function chooseDesktopVariant(page: Page, category: string, parent: string, variant: string) {
  if (!await page.getByRole('group', {name: 'Categorias de Elementos'}).isVisible()) {
    await page.getByRole('button', {name: 'Elementos', exact: true}).click();
  }
  const categoryButton = page.getByRole('button', {name: category, exact: true});
  if (await categoryButton.getAttribute('aria-expanded') !== 'true') await categoryButton.click();
  const parentButton = page.getByRole('button', {name: parent, exact: true});
  if (await parentButton.getAttribute('aria-expanded') !== 'true') await parentButton.click();
  await page.getByRole('button', {name: variant, exact: true}).click();
}

async function storedObjects(page: Page) {
  const document = await readConstructionSiteDocument(page);
  return document?.constructionSites[0].houses[0].drawingDocument.canvas.objects ?? [];
}

async function settleAnimations(menu: Locator) {
  await menu.evaluate(async root => {
    await Promise.all(root.getAnimations({subtree: true}).map(animation => animation.finished.catch(() => undefined)));
  });
}

async function expectRadialSpacing(menu: Locator, viewport: {width: number; height: number}) {
  await settleAnimations(menu);
  const boxes = await menu.locator('[data-radial-position] > button').evaluateAll(buttons =>
    buttons.map(button => {
      const {x, y, width, height} = button.getBoundingClientRect();
      return {x, y, width, height};
    }));
  expect(boxes.length).toBeGreaterThan(0);
  for (const [index, box] of boxes.entries()) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    for (const other of boxes.slice(index + 1)) {
      expect(Math.hypot(box.x - other.x, box.y - other.y)).toBeGreaterThanOrEqual(49.9);
    }
  }
}

test.describe('Novos elementos e menus', () => {
  test.beforeEach(async ({page}) => {
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
  });

  test('desktop: insere todas as variantes e restaura os elementos ao recarregar', async ({page}) => {
    await triggerElementsAction(page, 'Casa');
    for (const side of variants) {
      await chooseDesktopVariant(page, 'Edificações', 'Construção', `Construção com porta ${side}`);
    }
    await triggerElementsAction(page, 'Cerca');
    await triggerElementsAction(page, 'Portão');
    for (const direction of directions) {
      await chooseDesktopVariant(page, 'Limites e acessos', 'Entrada no Terreno', `Entrada ${direction}`);
    }
    const expected = {siteHouse: 1, siteBuilding: 4, fence: 1, siteGate: 1, terrainEntry: 4};
    const counts = async () => {
      const objects = await getCanvasObjectsSummary(page);
      return Object.fromEntries(Object.keys(expected).map(kind =>
        [kind, objects.filter(object => object.myType === kind).length]));
    };
    await expect.poll(counts).toEqual(expected);
    await expect.poll(async () => (await storedObjects(page))
      .filter(object => Object.hasOwn(expected, object.kind)).length).toBe(11);
    const persisted = (await storedObjects(page)).filter(object => Object.hasOwn(expected, object.kind));
    expect(persisted.filter(object => object.kind === 'siteBuilding').map(object => object.metadata?.siteElementVariant).sort())
      .toEqual(['bottom', 'left', 'right', 'top']);
    expect(persisted.filter(object => object.kind === 'terrainEntry').map(object => object.metadata?.siteElementVariant).sort())
      .toEqual(['0', '180', '270', '90']);
    const fenceLabel = persisted.find(object => object.kind === 'fence')?.children?.find(child => child.kind === 'siteLabel');
    expect(fenceLabel).toBeDefined();
    expect(fenceLabel?.text ?? '').toBe('');
    expect(fenceLabel?.style?.visible).toBe(false);
    expect(persisted.find(object => object.kind === 'siteGate')?.children?.some(child => child.kind === 'siteLabel')).toBe(false);
    await page.screenshot({path: test.info().outputPath('desktop-elementos.png')});
    await page.reload();
    await expect.poll(counts).toEqual(expected);
  });

  test('desktop: edita os nomes de Casa e Cerca e preserva os textos ao reabrir', async ({page}) => {
    for (const item of [
      {label: 'Casa', kind: 'siteHouse', placeholder: 'Casa', value: 'Casa do vizinho'},
      {label: 'Cerca', kind: 'fence', placeholder: 'Texto opcional', value: 'Divisa lateral'},
    ]) {
      await triggerElementsAction(page, item.label);
      expect(await selectCanvasObjectByMyTypeByDebug(page, item.kind, true, true)).toBe(true);
      await page.getByPlaceholder(item.placeholder, {exact: true}).fill(item.value);
      await page.getByRole('button', {name: 'Confirmar', exact: true}).last().click();
      await expect.poll(async () => (await storedObjects(page)).find(object => object.kind === item.kind)
        ?.children?.find(child => child.kind === 'siteLabel')?.text).toBe(item.value);
    }
    await page.reload();
    await expect.poll(async () => (await getCanvasObjectsSummary(page)).some(object => object.myType === 'siteHouse')).toBe(true);
    expect(await selectCanvasObjectByMyTypeByDebug(page, 'siteHouse', true, true)).toBe(true);
    await expect(page.getByPlaceholder('Casa', {exact: true})).toHaveValue('Casa do vizinho');
  });

  test('desktop: rótulos começam ligados, Cancelar descarta e Confirmar persiste a desativação', async ({page}) => {
    const tools = page.getByRole('toolbar', {name: 'Barra de ferramentas principal'});
    await expect(tools.getByRole('button', {name: 'Elementos', exact: true}).locator('span')).toHaveText('Elementos');
    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Configurações', exact: true}).click();
    const toggle = page.getByRole('switch', {name: 'Mostrar rótulos nos menus (desktop)'});
    await expect(toggle).toBeChecked();
    await toggle.click();
    await page.getByRole('button', {name: 'Cancelar', exact: true}).click();
    await expect(tools.getByRole('button', {name: 'Elementos', exact: true}).locator('span')).toHaveText('Elementos');
    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Configurações', exact: true}).click();
    await expect(toggle).toBeChecked();
    await toggle.click();
    await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
    await expect(tools.getByRole('button', {name: 'Elementos', exact: true}).locator('span')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rac-settings')!).showToolMenuLabels)).toBe(false);
    // Nova aba não recebe o initScript da página original que redefine os defaults do fixture.
    const reopened = await page.context().newPage();
    await reopened.goto('/');
    await expect(reopened.getByRole('button', {name: 'Elementos', exact: true})).toBeVisible();
    await expect(reopened.getByRole('button', {name: 'Elementos', exact: true}).locator('span')).toHaveCount(0);
    await reopened.close();
  });

  test('desktop: seleciona solo e mantém Obstáculos marcado enquanto algum fator estiver ativo', async ({page}) => {
    await page.getByRole('button', {name: /Editar perfil do solo/}).click();
    await settleAnimations(page.getByRole('menu'));
    const soilWidth = (await page.getByRole('menu').boundingBox())!.width;
    await page.getByRole('menuitem', {name: 'Selecionar solo Terreno Estável / Argiloso', exact: true}).click();
    await expect(page.getByRole('button', {name: /Editar perfil do solo/})).toHaveAccessibleName(/Terreno Estável \/ Argiloso/);
    const obstacleId = await page.getByRole('button', {name: 'Obstáculos', exact: true}).getAttribute('id');
    const obstacles = page.locator(`button[id="${obstacleId}"]`);
    await expect(obstacles).toHaveAttribute('aria-pressed', 'false');
    await obstacles.click();
    const menu = page.getByRole('menu', {name: 'Obstáculos', exact: true});
    await settleAnimations(menu);
    expect((await menu.boundingBox())!.width).toBeCloseTo(soilWidth);
    const options = ['Obstáculos hidráulicos', 'Obstáculos subterrâneos', 'Obstáculos elevados', 'Servidões vizinhas'];
    for (const name of options) {
      const option = menu.getByRole('menuitemcheckbox', {name, exact: true});
      await option.click();
      await expect(option).toHaveAttribute('aria-checked', 'true');
      await expect(obstacles).toHaveAttribute('aria-pressed', 'true');
    }
    await page.screenshot({path: test.info().outputPath('desktop-obstaculos.png')});
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(obstacles).toHaveAttribute('aria-pressed', 'true');
    await obstacles.click();
    await expect(menu).toBeVisible();
    await settleAnimations(menu);
    for (const [index, name] of options.entries()) {
      await menu.getByRole('menuitemcheckbox', {name, exact: true}).click();
      await expect(obstacles).toHaveAttribute('aria-pressed', index === options.length - 1 ? 'false' : 'true');
    }
  });

  test.describe('mobile com toque', () => {
    test.use({isMobile: true, hasTouch: true});
  for (const viewport of [{width: 740, height: 420}, {width: 480, height: 320}]) {
    test(`mobile ${viewport.width}x${viewport.height}: navega pelo centro, insere variantes e mantém folga`, async ({page}) => {
      await page.setViewportSize(viewport);
      const tools = page.getByTestId('rac-radial-tools');
      await tools.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).tap();
      await expectRadialSpacing(tools, viewport);
      await tools.getByRole('button', {name: 'Elementos', exact: true}).tap();
      await expect(tools.getByRole('button', {name: 'Voltar para Ferramentas do Canvas', exact: true})).toBeVisible();
      await expectRadialSpacing(tools, viewport);
      await tools.getByRole('button', {name: 'Edificações', exact: true}).tap();
      await tools.getByRole('button', {name: 'Construção', exact: true}).tap();
      await expectRadialSpacing(tools, viewport);
      await tools.getByRole('button', {name: 'Construção com porta à esquerda', exact: true}).tap();
      await expect.poll(async () => (await getCanvasObjectsSummary(page)).some(object => object.myType === 'siteBuilding')).toBe(true);
      await tools.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).tap();
      await tools.getByRole('button', {name: 'Elementos', exact: true}).tap();
      await tools.getByRole('button', {name: 'Limites e acessos', exact: true}).tap();
      await tools.getByRole('button', {name: 'Entrada no Terreno', exact: true}).tap();
      await tools.getByRole('button', {name: 'Entrada para baixo', exact: true}).tap();
      await expect.poll(async () => (await getCanvasObjectsSummary(page)).some(object => object.myType === 'terrainEntry')).toBe(true);
      await tools.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).tap();
      await tools.getByRole('button', {name: 'Elementos', exact: true}).tap();
      await tools.getByRole('button', {name: 'Limites e acessos', exact: true}).tap();
      await expectRadialSpacing(tools, viewport);
      await page.screenshot({path: test.info().outputPath(`mobile-limites-${viewport.width}.png`)});
      await page.keyboard.press('Escape');
      await expect(tools.getByRole('button', {name: 'Edificações', exact: true})).toBeVisible();
      const controls = page.getByTestId('house-difficulty-controls');
      await controls.getByRole('button', {name: 'Dificuldade da casa', exact: true}).tap();
      await controls.getByRole('button', {name: 'Obstáculos', exact: true}).tap();
      await expectRadialSpacing(controls, viewport);
      const hydraulic = controls.getByRole('button', {name: 'Obstáculos hidráulicos', exact: true});
      await hydraulic.tap();
      await expect(hydraulic).toHaveAttribute('aria-pressed', 'true');
      const back = controls.getByRole('button', {name: 'Voltar para Dificuldade da casa', exact: true});
      await expect(back).toHaveAttribute('aria-pressed', 'true');
      await back.tap();
      await expect(controls.getByRole('button', {name: 'Obstáculos', exact: true})).toHaveAttribute('aria-pressed', 'true');
      await controls.getByRole('button', {name: 'Tipo de solo', exact: true}).tap();
      await expectRadialSpacing(controls, viewport);
      const soil = controls.getByRole('button', {name: 'Terreno Estável / Argiloso', exact: true});
      await soil.tap();
      await expect(soil).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('canvas-house-difficulty-gauge')).toHaveCount(0);
      await page.screenshot({path: test.info().outputPath(`mobile-solo-${viewport.width}.png`)});
    });
  }
  });
});
