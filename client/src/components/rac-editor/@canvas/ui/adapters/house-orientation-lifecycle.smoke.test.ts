import {describe, expect, it} from 'vitest';
import {Canvas} from 'fabric';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {DEFAULT_HOUSE_PILOTI, type House3DFace, type HouseSide, type HouseTypeExcludeNull, type HouseViewType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import {EditorHouseVisualRuntime} from '@/components/rac-editor/lib/editor-house-visual-runtime.ts';
import type {House3DProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import {buildHouse3DViewerModel} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts';
import {buildHouseElementsFromCanvasModel} from '@/components/rac-editor/@viewer-3d/lib/parsers/house-elements-parser.ts';
import {createHouse3DProjectionFromDocument} from '@/components/rac-editor/@viewer-3d/lib/projection-from-document.ts';
import {resolveHouse3DDoorFace} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {getCanvasGroupObjects, type CanvasGroup} from '../../lib/canvas.ts';
import {getHouseViewStrategy} from '../../lib/factory/house/index.ts';
import {createHouse3DProjectionFromCanvasHouse} from '../../lib/house-3d-projection.ts';
import {refreshAutoStairs, refreshHouseViewReferenceMarkers, refreshTopDoorMarkers} from '../../lib/house-visual-effects.ts';
import {createCanvasHouseRuntimePort} from './fabric-canvas-house-runtime-port.ts';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';

const cases: Array<{type: HouseTypeExcludeNull; side: HouseSide; face: House3DFace}> = [
  {type: 'tipo6', side: 'top', face: 'front'},
  {type: 'tipo6', side: 'bottom', face: 'back'},
  {type: 'tipo3', side: 'left', face: 'right'},
  {type: 'tipo3', side: 'right', face: 'left'},
];

describe('orientação durante o ciclo planta → elevações → documento → 3D', () => {
  it.each(cases)('$type, porta $side: mantém geometria e orientação em cada transição', async ({type, side, face}) => {
    const canvases: Canvas[] = [];
    const createCanvas = () => {
      const canvas = new Canvas(document.createElement('canvas'), {width: 1200, height: 900, renderOnAddRemove: false});
      canvases.push(canvas);
      return canvas;
    };
    let canvas = createCanvas();
    let aggregate = HouseAggregate.fromState(HouseAggregate.createInitialHouseState({
      id: `lifecycle-${type}-${side}`, pilotiIds: getAllPilotiIds(),
      defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: 1,
    }));
    aggregate.setHouseType(type);
    aggregate.autoAssignAllSides(side);
    let runtime = new EditorHouseVisualRuntime<CanvasGroup>();
    runtime.initialize(createCanvasHouseRuntimePort(canvas));
    let sequence = 0;
    const snapshot = () => runtime.createRuntimeHouseSnapshot(aggregate.toState())!;
    const refresh = () => {
      const args = {house: snapshot(), requestRender: () => canvas.requestRenderAll()};
      refreshHouseViewReferenceMarkers(args);
      refreshTopDoorMarkers({...args, reposition: true});
      refreshAutoStairs({...args, settingsPort: {
        getSettings: () => APP_SETTINGS_DEFAULTS, updateSetting: () => undefined,
      }});
    };
    const insert = (viewType: HouseViewType, viewSide?: HouseSide) => {
      const group = getHouseViewStrategy(viewType).create(canvas, {side: viewSide});
      const instanceId = `${viewType}_${++sequence}`;
      Object.assign(group, {houseInstanceId: instanceId, houseViewType: viewType, houseSide: viewSide});
      // Transformação de grupo não deve modificar a orientação semântica da casa.
      group.set({left: 400 + sequence * 20, top: 280 + sequence * 30, angle: 17, scaleX: 1.3, scaleY: 0.8});
      canvas.add(group);
      aggregate.registerView({viewType, instanceId, side: viewSide});
      refresh();
      return instanceId;
    };
    const remove = (instanceId: string) => {
      const group = runtime.getViewGroup(instanceId)!;
      canvas.remove(group);
      expect(aggregate.removeView({instanceId}).removedCount).toBe(1);
      runtime.unregisterViewGroup(instanceId);
      refresh();
    };
    const assert3D = (projection: House3DProjection | null, label: string) => {
      const model = buildHouse3DViewerModel(projection);
      expect(model.canRenderHouse, label).toBe(true);
      const elements = buildHouseElementsFromCanvasModel(type, model.tipo6FrontSide, model.tipo3OpenSide);
      expect(elements.filter(element => element.type === 'door').map(element => element.face), label).toEqual([face]);
      const windowFaces = type === 'tipo6'
        ? [face, face, face === 'front' ? 'back' : 'front']
        : ['front', 'back', face];
      expect(elements.filter(element => element.type === 'window').map(element => element.face).sort(), label)
        .toEqual(windowFaces.sort());
      const elevationIds = Object.entries(aggregate.toState().views)
        .filter(([viewType]) => viewType !== 'top').flatMap(([, views]) => views.map(view => view.instanceId));
      expect(projection?.elevationViews.map(view => view.instanceId).sort(), label).toEqual(elevationIds.sort());
      projection?.elevationViews.forEach(view => {
        expect(view.bodyWidth, label).toBeGreaterThan(0);
        if (view.viewType === (type === 'tipo6' ? 'front' : 'side2')) {
          expect(view.doorWidth, label).toBeGreaterThan(0);
          expect(view.stairs?.stepCount, label).toBeGreaterThan(0);
        }
      });
      expect(model.stairs?.face, label).toBe(face);
      expect(resolveHouse3DDoorFace(type, model.tipo6FrontSide, model.tipo3OpenSide), label).toBe(face);
      expect(model.pilotis, label).toEqual(aggregate.toState().pilotis);
    };

    try {
      insert('top');
      const initialTop = snapshot().views.top[0].group;
      const initialObjects = getCanvasGroupObjects(initialTop);
      const initialBody = initialObjects.find(object => object.isHouseBody)!;
      const bodySceneCenter = initialBody.getCenterPoint();
      const initialDoor = initialObjects.find(object => object.doorMarkerSide === side)!;
      const horizontal = side === 'top' || side === 'bottom';
      const initialLongitudinal = horizontal
        ? initialDoor.left - initialBody.getRelativeCenterPoint().x
        : initialDoor.top - initialBody.getRelativeCenterPoint().y;
      const pilotiCenters = initialObjects.filter(object => object.isPilotiCircle).map(object => object.getCenterPoint());
      expect(pilotiCenters).toHaveLength(12);
      const originalPreAssignment = {...aggregate.toState().preAssignedSides};

      const assertStage = (label: string) => {
        const house = snapshot();
        const objects = getCanvasGroupObjects(house.views.top[0].group);
        const body = objects.find(object => object.isHouseBody)!;
        const center = body.getRelativeCenterPoint();
        const doors = objects.filter(object => object.doorMarkerSide === side);
        expect(doors, label).toHaveLength(1);
        const door = doors[0];
        const sign = side === 'top' || side === 'left' ? -1 : 1;
        const halfExtent = (horizontal ? body.height * body.scaleY : body.width * body.scaleX) / 2;
        // Fabric arredonda a geometria exportada; tolerância de centésimos, não de pixels inteiros.
        expect(horizontal ? door.top - center.y : door.left - center.x, label).toBeCloseTo(sign * halfExtent, 2);
        expect(horizontal ? door.left - center.x : door.top - center.y, label).toBeCloseTo(initialLongitudinal, 2);
        expect(body.getCenterPoint().x, label).toBeCloseTo(bodySceneCenter.x, 2);
        expect(body.getCenterPoint().y, label).toBeCloseTo(bodySceneCenter.y, 2);
        const pilotis = objects.filter(object => object.isPilotiCircle);
        expect(pilotis, label).toHaveLength(12);
        pilotis.forEach((piloti, index) => {
          expect(piloti.getCenterPoint().x, label).toBeCloseTo(pilotiCenters[index].x, 2);
          expect(piloti.getCenterPoint().y, label).toBeCloseTo(pilotiCenters[index].y, 2);
        });
        const expectedSides = Object.entries(house.sideMappings).filter(([, view]) => view).map(([mappedSide]) => mappedSide);
        const markers = objects.filter(object => object.isHouseViewReferenceMarker);
        expect(markers.map(marker => marker.houseViewReferenceMarkerSide).sort(), label).toEqual(expectedSides.sort());
        for (const marker of markers) {
          const markerSide = marker.houseViewReferenceMarkerSide;
          const markerHorizontal = markerSide === 'top' || markerSide === 'bottom';
          const markerSign = markerSide === 'top' || markerSide === 'left' ? -1 : 1;
          const extent = (markerHorizontal ? body.height * body.scaleY : body.width * body.scaleX) / 2;
          expect(markerHorizontal ? marker.left - center.x : marker.top - center.y, label).toBeCloseTo(0, 2);
          expect(markerHorizontal ? marker.top - center.y : marker.left - center.x, label)
            .toBeCloseTo(markerSign * (extent + 10.5), 2);
        }
        expect(house.preAssignedSides, label).toEqual(originalPreAssignment);
        expect(canvas.getObjects(), label).toHaveLength(1 + expectedSides.length);
        expect(Object.values(house.views).flat(), label).toHaveLength(1 + expectedSides.length);
        assert3D(createHouse3DProjectionFromCanvasHouse(house), `${label}: Canvas`);
      };
      const saveAndReopen = async (label: string) => {
        assertStage(label);
        // Cada etapa atravessa duas reaberturas, sem reusar instâncias Fabric da origem.
        for (let round = 1; round <= 2; round++) {
          const beforeState = JSON.stringify(aggregate.toState());
          const saved: HouseDrawingDocument = JSON.parse(JSON.stringify({
            documentType: 'rac-house-drawing', schemaVersion: 1,
            setup: {familyName: 'Teste de orientação', selectedPilotiHeights: [1, 1.5, 2]},
            house: aggregate.toState(), canvas: createFabricCanvasDocumentPort(canvas).exportCanvasDocument(),
          }));
          assert3D(createHouse3DProjectionFromDocument(saved), `${label}: documento ${round}`);
          expect(JSON.stringify(aggregate.toState())).toBe(beforeState);
          const previousCanvas = canvas;
          canvas = createCanvas();
          expect(await createFabricCanvasDocumentPort(canvas).loadCanvasDocument(saved.canvas)).toBe(true);
          aggregate = HouseAggregate.fromState(saved.house);
          expect(JSON.stringify(aggregate.toState())).toBe(beforeState);
          runtime = new EditorHouseVisualRuntime<CanvasGroup>();
          runtime.initialize(createCanvasHouseRuntimePort(canvas));
          expect(snapshot().views.top[0].group).not.toBe(initialTop);
          // Conferir antes de atualizar: um refresh não pode mascarar erro de persistência.
          assertStage(`${label}: reabertura ${round}`);
          refresh();
          assertStage(`${label}: refresh ${round}`);
          await previousCanvas.dispose();
        }
      };

      await saveAndReopen('somente planta');
      // Inclui todas as quatro faces; os slots repetidos têm IDs e lados distintos.
      const elevations = Object.entries(originalPreAssignment).map(([slot, viewSide]) => ({
        viewType: slot.split('_')[0] as Exclude<HouseViewType, 'top'>, side: viewSide,
      }));
      const inserted: string[] = [];
      for (const elevation of elevations) {
        inserted.push(insert(elevation.viewType, elevation.side));
        await saveAndReopen(`inserir ${elevation.viewType}/${elevation.side}`);
      }
      // Remove a fachada com porta primeiro: o 3D deve voltar à pré-atribuição mesmo com outras elevações.
      for (const instanceId of inserted) {
        remove(instanceId);
        await saveAndReopen(`remover ${instanceId}`);
      }
      expect(Object.values(aggregate.toState().sideMappings)).toEqual([null, null, null, null]);
      const reinserted = insert(elevations[0].viewType, elevations[0].side);
      await saveAndReopen('reinserir fachada com porta');
      remove(reinserted);
      await saveAndReopen('retornar à planta isolada');
    } finally {
      await Promise.all(canvases.filter(surface => !surface.disposed).map(surface => surface.dispose()));
    }
  }, 30000);
});
