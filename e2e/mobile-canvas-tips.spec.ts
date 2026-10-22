import {expect, test} from '@playwright/test';
import {
  createHouse, setupRacEditorPage, showCanvasTopBar,
  startConsoleErrorCapture, expectNoConsoleErrors,
} from './helpers/rac-editor.helpers';

test.describe('Dicas temporárias do Canvas mobile', () => {
  test.use({hasTouch: true});

  for (const viewport of [{width: 736, height: 375}, {width: 960, height: 466}]) {
    test(`usa Info temporário e respeita o controle Dicas em ${viewport.width}×${viewport.height}`, async ({page}) => {
      startConsoleErrorCapture(page);
      await setupRacEditorPage(page);
      await createHouse(page, 'tipo6');
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, {timeout: 8_000});
      await page.setViewportSize(viewport);
      await expect(page.getByTestId('rac-radial-tools')).toBeVisible();
      await showCanvasTopBar(page);
      await page.getByRole('button', {name: 'Abrir menu da conta', exact: true}).click();
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      const hint = page.locator('[data-sonner-toast][data-type="info"]').filter({hasText: 'Dica'});
      await expect(hint).toHaveCount(1);
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('Casa:');
      await expect(page.locator('.bg-secondary\\/80')).toHaveCount(0);
      await expect.poll(() => hint.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.y >= 0 && rect.bottom <= innerHeight && getComputedStyle(el).opacity === '1';
      })).toBe(true);
      const box = (await hint.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({path: `outputs/dicas-mobile-toast-20261021/info-${viewport.width}x${viewport.height}.png`});
      await expect(hint).toHaveCount(0, {timeout: 8_000});
      // A seleção continua ativa, sem reapresentar o mesmo aviso em cada render.
      await expect(page.getByRole('button', {name: 'Editar', exact: true})).toBeVisible();
      await showCanvasTopBar(page);
      const menu = page.getByRole('button', {name: 'Abrir menu da conta', exact: true});
      if (await menu.getAttribute('aria-expanded') !== 'true') await menu.click();
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      await expect(hint).toHaveCount(0);
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      await expect(hint).toHaveCount(1);
      await hint.locator('[data-close-button]').tap();
      await expect(hint).toHaveCount(0, {timeout: 1_500});
      await showCanvasTopBar(page);
      if (await menu.getAttribute('aria-expanded') !== 'true') await menu.click();
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      await expect(hint).toHaveCount(1);
      await page.getByRole('button', {name: 'Dicas', exact: true}).click();
      await expect(hint).toHaveCount(0);
      expectNoConsoleErrors(page);
    });
  }
});
