import {expect, type Page} from '@playwright/test';
import type {RootState} from '@react-three/fiber';
import type {Mesh, BoxGeometry, MeshStandardMaterial} from 'three';
import type {CanvasGroup, CanvasObject} from '../../client/src/components/rac-editor/@canvas/lib';
import type {HouseRuntimeSnapshot} from '../../client/src/components/rac-editor/lib/house-runtime-snapshot';
import type {HouseSide, HouseViewType} from '../../client/src/shared/types/house';
import {readConstructionSiteDocument} from './construction-site-storage.helpers';
import {ensureOverflowMenuOpen, getHouseSnapshot} from './rac-editor.helpers';

type DebugWindow = Window & {__racDebug?: {getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null}};
export type Face = 'front' | 'back' | 'left' | 'right';

export async function expectViews(page: Page, expected: string[]) {
  await expect.poll(async () => {
    const house = await getHouseSnapshot(page);
    return house ? Object.entries(house.views).flatMap(([type, views]) =>
      views.map(view => `${type}:${view.side ?? ''}`)).sort() : [];
  }).toEqual([...expected].sort());
}

export async function saveAndReloadHouse(page: Page, expected: string[]) {
  const before = await readViewLayout(page);
  // O editor salva automaticamente. Esperar o documento efetivo evita reload durante debounce.
  await expect.poll(async () => {
    const document = await readConstructionSiteDocument(page);
    const house = document?.constructionSites[0]?.houses[0]?.drawingDocument?.house;
    return house ? Object.entries(house.views).flatMap(([type, views]) =>
      views.map(view => `${type}:${view.side ?? ''}`)).sort() : [];
  }).toEqual([...expected].sort());
  await expect.poll(async () => {
    const document = await readConstructionSiteDocument(page);
    const objects = document?.constructionSites[0]?.houses[0]?.drawingDocument?.canvas.objects ?? [];
    return before.every(view => {
      const object = objects.find(candidate => candidate.metadata?.houseInstanceId === view.id);
      return object && Math.abs((object.geometry.left ?? 0) - view.left) < 0.01
        && Math.abs((object.geometry.top ?? 0) - view.top) < 0.01;
    });
  }).toBe(true);
  await page.reload();
  await expect(page.getByRole('button', {name: 'Casa TETO (Opções)'})).toBeVisible();
  await expectViews(page, expected);
  const after = await readViewLayout(page);
  expect(after.map(view => view.id)).toEqual(before.map(view => view.id));
  after.forEach((view, index) => {
    for (const property of ['left', 'top', 'scaleX', 'scaleY', 'angle'] as const) {
      expect(view[property], `${view.id}: ${property} após reabrir`).toBeCloseTo(before[index][property], 2);
    }
  });
}

async function readViewLayout(page: Page) {
  return page.evaluate(() => {
    const house = (window as DebugWindow).__racDebug?.getHouse();
    return Object.values(house?.views ?? {}).flat().map(view => ({
      id: view.instanceId, left: view.group.left, top: view.group.top,
      scaleX: view.group.scaleX, scaleY: view.group.scaleY, angle: view.group.angle,
    })).sort((a, b) => a.id.localeCompare(b.id));
  });
}

