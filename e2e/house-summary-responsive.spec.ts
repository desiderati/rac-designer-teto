import {expect, test} from '@playwright/test';
import {resolve} from 'node:path';

const fixturePath = `/@fs${resolve('e2e/fixtures/v002-review.html')}`;
const scenarios = [
  {width: 1280, height: 900, touch: false, shell: 'dialog'},
  {width: 768, height: 900, touch: false, shell: 'dialog'},
  {width: 767, height: 900, touch: false, shell: 'drawer'},
  {width: 390, height: 844, touch: true, shell: 'drawer'},
  {width: 360, height: 640, touch: true, shell: 'drawer'},
  {width: 740, height: 360, touch: true, shell: 'drawer'},
  {width: 915, height: 393, touch: true, shell: 'drawer'},
  {width: 1024, height: 600, touch: true, shell: 'drawer'},
  {width: 915, height: 393, touch: false, shell: 'dialog'},
];

for (const {width, height, touch, shell} of scenarios) {
  test.describe(`resumo ${width}×${height}, toque=${touch}`, () => {
    test.use({viewport: {width, height}, hasTouch: touch});
    test('preserva conteúdo, limita a rolagem e devolve foco após fechar', async ({page}) => {
      await page.goto(fixturePath);
      await page.getByRole('button', {name: 'Resumo', exact: true}).click();
      const trigger = page.getByRole('button', {name: 'Resumo da Casa de Validação V-002', exact: true});
      await trigger.focus();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.keyboard.press('Enter');
      const summary = page.getByRole('dialog', {name: 'Resumo da Casa', exact: true});
      await expect(summary).toHaveAttribute('data-rac-modal-shell', shell);
      await summary.evaluate(async element => {
        await Promise.all(element.getAnimations().map(animation => animation.finished));
      });
      const close = summary.getByRole('button', {name: 'Fechar resumo da casa'});
      await expect(close).toBeFocused();
      await expect.poll(async () => summary.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1;
      })).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const geometry = await summary.evaluate(element => {
        const body = element.querySelector('[data-rac-modal-region="content"]')!;
        const close = element.querySelector('button')!.getBoundingClientRect();
        return {width: element.clientWidth, scrollWidth: element.scrollWidth,
          bodyWidth: body.clientWidth, bodyScrollWidth: body.scrollWidth,
          bodyHeight: body.clientHeight, bodyScrollHeight: body.scrollHeight,
          closeWidth: close.width, closeHeight: close.height};
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
      expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.bodyWidth);
      expect(geometry.closeWidth).toBeGreaterThanOrEqual(44);
      expect(geometry.closeHeight).toBeGreaterThanOrEqual(44);
      if (height <= 640) expect(geometry.bodyScrollHeight).toBeGreaterThan(geometry.bodyHeight);
      await expect(summary.getByRole('img')).toHaveAccessibleName(/porta no lado inferior/);
      await expect(summary.getByText('Com Patamar')).toBeVisible();
      const header = summary.getByRole('heading', {name: 'Resumo da Casa'});
      const headerTop = (await header.boundingBox())!.y;
      await summary.getByText('Outros / Justificativas', {exact: true}).scrollIntoViewIfNeeded();
      await expect(close).toBeInViewport();
      expect(Math.abs((await header.boundingBox())!.y - headerTop)).toBeLessThan(1);
      await page.screenshot({path: test.info().outputPath('resumo-rolagem.png'), animations: 'disabled'});
      await close.click();
      await expect(summary).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(summary).toBeVisible();
      await expect(close).toBeFocused();
      await summary.evaluate(async element => {
        await Promise.all(element.getAnimations().map(animation => animation.finished));
      });
      await page.keyboard.press('Escape');
      await expect(summary).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  });
}

test('preserva o resumo aberto ao alternar entre modal e drawer', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await page.goto(fixturePath);
  await page.getByRole('button', {name: 'Resumo', exact: true}).click();
  await page.getByRole('button', {name: 'Resumo da Casa de Validação V-002', exact: true}).click();
  const summary = page.getByRole('dialog', {name: 'Resumo da Casa', exact: true});
  for (const viewport of [{width: 390, height: 844}, {width: 1280, height: 900}]) {
    await page.setViewportSize(viewport);
    await expect(summary).toHaveAttribute('data-rac-modal-shell', viewport.width === 390 ? 'drawer' : 'dialog');
    await expect(summary.getByRole('button', {name: 'Fechar resumo da casa'})).toBeFocused();
    await expect(summary.getByText('Manta Asfáltica', {exact: true})).toBeVisible();
  }
});
