import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';

test.describe('RAC responsive toolbar', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await page.setViewportSize({width: 420, height: 844});
    await setupRacEditorPage(page, {leaveMobileToolbarCollapsed: true});
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('mobile: 3D e PDF ficam no menu do usuário', async ({page}) => {
    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toHaveCount(0);

    await page.getByRole('button', {name: 'Abrir menu da conta'}).click();

    await expect(page.getByRole('button', {name: 'Visualização 3D'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();
  });

  test('mobile: menu de zoom mostra apenas ícones das opções', async ({page}) => {
    const zoomButton = page.getByRole('button', {name: /Zoom atual/});

    await expect(zoomButton).toContainText(/^\d+%$/);
    await expect(zoomButton.locator('svg[data-icon="magnifying-glass"]')).toHaveCount(0);

    await zoomButton.click();

    await expect(page.getByRole('button', {name: 'Seleção'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Panning'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Fit to View'})).toBeVisible();
    await expect(page.getByText('Seleção')).toHaveCount(0);
    await expect(page.getByText('Panning')).toHaveCount(0);
    await expect(page.getByText('Fit to View')).toHaveCount(0);

    const zoomDialog = page.getByRole('dialog');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Seleção'}).textContent())
      .toBe('');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Panning'}).textContent())
      .toBe('');
    await expect
      .poll(async () => await zoomDialog.getByRole('button', {name: 'Fit to View'}).textContent())
      .toBe('');
  });

  test('o seletor de construções mantém sua largura integral em 420 px', async ({page}) => {
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    const menuBox = await page.getByRole('dialog').boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox?.width).toBe(232);
  });

  test('o submenu de zoom permanece centrado no botão com viewport abaixo da largura mínima', async ({page}) => {
    await page.setViewportSize({width: 252, height: 844});
    const zoomButton = page.getByRole('button', {name: /Zoom atual/});
    await zoomButton.click();

    const zoomDialog = page.getByRole('dialog').filter({has: page.getByRole('button', {name: 'Seleção'})});
    const triggerBox = await zoomButton.boundingBox();
    const menuBox = await zoomDialog.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    if (!triggerBox || !menuBox) return;
    expect(Math.abs((triggerBox.x + triggerBox.width / 2) - (menuBox.x + menuBox.width / 2))).toBeLessThan(2);
  });

  test('abaixo de 640 px, as duas barras iniciam recolhidas e podem ser abertas', async ({page}) => {
    const rail = page.getByRole('toolbar', {name: 'Barra de ferramentas principal'});
    const difficulty = page.getByRole('group', {name: 'Fatores da dificuldade da casa'});
    await expect(rail).toHaveCount(0);
    await expect(difficulty).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Abrir menu lateral'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Abrir painel de dificuldade'})).toBeVisible();

    await page.getByRole('button', {name: 'Abrir menu lateral'}).click();
    await page.getByRole('button', {name: 'Abrir painel de dificuldade'}).click();
    await expect(rail).toBeVisible();
    await expect(difficulty).toBeVisible();

    const closeHandle = page.getByRole('button', {name: 'Recolher menu lateral'});

    const closeBox = await closeHandle.boundingBox();
    const railBox = await rail.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    if (!closeBox) throw new Error('Alça de recolhimento não disponível.');
    if (!railBox) throw new Error('Menu lateral não disponível.');
    expect(closeBox.x).toBeGreaterThan(railBox.x + railBox.width - 4);

    await page.mouse.move(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(closeBox.x - 40, closeBox.y + closeBox.height / 2);
    await page.mouse.up();

    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toHaveCount(0);

    const openHandle = page.getByRole('button', {name: 'Abrir menu lateral'});
    const openBox = await openHandle.boundingBox();
    expect(openBox).not.toBeNull();
    if (!openBox) throw new Error('Alça de abertura não disponível.');

    await page.mouse.move(openBox.x + openBox.width / 2, openBox.y + openBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(openBox.x + 50, openBox.y + openBox.height / 2);
    await page.mouse.up();

    await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
  });

  test('de 640 a 766 px, as duas barras iniciam abertas com alças; em 767 px as alças somem', async ({page}) => {
    for (const width of [640, 766]) {
      await page.setViewportSize({width, height: 844});
      await page.reload({waitUntil: 'domcontentloaded'});
      await expect(page.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
      await expect(page.getByRole('group', {name: 'Fatores da dificuldade da casa'})).toBeVisible();
      await expect(page.getByRole('button', {name: 'Recolher menu lateral'})).toBeVisible();
      await expect(page.getByRole('button', {name: 'Recolher painel de dificuldade'})).toBeVisible();
    }

    await page.setViewportSize({width: 767, height: 844});
    await page.reload({waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('button', {name: 'Recolher menu lateral'})).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Recolher painel de dificuldade'})).toHaveCount(0);
  });
});