export async function expectPlantAnnotations(page: Page, side: HouseSide, expectedSides: HouseSide[]) {
  const geometry = await page.evaluate(() => {
    const group = (window as DebugWindow).__racDebug?.getHouse()?.views.top[0]?.group;
    const objects = group?.getObjects() as CanvasObject[] | undefined;
    const body = objects?.find(object => object.isHouseBody);
    if (!body) throw new Error('Corpo da planta ausente');
    const center = body.getRelativeCenterPoint();
    return {
      halfWidth: body.width * body.scaleX / 2, halfHeight: body.height * body.scaleY / 2,
      pilotis: objects!.filter(object => object.isPilotiCircle).length,
      doors: objects!.filter(object => object.doorMarkerSide && object.visible).map(object => ({
        side: object.doorMarkerSide, x: object.left - center.x, y: object.top - center.y,
      })),
      markers: objects!.filter(object => object.isHouseViewReferenceMarker && object.visible).map(object => ({
        side: object.houseViewReferenceMarkerSide, x: object.left - center.x, y: object.top - center.y,
      })),
    };
  });
  expect(geometry.pilotis).toBe(12);
  expect(geometry.doors).toHaveLength(1);
  const door = geometry.doors[0];
  expect(door.side).toBe(side);
  const horizontal = side === 'top' || side === 'bottom';
  expect(horizontal ? door.y : door.x).toBeCloseTo(
    (side === 'top' || side === 'left' ? -1 : 1) * (horizontal ? geometry.halfHeight : geometry.halfWidth), 2);
  expect(geometry.markers.map(marker => marker.side).sort()).toEqual([...expectedSides].sort());
  for (const marker of geometry.markers) {
    const horizontal = marker.side === 'top' || marker.side === 'bottom';
    expect(horizontal ? marker.x : marker.y).toBeCloseTo(0, 2);
    expect(horizontal ? marker.y : marker.x).toBeCloseTo(
      (marker.side === 'top' || marker.side === 'left' ? -1 : 1)
        * ((horizontal ? geometry.halfHeight : geometry.halfWidth) + 10.5), 2);
  }
}

async function viewBodyScreenPoint(page: Page, viewType: HouseViewType, side?: HouseSide) {
  // A vista entra no estado antes de terminar a saída do diálogo de escolha do lado.
  // Mouse.down não tem a espera automática por overlays que Locator.click oferece.
  await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toHaveCount(0);
  // Somente leitura: calcular um ponto do corpo da elevação para o clique real no Canvas.
  return page.evaluate(({viewType, side}) => {
    const group = (window as DebugWindow).__racDebug?.getHouse()?.views[viewType]
      .find(view => !side || view.side === side)?.group;
    if (!group?.canvas) throw new Error(`Elevação ausente: ${viewType}:${side}`);
    const body = group.getObjects().find(object => (object as {isHouseBody?: boolean}).isHouseBody);
    if (!body) throw new Error('Corpo da elevação ausente');
    const center = body.getCenterPoint();
    const [a, b, c, d, e, f] = group.canvas.viewportTransform;
    const bounds = group.canvas.getSelectionElement().getBoundingClientRect();
    return {x: bounds.x + a * center.x + c * center.y + e,
      y: bounds.y + b * center.x + d * center.y + f};
  }, {viewType, side});
}

export async function moveViewThroughUI(page: Page, viewType: HouseViewType, side: HouseSide | undefined,
  target: {x: number; y: number}) {
  const point = await viewBodyScreenPoint(page, viewType, side);
  await expect.poll(() => page.evaluate(({x, y}) =>
    document.elementFromPoint(x, y)?.classList.contains('upper-canvas') ?? false, point)).toBe(true);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, {steps: 12});
  await page.mouse.up();
  await expect.poll(async () => {
    const after = await viewBodyScreenPoint(page, viewType, side);
    return Math.hypot(after.x - target.x, after.y - target.y);
  }).toBeLessThan(2);
}

export async function removeElevationThroughUI(page: Page, viewType: HouseViewType, side: HouseSide) {
  const point = await viewBodyScreenPoint(page, viewType, side);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press('Delete');
}

