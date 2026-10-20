import {expect, test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  createHouse, ensureOverflowMenuOpen, expectCanvasObjectsPersisted,
  setupRacEditorPage, startConsoleErrorCapture, expectNoConsoleErrors,
  showCanvasTopBar, getCanvasPosition,
} from './helpers/rac-editor.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

const evidence = resolve('outputs/minimapa-pan-mobile-20261020');
test.use({isMobile: true, hasTouch: true});

for (const enabled of [false, true]) {
  test(`minimapa mobile respeita a preferência ${enabled ? 'habilitada' : 'desabilitada'} após panning`, async ({page}) => {
    startConsoleErrorCapture(page);
    await page.setViewportSize({width: 1280, height: 900});
    await setupRacEditorPage(page);
    await createHouse(page, 'tipo6');
    await expectCanvasObjectsPersisted(page, ['house']);
    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Configurações', exact: true}).click();
    await page.getByLabel('Habilitar mini-mapa no canvas').setChecked(enabled);
    await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
    await page.keyboard.press('Escape');
    await page.setViewportSize({width: 844, height: 390});
    await showCanvasTopBar(page);
    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /^Panning/}).click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('rac-canvas-container')).toHaveCSS('cursor', 'grab');
    for (let i = 0; i < 20 && (await getCanvasPosition(page))!.zoom < 1.2; i++) {
      await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {ctrlKey: true, deltaY: -100});
    }
    await expect.poll(async () => (await getCanvasPosition(page))!.zoom).toBeGreaterThan(1.1);

    const minimap = page.locator('[data-testid="rac-minimap"]:visible');
    const before = (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas;
    const preference = () => page.evaluate(() => JSON.parse(localStorage.getItem('rac-settings') ?? '{}').zoomEnabledByDefault);
    await expect.poll(preference).toBe(enabled);
    await expect(minimap).toHaveCount(enabled ? 1 : 0);
    mkdirSync(evidence, {recursive: true});
    const label = enabled ? 'habilitado' : 'temporario';
    await page.screenshot({path: resolve(evidence, `${label}-antes.png`)});
    const session = await page.context().newCDPSession(page);
    let touching = false;
    try {
      await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 500, y: 180, id: 1}]});
      touching = true;
      await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 430, y: 140, id: 1}]});
      await expect(minimap).toHaveCount(1);
      await page.screenshot({path: resolve(evidence, `${label}-durante.png`)});
      await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
      touching = false;
      await expect(minimap).toHaveCount(enabled ? 1 : 0);
      await page.screenshot({path: resolve(evidence, `${label}-depois.png`)});

      await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 500, y: 180, id: 1}, {x: 600, y: 180, id: 2}]});
      touching = true;
      await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 430, y: 140, id: 1}, {x: 530, y: 140, id: 2}]});
      await expect(minimap).toHaveCount(1);
      await session.send('Input.dispatchTouchEvent', {type: 'touchCancel', touchPoints: []});
      touching = false;
      await expect(minimap).toHaveCount(enabled ? 1 : 0);
    } finally {
      if (touching) await session.send('Input.dispatchTouchEvent', {type: 'touchCancel', touchPoints: []});
      await session.detach();
    }
    expect(await preference()).toBe(enabled);
    expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].drawingDocument.canvas).toEqual(before);
    expectNoConsoleErrors(page);
  });
}
