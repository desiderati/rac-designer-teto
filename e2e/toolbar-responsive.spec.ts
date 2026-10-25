import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  showCanvasTopBar,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.describe('RAC responsive toolbar', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await page.setViewportSize({width: 700, height: 420});
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
    await showCanvasTopBar(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('mobile: 3D e PDF ficam no menu do usuário', async ({page}) => {
    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toBeHidden();
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeHidden();
    await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();
  });

  test('mobile: menu de zoom mostra apenas ícones das opções', async ({page}) => {
    const zoomButton = page.getByRole('button', {name: /Zoom atual/});
    await expect(zoomButton).toContainText(/^\d+%$/);
    await expect(zoomButton.locator('svg[data-icon="magnifying-glass"]')).toHaveCount(0);
    await zoomButton.click();
    for (const name of ['Seleção', 'Panning', 'Fit to View']) {
      const option = page.getByRole('button', {name, exact: true});
      await expect(option).toBeVisible();
      await expect(option).toHaveText('');
    }
  });

  test('o seletor de construções mantém largura e âncora em paisagem', async ({page}) => {
    for (const width of [700, 480]) {
      await page.setViewportSize({width, height: 320});
      await showCanvasTopBar(page);
      const trigger = page.getByRole('button', {name: 'Abrir menu principal'});
      await trigger.click();
      const menu = page.getByRole('dialog');
      await expect(menu).toHaveCSS('width', '264px');
      await expect.poll(async () => {
        const [menuBox, triggerBox] = await Promise.all([menu.boundingBox(), trigger.boundingBox()]);
        return menuBox && triggerBox ? Math.abs(menuBox.x - triggerBox.x) : Infinity;
      }).toBeLessThan(2);
      await page.keyboard.press('Escape');
    }
  });

  test('em retrato, pede rotação antes de permitir interação no Canvas', async ({page}) => {
    for (const width of [420, 360]) {
      await page.setViewportSize({width, height: 844});
      await expect(page.getByText('Gire seu celular', {exact: true})).toBeVisible();
      await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toHaveCount(0);
    }
    await page.setViewportSize({width: 700, height: 420});
    await expect(page.getByText('Gire seu celular', {exact: true})).toBeHidden();
    await showCanvasTopBar(page);
  });

  test('mobile: menus radiais iniciam fechados e abrem pelo próprio centro', async ({page}) => {
    const tools = page.getByTestId('rac-radial-tools');
    const factors = page.getByTestId('house-difficulty-controls');
    const left = tools.getByRole('button', {name: 'Ferramentas do Canvas', exact: true});
    const right = factors.getByRole('button', {name: 'Dificuldade da casa', exact: true});
    await expect(left).toHaveAttribute('aria-expanded', 'false');
    await expect(right).toHaveAttribute('aria-expanded', 'false');
    await left.click();
    await expect(tools.getByRole('button', {name: 'Elementos', exact: true})).toBeVisible();
    await left.click();
    await expect(tools.getByRole('button', {name: 'Elementos', exact: true})).toBeHidden();
    await right.click();
    await expect(factors.getByRole('button', {name: 'Obstáculos', exact: true})).toBeVisible();
    await expect(page.getByTestId('canvas-house-difficulty-gauge')).toHaveCount(0);
    await right.click();
    await expect(factors.getByRole('button', {name: 'Obstáculos', exact: true})).toBeHidden();
  });

  test('recolhe os dois menus por altura ou largura e os restaura quando voltam a caber', async ({page}) => {
    await page.setViewportSize({width: 768, height: 900});
    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
    await expect(page.getByRole('group', {name: 'Fatores da dificuldade da casa'})
      .getByTestId('canvas-house-difficulty-gauge')).toBeVisible();
    await expect(page.getByTestId('rac-radial-tools')).toHaveCount(0);
    await page.setViewportSize({width: 768, height: 600});
    await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
    await expect(page.getByTestId('canvas-house-difficulty-gauge')).toHaveCount(0);
    await page.setViewportSize({width: 767, height: 420});
    await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
    await expect(page.getByTestId('canvas-house-difficulty-gauge')).toHaveCount(0);
    await page.setViewportSize({width: 768, height: 900});
    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
    await expect(page.getByRole('group', {name: 'Fatores da dificuldade da casa'})
      .getByTestId('canvas-house-difficulty-gauge')).toBeVisible();
  });
});