export async function readRenderedScene(page: Page) {
  return page.evaluate(async () => {
    // Ler a raiz já montada pelo visualizador; não construir uma cena paralela nem chamar parsers.
    // O módulo é o recurso Vite efetivamente carregado, incluindo seu hash de versão.
    const moduleUrl = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(name => /\/@react-three_fiber\.js(?:\?|$)/.test(name));
    if (!moduleUrl) throw new Error('Módulo React Three Fiber não carregado pelo visualizador');
    const {_roots} = await import(moduleUrl) as {
      _roots: Map<HTMLCanvasElement, {store: {getState(): RootState}}>;
    };
    const canvas = document.querySelector<HTMLCanvasElement>('[role="dialog"] canvas');
    const state = canvas && _roots.get(canvas)?.store.getState();
    if (!state) throw new Error('Cena WebGL do diálogo não encontrada');
    const panels: Array<{face: Face; kind: 'door' | 'window'; position: number[]}> = [];
    const stairs: Array<{face: Face; steps: number}> = [];
    const pilotiPositions = new Set<string>();
    const faceFromNormal = (x: number, z: number): Face =>
      Math.abs(x) > Math.abs(z) ? (x > 0 ? 'right' : 'left') : (z > 0 ? 'front' : 'back');
    state.scene.traverse(object => {
      const mesh = object as Mesh;
      if (mesh.geometry?.type === 'CylinderGeometry') {
        const position = object.getWorldPosition(object.position.clone());
        pilotiPositions.add(`${position.x.toFixed(2)}:${position.z.toFixed(2)}`);
      }
      const children = object.children as Mesh<BoxGeometry, MeshStandardMaterial>[];
      if (!object.visible || !children.length || !children.every(child => child.isMesh)) return;
      const normal = object.position.clone().set(0, 0, 1).transformDirection(object.matrixWorld);
      const face = faceFromNormal(normal.x, normal.z);
      if (children.length === 2 && children.every(child => child.material.type === 'MeshBasicMaterial'
        && child.geometry.type === 'BoxGeometry')) {
        const {width, height} = children[1].geometry.parameters;
        const position = object.getWorldPosition(object.position.clone());
        const panelFace: Face = Math.abs(normal.x) > Math.abs(normal.z)
          ? (position.x > 0 ? 'right' : 'left') : (position.z > 0 ? 'front' : 'back');
        panels.push({face: panelFace, kind: height > width * 1.5 ? 'door' : 'window',
          position: position.toArray()});
      }
      if (children.length >= 3 && children.every(child => child.geometry.type === 'BoxGeometry'
        && child.material.roughness === 0.7)) {
        stairs.push({face, steps: children.length - 2});
      }
    });
    return {panels, stairs, pilotis: pilotiPositions.size,
      camera: state.camera.position.toArray(), drawCalls: state.gl.info.render.calls,
      contextLost: state.gl.getContext().isContextLost()};
  });
}

export async function inspectViewer(page: Page, face: Face, type: 'tipo3' | 'tipo6') {
  await ensureOverflowMenuOpen(page);
  await page.getByRole('button', {name: 'Visualização 3D', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Visualizador 3D'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('button[title="Enquadrar casa"]')).toBeEnabled();
  await expect.poll(async () => (await readRenderedScene(page)).panels.length).toBe(4);
  const scene = await readRenderedScene(page);
  expect(scene.contextLost).toBe(false);
  expect(scene.drawCalls).toBeGreaterThan(0);
  expect(scene.panels.filter(panel => panel.kind === 'door').map(panel => panel.face)).toEqual([face]);
  const windowFaces = type === 'tipo6' ? [face, face, face === 'front' ? 'back' : 'front'] : ['front', 'back', face];
  expect(scene.panels.filter(panel => panel.kind === 'window').map(panel => panel.face).sort())
    .toEqual(windowFaces.sort());
  expect(scene.stairs).toHaveLength(1);
  expect(scene.stairs[0].face).toBe(face);
  expect(scene.stairs[0].steps).toBeGreaterThan(0);
  expect(scene.pilotis).toBe(12);
  const cameraAxis = face === 'front' || face === 'back' ? scene.camera[2] : scene.camera[0];
  expect(Math.sign(cameraAxis)).toBe(face === 'front' || face === 'right' ? 1 : -1);
  return dialog;
}
