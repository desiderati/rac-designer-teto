import {describe, expect, it, vi} from 'vitest';
import {FabricImage, util} from 'fabric';
import {createHouseTop} from '@/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts';
import {toCanvasObject, type CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';
import {EditorHouseVisualRuntime} from '@/components/rac-editor/lib/editor-house-visual-runtime.ts';
import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import {normalizeHouseDrawingViewer3D} from '@/shared/types/house-drawing-document.ts';
import type {HouseState} from '@/shared/types/house.ts';

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';

describe('roundtrip de planta tipo 6 e snapshot 3D', () => {
  it('preserva o grupo da planta, o vínculo da vista e a configuração 3D após reidratação', async () => {
    const plant = createHouseTop({width: 1200, height: 800} as never);
    plant.houseInstanceId = 'vista-top-qa';
    plant.houseViewType = 'top';
    const imageElement = document.createElement('img');
    imageElement.src = PIXEL;
    const image = toCanvasObject(new FabricImage(imageElement, {width: 1, height: 1, left: 600, top: 400}));
    image.myType = 'image';

    const source = {
      getObjects: () => [plant, image],
    };
    const exported = createFabricCanvasDocumentPort(source as never).exportCanvasDocument();
    expect(exported?.objects.map((object) => object.kind)).toEqual(['house', 'image']);
    expect(exported?.objects[0]?.metadata?.houseInstanceId).toBe('vista-top-qa');

    const restoredObjects: unknown[] = [];
    const restoredCanvas = {
      getObjects: () => restoredObjects,
      clear: () => { restoredObjects.length = 0; },
      loadFromJSON: async (payload: {objects: Record<string, unknown>[]}) => {
        restoredObjects.push(...await util.enlivenObjects(payload.objects));
      },
      renderAll: () => undefined,
      requestRenderAll: () => undefined,
    };
    const imageHydration = vi.spyOn(FabricImage, 'fromObject').mockResolvedValue(image as never);
    const loaded = await createFabricCanvasDocumentPort(restoredCanvas as never)
      .loadCanvasDocument(JSON.parse(JSON.stringify(exported)));
    imageHydration.mockRestore();
    expect(loaded).toBe(true);
    expect(restoredObjects).toHaveLength(2);

    const runtime = new EditorHouseVisualRuntime<CanvasGroup>();
    runtime.initialize({
      getHouseGroups: () => restoredObjects.filter((object): object is CanvasGroup =>
        (object as CanvasGroup).myType === 'house'),
      includesGroup: (group) => restoredObjects.includes(group),
      requestRenderAll: () => undefined,
    });
    const house: HouseState = {
      id: 'qa17', houseType: 'tipo6', pilotis: {}, terrainType: 0,
      views: {top: [{instanceId: 'vista-top-qa'}], front: [], back: [], side1: [], side2: []},
      sideMappings: {top: 'front', bottom: 'back', left: 'side1', right: 'side1'},
      preAssignedSides: {},
    };
    const projection = createHouse3DProjectionFromCanvasHouse(runtime.createRuntimeHouseSnapshot(house));
    expect(projection?.houseType).toBe('tipo6');
    expect(projection?.hasHouseViews).toBe(true);

    const viewer3D = {cameraPose: null, wallColor: '#bc6c47', hideBelowTerrain: true};
    expect(normalizeHouseDrawingViewer3D(JSON.parse(JSON.stringify(viewer3D)))).toEqual(viewer3D);
  }, 15000);
});
