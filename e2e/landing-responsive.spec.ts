import {expect, test} from '@playwright/test';

const landingPath = '/?landing=preview';
const sectionSelectors = [
  '.rac-login__identity',
  '.rac-login__copy',
  '.rac-login__visual',
  '.rac-login__impact',
  '.rac-login__house-stage',
  '.rac-login__benefits',
];

test.describe('Landing pré-login responsiva', () => {
  test('mantém seis seções verticais centralizadas em viewport ampla', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(landingPath);
    await page.waitForTimeout(750);

    const layout = await page.evaluate((selectors) => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      const shell = document.querySelector<HTMLElement>('.rac-login__shell');
      const sections = selectors.map((selector) => document.querySelector<HTMLElement>(selector));
      const screenshot = document.querySelector<HTMLElement>('.rac-login__editor-wrap');
      const callouts = document.querySelector<HTMLElement>('.rac-login__callouts');
      const house = document.querySelector<HTMLElement>('.rac-login__house');
      if (!login || !shell || sections.some((section) => !section) || !screenshot || !callouts || !house) {
        throw new Error('Landing incompleta.');
      }

      const boxes = sections.map((section) => section!.getBoundingClientRect());
      const shellBox = shell.getBoundingClientRect();
      const screenshotBox = screenshot.getBoundingClientRect();
      const calloutsBox = callouts.getBoundingClientRect();
      const houseBox = house.getBoundingClientRect();
      const calloutCards = Array.from(callouts.children).map((card) => card.getBoundingClientRect().height);

      return {
        sectionCount: sections.length,
        sectionsAreVertical: boxes.every((box, index) => index === 0 || box.top >= boxes[index - 1].bottom - 1),
        shellIsCentered: Math.abs(shellBox.left - (login.clientWidth - shellBox.width) / 2) < 1,
        shellFits850: shellBox.width <= 850.5,
        overflowX: login.scrollWidth > login.clientWidth,
        overflowYMode: getComputedStyle(login).overflowY,
        calloutsBelowScreenshot: calloutsBox.top >= screenshotBox.bottom - 1,
        cardsSameHeight: Math.max(...calloutCards) - Math.min(...calloutCards) < 1,
        houseHasArea: houseBox.width > 0 && houseBox.height > 0,
      };
    }, sectionSelectors);

    expect(layout).toEqual({
      sectionCount: 6,
      sectionsAreVertical: true,
      shellIsCentered: true,
      shellFits850: true,
      overflowX: false,
      overflowYMode: 'auto',
      calloutsBelowScreenshot: true,
      cardsSameHeight: true,
      houseHasArea: true,
    });
  });

  test('ativa rolagem somente quando o conteúdo excede a viewport', async ({page}) => {
    await page.setViewportSize({width: 1280, height: 520});
    await page.goto(landingPath);
    await page.waitForTimeout(750);

    const shortViewport = await page.evaluate(() => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      if (!login) throw new Error('Landing incompleta.');
      return {
        overflowX: login.scrollWidth > login.clientWidth,
        canScrollVertically: login.scrollHeight > login.clientHeight,
        overflowYMode: getComputedStyle(login).overflowY,
      };
    });

    expect(shortViewport).toEqual({
      overflowX: false,
      canScrollVertically: true,
      overflowYMode: 'auto',
    });

    await page.setViewportSize({width: 1280, height: 2600});
    await page.reload();
    await page.waitForTimeout(750);

    const tallViewport = await page.evaluate(() => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      if (!login) throw new Error('Landing incompleta.');
      return {
        overflowX: login.scrollWidth > login.clientWidth,
        canScrollVertically: login.scrollHeight > login.clientHeight,
        overflowYMode: getComputedStyle(login).overflowY,
      };
    });

    expect(tallViewport).toEqual({
      overflowX: false,
      canScrollVertically: false,
      overflowYMode: 'auto',
    });
  });

  test('mantém o fluxo mobile sem overflow horizontal', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(landingPath);
    await page.waitForTimeout(750);

    const layout = await page.evaluate((selectors) => {
      const login = document.querySelector<HTMLElement>('.rac-login');
      const sections = selectors.map((selector) => document.querySelector<HTMLElement>(selector));
      const screenshot = document.querySelector<HTMLElement>('.rac-login__editor-wrap');
      const house = document.querySelector<HTMLElement>('.rac-login__house');
      if (!login || sections.some((section) => !section) || !screenshot || !house) {
        throw new Error('Landing incompleta.');
      }

      const boxes = sections.map((section) => section!.getBoundingClientRect());
      const screenshotBox = screenshot.getBoundingClientRect();
      const houseBox = house.getBoundingClientRect();
      return {
        sectionsAreVertical: boxes.every((box, index) => index === 0 || box.top >= boxes[index - 1].bottom - 1),
        overflowX: login.scrollWidth > login.clientWidth,
        canScrollVertically: login.scrollHeight > login.clientHeight,
        screenshotHasArea: screenshotBox.width > 0 && screenshotBox.height > 0,
        houseHasArea: houseBox.width > 0 && houseBox.height > 0,
      };
    }, sectionSelectors);

    expect(layout).toEqual({
      sectionsAreVertical: true,
      overflowX: false,
      canScrollVertically: true,
      screenshotHasArea: true,
      houseHasArea: true,
    });
  });
});
