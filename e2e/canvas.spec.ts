import {expect, Page, test} from '@playwright/test';
import {
  closePilotiEditorByDebug,
  createHouse,
  expectNoConsoleErrors,
  getCanvasObjectsSummary,
  getCanvasPosition,
  getHouseSnapshot,
  openPilotiEditorByDebug,
  selectCanvasObjectByMyTypeByDebug,
  setCanvasPositionByDebug,
  setupRacEditorPage,
  startConsoleErrorCapture,
  triggerElementsAction,
} from './helpers/rac-editor.helpers';

type TouchPoint = { clientX: number; clientY: number; identifier?: number };

async function dispatchCanvasTouch(
  page: Page,
  eventType: 'touchstart' | 'touchmove' | 'touchend',
  activePoints: TouchPoint[],
  changedPoints: TouchPoint[] = activePoints
) {
  await page.getByTestId('rac-canvas-container').evaluate(
    (element, {type, active, changed}) => {
      const makeTouch = (point: TouchPoint, index: number) => {
        const touchInit = {
          identifier: point.identifier ?? index,
          target: element,
          clientX: point.clientX,
          clientY: point.clientY,
          screenX: point.clientX,
          screenY: point.clientY,
          pageX: point.clientX,
          pageY: point.clientY,
        };

        return typeof Touch === 'function' ? new Touch(touchInit) : touchInit;
      };

      const touches = active.map(makeTouch) as Touch[];
      const changedTouches = changed.map(makeTouch) as Touch[];

      const makeFallbackEvent = () => {
        const event = new Event(type, {bubbles: true, cancelable: true});
        Object.defineProperty(event, 'touches', {value: touches});
        Object.defineProperty(event, 'targetTouches', {value: touches});
        Object.defineProperty(event, 'changedTouches', {value: changedTouches});
        return event;
      };

      let event: Event;
      try {
        event = new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches,
          targetTouches: touches,
          changedTouches,
        });
      } catch {
        event = makeFallbackEvent();
      }

      element.dispatchEvent(event);
    },
    {type: eventType, active: activePoints, changed: changedPoints}
  );
}

