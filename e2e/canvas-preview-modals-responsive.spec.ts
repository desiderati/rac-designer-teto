import {expect, test, type Locator, type Page} from '@playwright/test';
import {createHouse, setupRacEditorPage, ensureOverflowMenuOpen, showCanvasTopBar, startConsoleErrorCapture, expectNoConsoleErrors} from './helpers/rac-editor.helpers';
import {expectBoundsWithinViewport, expectContained} from './helpers/geometry.helpers';

const viewports = [
  {width: 736, height: 375},
  {width: 960, height: 466},
  {width: 1280, height: 800},
];

async function dismissNotifications(page: Page) {
  const notifications = page.locator('[data-sonner-toast]');
  while (await notifications.count()) {
    const count = await notifications.count();
    await notifications.first().locator('[data-close-button]').click();
    await expect.poll(() => notifications.count()).toBeLessThan(count);
  }
}

async function expectModalWithinViewport(page: Page, modal: Locator) {
  const bounds = await modal.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expectBoundsWithinViewport(bounds!, viewport);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
}

async function expectHalfWidthOnMobileLandscape(page: Page, modal: Locator) {
  const viewport = page.viewportSize()!;
  if (viewport.height > 600) return;
  await expect.poll(async () => (await modal.boundingBox())!.width).toBeCloseTo(viewport.width / 2, 0);
  const bounds = (await modal.boundingBox())!;
  expect(bounds.x).toBeCloseTo(viewport.width / 4, 0);
}

