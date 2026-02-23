import { expect, test } from "@playwright/test";
import {
  closePilotiEditorByDebug,
  createHouse,
  getCanvasObjectsSummary,
  getCanvasPosition,
  getHouseSnapshot,
  openPilotiEditorByDebug,
  selectCanvasObjectByMyTypeByDebug,
  setCanvasPositionByDebug,
  setupRacPage,
  triggerElementsAction,
} from "./helpers/rac-helpers";

test.describe("RAC canvas interactions", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await setupRacPage(page);
  });

  test("canvas: zoom slider altera o nivel de zoom", async ({ page }) => {
    await createHouse(page, "tipo6");

    const zoomSlider = page.locator('[data-testid="rac-zoom-slider"]:visible').first();
    const minimap = page.locator('[data-testid="rac-minimap"]:visible').first();
    await expect(zoomSlider).toBeVisible();
    await expect(minimap).toBeVisible();

    const initial = await getCanvasPosition(page);
    expect(initial).not.toBeNull();

    const zoomSliderBox = await zoomSlider.boundingBox();
    expect(zoomSliderBox).not.toBeNull();
    if (!zoomSliderBox || !initial) {
      throw new Error("Zoom slider não disponível para teste.");
    }

    await page.mouse.move(zoomSliderBox.x + 2, zoomSliderBox.y + zoomSliderBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(zoomSliderBox.x + zoomSliderBox.width - 2, zoomSliderBox.y + zoomSliderBox.height / 2);
    await page.mouse.up();

    await expect.poll(async () => (await getCanvasPosition(page))?.zoom ?? 0).toBeGreaterThan(initial.zoom + 0.2);

    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if (!minimapBox) {
      throw new Error("Minimap não disponível para teste.");
    }

    await page.mouse.click(minimapBox.x + minimapBox.width / 2, minimapBox.y + minimapBox.height / 2);
    const snapshotAfterMinimapClick = await getHouseSnapshot(page);
    expect(snapshotAfterMinimapClick).not.toBeNull();
  });

  test("canvas: pan por wheel e minimap atualizam viewport", async ({ page }) => {
    await createHouse(page, "tipo6");

    const zoomSlider = page.locator('[data-testid="rac-zoom-slider"]:visible').first();
    await expect(zoomSlider).toBeVisible();
    const zoomSliderBox = await zoomSlider.boundingBox();
    expect(zoomSliderBox).not.toBeNull();
    if (!zoomSliderBox) {
      throw new Error("Zoom slider não disponível para teste.");
    }

    await page.mouse.move(zoomSliderBox.x + zoomSliderBox.width - 3, zoomSliderBox.y + zoomSliderBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(zoomSliderBox.x + zoomSliderBox.width - 2, zoomSliderBox.y + zoomSliderBox.height / 2);
    await page.mouse.up();

    const resetViewport = await setCanvasPositionByDebug(page, 0, 0);
    expect(resetViewport).toBe(true);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? -1).toBe(0);

    const canvasContainer = page.getByTestId("rac-canvas-container");
    await canvasContainer.dispatchEvent("wheel", { deltaX: 0, deltaY: 280 });
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);

    const minimap = page.locator('[data-testid="rac-minimap"]:visible').first();
    await expect(minimap).toBeVisible();
    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if (!minimapBox) {
      throw new Error("Minimap não disponível para teste.");
    }

    await setCanvasPositionByDebug(page, 0, 0);
    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? -1).toBe(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? -1).toBe(0);

    await page.mouse.click(minimapBox.x + minimapBox.width - 2, minimapBox.y + minimapBox.height - 2);
    await expect.poll(async () => (await getCanvasPosition(page))?.x ?? 0).toBeGreaterThan(0);
    await expect.poll(async () => (await getCanvasPosition(page))?.y ?? 0).toBeGreaterThan(0);
  });

  test("canvas: atalhos copy/paste/undo e delete com e sem editor aberto", async ({ page }) => {
    await createHouse(page, "tipo6");
    await triggerElementsAction(page, "Objeto / Muro");

    const countByType = async (myType: string) =>
      (await getCanvasObjectsSummary(page)).filter((obj) => obj.myType === myType).length;

    const wallCountAfterAdd = await countByType("wall");
    expect(wallCountAfterAdd).toBeGreaterThan(0);

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(async () => countByType("wall")).toBe(wallCountAfterAdd - 1);

    await triggerElementsAction(page, "Objeto / Muro");
    const wallCountBeforePaste = await countByType("wall");
    const selected = await selectCanvasObjectByMyTypeByDebug(page, "wall", true);
    expect(selected).toBe(true);

    await page.keyboard.press("ControlOrMeta+c");
    await page.keyboard.press("ControlOrMeta+v");
    await expect.poll(async () => countByType("wall")).toBe(wallCountBeforePaste + 1);

    const selectedForDelete = await selectCanvasObjectByMyTypeByDebug(page, "wall", true);
    expect(selectedForDelete).toBe(true);

    const openedEditor = await openPilotiEditorByDebug(page, "piloti_0_0");
    expect(openedEditor).toBe(true);
    await expect(page.getByText("Definir como Mestre?")).toBeVisible();

    const wallCountBeforeBlockedDelete = await countByType("wall");
    await page.keyboard.press("Delete");
    await expect.poll(async () => countByType("wall")).toBe(wallCountBeforeBlockedDelete);

    await closePilotiEditorByDebug(page);
    await expect(page.getByText("Definir como Mestre?")).toBeHidden();

    const selectedAfterEditorClose = await selectCanvasObjectByMyTypeByDebug(page, "wall", true);
    expect(selectedAfterEditorClose).toBe(true);
    const wallCountBeforeDelete = await countByType("wall");
    await page.keyboard.press("Delete");
    await expect.poll(async () => countByType("wall")).toBe(wallCountBeforeDelete - 1);
  });
});
