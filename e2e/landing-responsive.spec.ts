import {expect, test} from '@playwright/test';

const landingPath = '/?landing=preview';

test.describe('Landing pré-login responsiva', () => {
  test('mantém screenshot, cards e casa em fluxo vertical em desktop baixo', async ({page}) => {
    await page.setViewportSize({width: 1280, height: 500});
    await page.goto(landingPath);

    const login = page.locator('.rac-login');
    const screenshot = page.locator('.rac-login__editor-wrap');
    const callouts = page.locator('.rac-login__callouts');
    const house = page.locator('.rac-login__house');

    await expect(screenshot).toBeVisible();
    await expect(callouts).toBeVisible();
    await expect(house).toBeVisible();

    const layout = await page.evaluate(() => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      const screenshot = document.querySelector<HTMLElement>('.rac-login__editor-wrap');
      const callouts = document.querySelector<HTMLElement>('.rac-login__callouts');
      const house = document.querySelector<HTMLElement>('.rac-login__house');
      if (!login || !screenshot || !callouts || !house) throw new Error('Landing incompleta.');

      const screenshotBox = screenshot.getBoundingClientRect();
      const calloutsBox = callouts.getBoundingClientRect();
      const houseBox = house.getBoundingClientRect();
      return {
        overflowX: login.scrollWidth > login.clientWidth,
        canScrollVertically: login.scrollHeight > login.clientHeight,
        calloutsBelowScreenshot: calloutsBox.top >= screenshotBox.bottom - 1,
        houseHasArea: houseBox.width > 0 && houseBox.height > 0,
      };
    });

    expect(layout).toEqual({
      overflowX: false,
      canScrollVertically: true,
      calloutsBelowScreenshot: true,
      houseHasArea: true,
    });

    await house.scrollIntoViewIfNeeded();
    await expect(house).toBeInViewport();
  });

  test('mantém os cards abaixo do screenshot acima do breakpoint compacto', async ({page}) => {
    await page.setViewportSize({width: 1000, height: 800});
    await page.goto(landingPath);
    await page.waitForTimeout(750);

    const layout = await page.evaluate(() => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      const copy = document.querySelector<HTMLElement>('.rac-login__copy');
      const screenshot = document.querySelector<HTMLElement>('.rac-login__editor-wrap');
      const visual = document.querySelector<HTMLElement>('.rac-login__visual');
      const callouts = document.querySelector<HTMLElement>('.rac-login__callouts');
      if (!login || !copy || !screenshot || !visual || !callouts) throw new Error('Landing incompleta.');

      const copyBox = copy.getBoundingClientRect();
      const screenshotBox = screenshot.getBoundingClientRect();
      const visualBox = visual.getBoundingClientRect();
      const calloutsBox = callouts.getBoundingClientRect();
      const cardHeights = Array.from(callouts.children).map((card) => card.getBoundingClientRect().height);
      return {
        overflowX: login.scrollWidth > login.clientWidth,
        calloutsBelowScreenshot: calloutsBox.top >= screenshotBox.bottom - 1,
        loginTopAlignedWithVisual: Math.abs(copyBox.top - visualBox.top) < 1,
        loginBottomAlignedWithCards: Math.abs(copyBox.bottom - calloutsBox.bottom) < 1,
        cardsSameHeight: Math.max(...cardHeights) - Math.min(...cardHeights) < 1,
      };
    });

    expect(layout).toEqual({
      overflowX: false,
      calloutsBelowScreenshot: true,
      loginTopAlignedWithVisual: true,
      loginBottomAlignedWithCards: true,
      cardsSameHeight: true,
    });
  });

  test('mantém o fluxo mobile rolável sem overflow horizontal', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(landingPath);
    await page.waitForTimeout(750);

    const layout = await page.evaluate(() => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      const screenshot = document.querySelector<HTMLElement>('.rac-login__editor-wrap');
      const house = document.querySelector<HTMLElement>('.rac-login__house');
      if (!login || !screenshot || !house) throw new Error('Landing incompleta.');

      const screenshotBox = screenshot.getBoundingClientRect();
      const houseBox = house.getBoundingClientRect();
      return {
        overflowX: login.scrollWidth > login.clientWidth,
        canScrollVertically: login.scrollHeight > login.clientHeight,
        screenshotHasArea: screenshotBox.width > 0 && screenshotBox.height > 0,
        houseHasArea: houseBox.width > 0 && houseBox.height > 0,
      };
    });

    expect(layout).toEqual({
      overflowX: false,
      canScrollVertically: true,
      screenshotHasArea: true,
      houseHasArea: true,
    });
  });
});