test.describe('Modais de prévia do Canvas', () => {
  test.use({hasTouch: true, viewport: viewports[0]});
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await page.setViewportSize(viewports[2]);
    await setupRacEditorPage(page);
    await createHouse(page, 'tipo6');
    await dismissNotifications(page);
    await page.setViewportSize(viewports[0]);
  });
  test.afterEach(({page}) => expectNoConsoleErrors(page));

  test('PDF mantém página, zoom, navegação e download dentro da modal em cada orientação', async ({page}) => {
    await showCanvasTopBar(page);
    await page.getByRole('button', {name: 'Abrir menu da conta', exact: true}).click();
    await page.getByRole('button', {name: 'Exportar RAC em PDF', exact: true}).click();
    await page.getByRole('button', {name: 'Gerar PDF', exact: true}).click();
    const modal = page.getByRole('dialog', {name: 'Prévia da RAC em PDF', exact: true});
    const surface = page.getByTestId('pdf-preview-surface');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('pdf-preview-loading')).toHaveCount(0);
    const completedToast = page.locator('[data-sonner-toast]').filter({hasText: 'Geração do PDF'});
    await expect(completedToast.locator('[data-close-button]')).toBeEnabled();
    const hitTest = await completedToast.locator('[data-close-button]').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
        ancestry: [el, el.parentElement!, el.closest('[data-sonner-toaster]')!].map(node => ({
          tag: node.tagName, pointerEvents: getComputedStyle(node).pointerEvents, zIndex: getComputedStyle(node).zIndex,
        })),
        receivesPointer: el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)),
      };
    });
    expect(hitTest.bodyPointerEvents).toBe('none');
    expect(hitTest.ancestry[0].pointerEvents).toBe('auto');
    expect(hitTest.receivesPointer).toBe(true);
    await page.screenshot({path: 'outputs/toast-close-20261021/pdf-toast-before-close.png'});
    await completedToast.locator('[data-close-button]').tap({timeout: 2_000});
    await expect(completedToast).toHaveCount(0, {timeout: 1_500});
    await expect(modal).toBeVisible();
    await page.screenshot({path: 'outputs/toast-close-20261021/pdf-toast-after-close.png'});
    for (const input of ['mouse', 'keyboard']) {
      await page.getByRole('button', {name: 'Gerar PDF novamente', exact: true}).click();
      await expect(completedToast).toHaveAttribute('data-type', 'success');
      const closeToast = completedToast.locator('[data-close-button]');
      if (input === 'keyboard') {
        await closeToast.focus();
        await expect(closeToast).toBeFocused();
        await closeToast.press('Enter');
      } else await closeToast.click();
      await expect(completedToast).toHaveCount(0, {timeout: 1_500});
      await expect(modal).toBeVisible();
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    }

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect(page.getByRole('button', {name: 'Ajustar à página', exact: true})).toBeVisible();
      await page.getByRole('button', {name: 'Ajustar à página', exact: true}).click();
      await expect(page.getByTestId('pdf-preview-loading')).toHaveCount(0);
      await expectModalWithinViewport(page, modal);
      await expectHalfWidthOnMobileLandscape(page, modal);
      await expectContained(page.getByTestId('pdf-preview-canvas-1'), surface);
      for (const name of ['Fechar prévia do PDF', 'Baixar PDF', 'Próxima página da prévia']) {
        await expectContained(page.getByRole('button', {name, exact: true}), modal);
      }
      await page.screenshot({path: `outputs/pdf-preview-mobile-20261021/pdf-${viewport.width}x${viewport.height}.png`});
    }

    await page.setViewportSize(viewports[0]);
    await page.getByRole('button', {name: 'Ajustar à página', exact: true}).click();
    const initialZoom = Number(await surface.getAttribute('data-zoom'));
    expect(initialZoom).toBeLessThan(40);
    await page.getByRole('button', {name: 'Aumentar zoom da prévia', exact: true}).click();
    await page.getByRole('button', {name: 'Aumentar zoom da prévia', exact: true}).click();
    await expect(page.getByTestId('pdf-preview-loading')).toHaveCount(0);
    await expect.poll(() => surface.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await expectModalWithinViewport(page, modal);
    const manualZoom = await surface.getAttribute('data-zoom');
    await page.getByRole('button', {name: 'Minimizar barra de ferramentas do PDF', exact: true}).click();
    await page.getByRole('button', {name: 'Restaurar barra de ferramentas do PDF', exact: true}).click();
    await expect(surface).toHaveAttribute('data-zoom', manualZoom!);
    await page.getByRole('button', {name: 'Próxima página da prévia', exact: true}).click();
    await expect(page.getByTestId('pdf-preview-canvas-2')).toBeVisible();
    await page.getByRole('button', {name: 'Fechar prévia do PDF', exact: true}).click();
    await expect(modal).toBeHidden();
  });

  test('3D contém a cena e todos os controles ao girar a tela e expandir o visualizador', async ({page}) => {
    await showCanvasTopBar(page);
    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Visualização 3D', exact: true}).click();
    const modal = page.getByRole('dialog', {name: 'Visualizador 3D', exact: true});
    const scene = page.getByTestId('house-3d-viewport');
    await expect(page.getByRole('button', {name: 'Enquadrar casa', exact: true})).toBeEnabled();
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expectModalWithinViewport(page, modal);
      await expectHalfWidthOnMobileLandscape(page, modal);
      await expectContained(scene, modal);
      await expect.poll(() => scene.locator('canvas').evaluate(el => {
        const parent = el.closest('[data-testid="house-3d-viewport"]')!;
        return Math.abs(el.getBoundingClientRect().height - parent.getBoundingClientRect().height) <= 1;
      })).toBe(true);
      await expectContained(scene.locator('canvas'), scene);
      for (const button of await modal.getByRole('button').all()) await expectContained(button, modal);
      await page.screenshot({path: `outputs/pdf-preview-mobile-20261021/3d-${viewport.width}x${viewport.height}.png`});
    }
    await page.setViewportSize(viewports[0]);
    await modal.locator('button[title="Fullscreen"]').click();
    await expect(modal.locator('button[title="Sair do Fullscreen"]')).toBeVisible();
    await expectModalWithinViewport(page, modal);
    await expect.poll(async () => (await modal.boundingBox())!.width).toBeCloseTo(viewports[0].width - 16, 0);
    await expectContained(scene.locator('canvas'), modal);
    await modal.locator('button[title="Sair do Fullscreen"]').click();
    await expectHalfWidthOnMobileLandscape(page, modal);
    await page.setViewportSize({width: 390, height: 844});
    await expect(page.getByRole('heading', {name: 'Gire seu celular', exact: true})).toBeVisible();
    await page.setViewportSize(viewports[0]);
    await expect(modal).toBeVisible();
    await page.getByRole('button', {name: 'Fechar', exact: true}).click();
    await expect(modal).toBeHidden();
  });
});
