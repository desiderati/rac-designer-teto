import {expect, test, type Locator, type Page} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.use({launchOptions: {ignoreDefaultArgs: ['--hide-scrollbars']}});

test.beforeEach(async ({page}) => {
  await setupSeededRacEditorPage(page, {insertInitialViews: true});
  // Reproduzir barras que ocupam espaço, como na preferência de exibição permanente do sistema.
  await page.addStyleTag({content: '*::-webkit-scrollbar {width: 16px; height: 16px;}'});
});

test('desktop: categorias e variantes mantêm os botões inteiros sem scrollbars nativas', async ({page}) => {
  await page.getByRole('button', {name: 'Elementos', exact: true}).click();
  const categories = page.getByRole('group', {name: 'Categorias de Elementos', exact: true});
  await expectUnclippedMenu(page, categories);
  await expectUnclippedMenu(page, categories, 320);
  await categories.getByRole('button', {name: 'Limites e acessos', exact: true}).click();
  await expectUnclippedMenu(page, page.getByRole('group', {name: 'Elementos de Limites e acessos', exact: true}), 320);
  await page.getByRole('button', {name: 'Entrada no Terreno', exact: true}).click();
  await expectUnclippedMenu(page, page.getByRole('group', {name: 'Direção da entrada', exact: true}), 320);
  await categories.getByRole('button', {name: 'Edificações', exact: true}).click();
  await page.getByRole('button', {name: 'Construção', exact: true}).click();
  await expectUnclippedMenu(page, page.getByRole('group', {name: 'Posição da porta', exact: true}), 320);
  await page.getByTestId('rac-elements-submenu').screenshot({path: test.info().outputPath('elementos-sem-scrollbars.png')});
});

test('desktop: submenu de geometria também mantém os botões inteiros sem barras visuais', async ({page}) => {
  await page.getByRole('button', {name: 'Objetos Geométricos', exact: true}).click();
  await expectUnclippedMenu(page, page.getByTestId('rac-side-rail-submenu'));
});

async function expectUnclippedMenu(page: Page, menu: Locator, availableWidth?: number) {
  await expect(menu).toBeVisible();
  await menu.evaluate(async element => {
    await Promise.all(element.getAnimations({subtree: true}).map(animation => animation.finished.catch(() => undefined)));
  });
  if (availableWidth) {
    // Exercitar espaço reduzido sem trocar o modo desktop nem mudar a escala dos botões.
    await menu.evaluate((element, width) => {
      element.style.setProperty('max-width', `${width}px`, 'important');
      element.style.scrollbarGutter = 'stable';
    }, availableWidth);
  }
  const metrics = await menu.evaluate(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      width: element.clientWidth, height: element.clientHeight, outerHeight: element.getBoundingClientRect().height,
      scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight,
      scrollbarDisplay: getComputedStyle(element, '::-webkit-scrollbar').display,
      scrollbarWidth: style.scrollbarWidth,
      buttons: Array.from(element.querySelectorAll('button')).map(button => {
        const buttonRect = button.getBoundingClientRect();
        return {top: buttonRect.top - rect.top, bottom: buttonRect.bottom - rect.top};
      }),
    };
  });
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height);
  expect(metrics.outerHeight - metrics.height).toBeLessThanOrEqual(2);
  expect(metrics.scrollbarDisplay).toBe('none');
  expect(metrics.scrollbarWidth).toBe('none');
  for (const button of metrics.buttons) {
    expect(button.top).toBeGreaterThanOrEqual(1);
    expect(button.bottom).toBeLessThanOrEqual(metrics.outerHeight - 1);
  }
  if (availableWidth) {
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.width);
    const buttons = menu.getByRole('button');
    await buttons.first().focus();
    for (let index = 1; index < await buttons.count(); index += 1) await page.keyboard.press('Tab');
    await expect(buttons.last()).toBeFocused();
    await menu.hover();
    await page.mouse.wheel(500, 0);
    await expect.poll(() => menu.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    const [menuBox, buttonBox] = await Promise.all([menu.boundingBox(), buttons.last().boundingBox()]);
    expect(buttonBox!.x).toBeGreaterThanOrEqual(menuBox!.x);
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(menuBox!.x + menuBox!.width);
  }
}