test.describe('RAC canvas interactions', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('canvas: wheel com modificador altera o nivel de zoom', async ({page}) => {
    await createHouse(page, 'tipo6');

    const minimap = page.locator('[data-testid="rac-minimap"]:visible').first();
    await expect(minimap).toBeVisible();

    const initial = await getCanvasPosition(page);
    expect(initial).not.toBeNull();
    if (!initial) throw new Error('Posição do canvas não disponível para teste.');

    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {
      deltaX: 0,
      deltaY: -280,
      ctrlKey: true,
    });

    await expect.poll(async () => (await getCanvasPosition(page))?.zoom ?? 0).toBeGreaterThan(initial.zoom + 0.05);

    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if (!minimapBox) {
      throw new Error('Minimap não disponível para teste.');
    }

    await page.mouse.click(minimapBox.x + minimapBox.width / 2, minimapBox.y + minimapBox.height / 2);
    const snapshotAfterMinimapClick = await getHouseSnapshot(page);
    expect(snapshotAfterMinimapClick).not.toBeNull();
  });

  test('canvas: area de trabalho usa fundo quadriculado e superficie arredondada', async ({page}) => {
    const canvasContainer = page.getByTestId('rac-canvas-container');
    const canvasSurface = page.getByTestId('rac-canvas-surface');

    await expect
      .poll(async () => {
        const backgroundSize = await canvasContainer.evaluate((element) =>
          window.getComputedStyle(element).backgroundSize
        );
        return backgroundSize;
      })
      .toContain('40px 40px');
    await expect
      .poll(async () => {
        const backgroundImage = await canvasContainer.evaluate((element) =>
          window.getComputedStyle(element).backgroundImage
        );
        return backgroundImage.includes('linear-gradient') && backgroundImage.includes('255, 255, 255');
      })
      .toBe(true);
    await expect(canvasContainer).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    await expect
      .poll(async () => {
        const box = await canvasContainer.boundingBox();
        const viewport = page.viewportSize();
        if (!box || !viewport) return false;
        return box.x === 0 && box.y === 0 && box.width === viewport.width && box.height === viewport.height;
      })
      .toBe(true);

    await expect(canvasSurface).toHaveCSS('overflow', 'hidden');
    await expect
      .poll(async () => {
        const radius = await canvasSurface.evaluate((element) =>
          Number.parseFloat(window.getComputedStyle(element).borderTopLeftRadius)
        );
        return radius >= 24;
      })
      .toBe(true);
  });

  test('canvas: pan por wheel e minimap atualizam viewport', async ({page}) => {
    await createHouse(page, 'tipo6');

    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {
      deltaX: 0,
      deltaY: -280,
      ctrlKey: true,
    });
    await expect.poll(async () => (await getCanvasPosition(page))?.zoom ?? 0).toBeGreaterThan(1.05);

    const resetViewport = await setCanvasPositionByDebug(page, 0, 0);
    expect(resetViewport).toBe(true);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? -1).toBe(0);

    const canvasContainer = page.getByTestId('rac-canvas-container');
    await canvasContainer.dispatchEvent('wheel', {deltaX: 0, deltaY: 280});
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);

    const minimap = page.locator('[data-testid="rac-minimap"]:visible').first();
    await expect(minimap).toBeVisible();
    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if (!minimapBox) {
      throw new Error('Minimap não disponível para teste.');
    }

    await setCanvasPositionByDebug(page, 0, 0);
    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? -1).toBe(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? -1).toBe(0);

    await page.mouse.click(minimapBox.x + minimapBox.width - 2, minimapBox.y + minimapBox.height - 2);
    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? 0).toBeGreaterThan(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);
  });

  test('canvas: modo panning permite arrastar com o botão principal no desktop', async ({page}) => {
    await createHouse(page, 'tipo6');

    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /Panning/}).click();

    const resetViewport = await setCanvasPositionByDebug(page, 0, 0);
    expect(resetViewport).toBe(true);

    const canvasContainer = page.getByTestId('rac-canvas-container');
    await expect(canvasContainer).toHaveCSS('cursor', 'grab');
    await expect(page.locator('[data-testid="rac-canvas-surface"] canvas.upper-canvas')).toHaveCSS('cursor', 'grab');

    const canvasBox = await canvasContainer.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (!canvasBox) {
      throw new Error('Canvas não disponível para teste de panning.');
    }

    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await expect(page.locator('[data-testid="rac-canvas-surface"] canvas.upper-canvas')).toHaveCSS('cursor', 'grab');
    await page.mouse.down();
    await expect(canvasContainer).toHaveCSS('cursor', 'grabbing');
    await expect(page.locator('[data-testid="rac-canvas-surface"] canvas.upper-canvas')).toHaveCSS('cursor', 'grabbing');
    await page.mouse.move(canvasBox.x + canvasBox.width / 2 - 160, canvasBox.y + canvasBox.height / 2 - 120, {steps: 5});
    await page.mouse.up();
    await expect(canvasContainer).toHaveCSS('cursor', 'grab');
    await expect(page.locator('[data-testid="rac-canvas-surface"] canvas.upper-canvas')).toHaveCSS('cursor', 'grab');

    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? 0).toBeGreaterThan(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);
  });

  test('canvas: mobile permite panning por toque e zoom por pinch', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await createHouse(page, 'tipo6');

    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /Panning/}).click();

    await page.getByTestId('rac-canvas-container').dispatchEvent('wheel', {
      deltaX: 0,
      deltaY: -280,
      ctrlKey: true,
    });
    await expect.poll(async () => (await getCanvasPosition(page))?.zoom ?? 0).toBeGreaterThan(1.05);

    const resetViewport = await setCanvasPositionByDebug(page, 0, 0);
    expect(resetViewport).toBe(true);

    const canvasContainer = page.getByTestId('rac-canvas-container');
    const canvasBox = await canvasContainer.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (!canvasBox) {
      throw new Error('Canvas não disponível para teste de gestos mobile.');
    }

    const center = {
      clientX: canvasBox.x + canvasBox.width / 2,
      clientY: canvasBox.y + canvasBox.height / 2,
    };
    const moved = {
      clientX: center.clientX - 130,
      clientY: center.clientY - 90,
    };

    await dispatchCanvasTouch(page, 'touchstart', [{...center, identifier: 1}]);
    await dispatchCanvasTouch(page, 'touchmove', [{...moved, identifier: 1}]);
    await dispatchCanvasTouch(page, 'touchend', [], [{...moved, identifier: 1}]);

    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? 0).toBeGreaterThan(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);

    await page.getByRole('button', {name: /Zoom atual/}).click();
    await page.getByRole('button', {name: /Seleção/}).click({force: true});

    const beforePinch = await getCanvasPosition(page);
    expect(beforePinch).not.toBeNull();
    if (!beforePinch) {
      throw new Error('Posição do canvas não disponível para teste de pinch.');
    }

    const firstStart = {clientX: center.clientX - 35, clientY: center.clientY, identifier: 1};
    const secondStart = {clientX: center.clientX + 35, clientY: center.clientY, identifier: 2};
    const firstMove = {clientX: center.clientX - 110, clientY: center.clientY, identifier: 1};
    const secondMove = {clientX: center.clientX + 110, clientY: center.clientY, identifier: 2};

    await dispatchCanvasTouch(page, 'touchstart', [firstStart, secondStart]);
    await dispatchCanvasTouch(page, 'touchmove', [firstMove, secondMove]);
    await dispatchCanvasTouch(page, 'touchend', [], [firstMove, secondMove]);

    await expect.poll(async () => (await getCanvasPosition(page))?.zoom ?? 0).toBeGreaterThan(beforePinch.zoom + 0.05);
  });

  test('canvas: atalhos copy/paste/undo e delete com e sem editor aberto', async ({page}) => {
    await createHouse(page, 'tipo6');
    await triggerElementsAction(page, 'Objeto / Muro');

    const countByType = async (myType: string) =>
      (await getCanvasObjectsSummary(page)).filter((obj) => obj.myType === myType).length;

    const wallCountAfterAdd = await countByType('wall');
    expect(wallCountAfterAdd).toBeGreaterThan(0);

    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(async () => countByType('wall')).toBe(wallCountAfterAdd - 1);

    await triggerElementsAction(page, 'Objeto / Muro');
    const wallCountBeforePaste = await countByType('wall');
    const selected = await selectCanvasObjectByMyTypeByDebug(page, 'wall', true);
    expect(selected).toBe(true);

    await page.keyboard.press('ControlOrMeta+c');
    await page.keyboard.press('ControlOrMeta+v');
    await expect.poll(async () => countByType('wall')).toBe(wallCountBeforePaste + 1);

    const selectedForDelete = await selectCanvasObjectByMyTypeByDebug(page, 'wall', true);
    expect(selectedForDelete).toBe(true);

    const openedEditor = await openPilotiEditorByDebug(page, 'piloti_0_0');
    expect(openedEditor).toBe(true);
    await expect(page.getByText('Definir como Mestre?')).toBeVisible();

    const wallCountBeforeBlockedDelete = await countByType('wall');
    await page.keyboard.press('Delete');
    await expect.poll(async () => countByType('wall')).toBe(wallCountBeforeBlockedDelete);

    await closePilotiEditorByDebug(page);
    await expect(page.getByText('Definir como Mestre?')).toBeHidden();

    const selectedAfterEditorClose = await selectCanvasObjectByMyTypeByDebug(page, 'wall', true);
    expect(selectedAfterEditorClose).toBe(true);
    const wallCountBeforeDelete = await countByType('wall');
    await page.keyboard.press('Delete');
    await expect.poll(async () => countByType('wall')).toBe(wallCountBeforeDelete - 1);
  });
});
