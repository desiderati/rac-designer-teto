import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createCanvasHouseController} from '@/components/rac-editor/@canvas/lib/canvas-house-controller.ts';
import {createCanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-house-runtime-port.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import type {HouseSide, HouseViewInstanceId, HouseViewType} from '@/shared/types/house.ts';

type MockObject = {
  [key: string]: unknown;
  set?: (patch: Record<string, unknown>) => void;
  setCoords?: () => void;
};

function createMockObject(props: Record<string, unknown> = {}): MockObject {
  return {
    ...props,
    set(patch: Record<string, unknown>) {
      Object.assign(this, patch);
    },
    setCoords: vi.fn(),
  };
}

function createMockGroup(props: Record<string, unknown> = {}) {
  const objects: MockObject[] = [];

  const group = {
    type: 'group',
    myType: 'house',
    _objects: objects,
    getObjects: vi.fn(() => objects),
    setControlsVisibility: vi.fn(),
    setCoords: vi.fn(),
    add: vi.fn((...items: MockObject[]) => {
      objects.push(...items);
    }),
    remove: vi.fn((...items: MockObject[]) => {
      const toRemove = new Set(items);
      const next = objects.filter((item) => !toRemove.has(item));
      objects.splice(0, objects.length, ...next);
    }),
    ...props,
  };

  return {group, objects};
}

function createMockCanvas(groups: Array<Record<string, unknown>>) {
  return {
    getObjects: vi.fn(() => groups),
    requestRenderAll: vi.fn(),
  };
}

function initializeHouseControllerCanvas(canvas: any) {
  houseController.initialize(createCanvasHouseRuntimePort(canvas));
}

let houseController: ReturnType<typeof createCanvasHouseController>;
let viewSequence = 0;

function registerMockView(
  viewType: HouseViewType,
  group: Record<string, unknown>,
  side?: HouseSide,
): HouseViewInstanceId {
  viewSequence += 1;
  const instanceId = `${viewType}_${viewSequence}`;
  Object.assign(group, {
    houseViewType: viewType,
    houseView: viewType,
    houseInstanceId: instanceId,
    houseSide: side,
  });
  const registration = houseController.registerView({viewType, instanceId, side});
  expect(registration?.instanceId).toBe(instanceId);
  return instanceId;
}

describe('editor house controller', () => {
  beforeEach(() => {
    houseController = createCanvasHouseController();
    viewSequence = 0;
  });

  it('creates house state for tipo6 and tipo3 with expected view limits', () => {
    houseController.setHouseType('tipo6');

    expect(houseController.getMaxHouseViewCount('top')).toBe(1);
    expect(houseController.getMaxHouseViewCount('front')).toBe(1);
    expect(houseController.getMaxHouseViewCount('back')).toBe(1);
    expect(houseController.getMaxHouseViewCount('side1')).toBe(2);
    expect(houseController.getMaxHouseViewCount('side2')).toBe(0);
    expect(houseController.canAddView('side2')).toBe(false);
    expect(houseController.getAvailableViews()).toEqual(['top', 'front', 'back', 'side1']);

    houseController.setHouseType('tipo3');

    expect(houseController.getMaxHouseViewCount('top')).toBe(1);
    expect(houseController.getMaxHouseViewCount('front')).toBe(0);
    expect(houseController.getMaxHouseViewCount('back')).toBe(2);
    expect(houseController.getMaxHouseViewCount('side1')).toBe(1);
    expect(houseController.getMaxHouseViewCount('side2')).toBe(1);
    expect(houseController.canAddView('front')).toBe(false);
    expect(houseController.getAvailableViews()).toEqual(['top', 'back', 'side1', 'side2']);
  });

  it('updates piloti data and keeps single master globally', () => {
    houseController.setHouseType('tipo6');

    houseController.updatePiloti('piloti_0_0', {height: 2.0, nivel: 0.5, isMaster: true});
    houseController.updatePiloti('piloti_3_2', {isMaster: true});

    expect(houseController.getPilotiData('piloti_3_2').isMaster).toBe(true);
    expect(houseController.getPilotiData('piloti_0_0').isMaster).toBe(false);
    // Precedência: quando o caller passa uma altura explícita junto com o novo nível,
    // a altura escolhida não é sobrescrita pelo recálculo global. Recálculo continua
    // propagando níveis e alturas para os demais pilotis.
    expect(houseController.getPilotiData('piloti_0_0').height).toBe(2.0);
    expect(houseController.getPilotiData('piloti_0_0').nivel).toBe(0.5);
  });

  it('notifies subscribers when the family name changes', () => {
    const listener = vi.fn();
    const unsubscribe = houseController.subscribe(listener);

    houseController.setFamilyName('Família Nova');

    expect(houseController.getFamilyName()).toBe('Família Nova');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('recalcula níveis intermediários e alturas recomendadas quando um nível de canto é alterado', () => {
    houseController.setHouseType('tipo6');

    houseController.updatePiloti('piloti_0_0', {nivel: 0.2});
    houseController.updatePiloti('piloti_3_0', {nivel: 1.0});
    houseController.updatePiloti('piloti_0_2', {nivel: 0.2});
    houseController.updatePiloti('piloti_3_2', {nivel: 1.0});

    expect(houseController.getPilotiData('piloti_1_1').nivel).toBe(0.47);
    expect(houseController.getPilotiData('piloti_2_1').nivel).toBe(0.73);

    // Mudança de nível em canto afeta toda a casa: alturas recomendadas são
    // recalculadas em todos os 12 pilotis via regra de ouro (altura = menor ≥ nivel*3).
    // piloti_1_1 @ nivel=0.47 → minHeight=1.41 → recommended=1.5.
    expect(houseController.getPilotiData('piloti_1_1').height).toBe(1.5);
    // piloti_2_1 @ nivel=0.73 → minHeight=2.19 → recommended=2.5.
    expect(houseController.getPilotiData('piloti_2_1').height).toBe(2.5);
  });

  it('registers and removes views while syncing side assignments', () => {
    const {group} = createMockGroup();
    const canvasGroups = [group];
    initializeHouseControllerCanvas(createMockCanvas(canvasGroups));
    houseController.setHouseType('tipo6');
    expect(houseController.hasAnyView()).toBe(false);

    const instanceId = registerMockView('front', group as any, 'top');
    expect(houseController.getHouseViewCount('front')).toBe(1);
    expect(houseController.hasOtherViews()).toBe(true);
    expect(houseController.hasAnyView()).toBe(true);
    expect(houseController.getAllGroups()).toHaveLength(1);
    expect(houseController.getHouse()?.sideMappings.top).toBe('front');

    houseController.removeView(instanceId);
    canvasGroups.splice(0, 1);
    expect(houseController.getHouseViewCount('front')).toBe(0);
    expect(houseController.hasAnyView()).toBe(false);
    expect(houseController.getAllGroups()).toHaveLength(0);
    expect(houseController.getHouse()?.sideMappings.top).toBeNull();
  });

  it('mantém tipo de terreno global e aplica para todas as vistas elevadas', () => {
    const {group: topGroup} = createMockGroup({houseView: 'top'});
    const {group: frontGroup} = createMockGroup({houseView: 'front'});
    const {group: sideGroup} = createMockGroup({houseView: 'side'});
    initializeHouseControllerCanvas(createMockCanvas([topGroup, frontGroup, sideGroup]));
    houseController.setHouseType('tipo6');

    registerMockView('top', topGroup as any);
    registerMockView('front', frontGroup as any, 'top');
    registerMockView('side1', sideGroup as any, 'left');

    const terrain = houseController.setTerrainType(4);
    expect(terrain).toBe(4);
    expect(houseController.getTerrainType()).toBe(4);
    expect(houseController.getHouse()?.terrainType).toBe(4);
    expect((frontGroup as any).groundTerrainType).toBe(4);
    expect((sideGroup as any).groundTerrainType).toBe(4);
  });

  it('rebuilds views and piloti data from current canvas objects (import-like flow)', () => {
    const pilotiCircle = createMockObject({
      pilotiId: 'piloti_0_0',
      isPilotiCircle: true,
      pilotiHeight: 2.5,
      pilotiIsMaster: true,
      pilotiNivel: 0.8,
      left: 10,
      top: 10,
      radius: 9,
    });

    const {group, objects} = createMockGroup({
      houseViewType: 'top',
      houseInstanceId: 'top_1',
      houseView: 'top',
    });
    objects.push(pilotiCircle);

    const canvas = createMockCanvas([group]);
    initializeHouseControllerCanvas(canvas);
    houseController.setHouseType('tipo6');
    houseController.rebuildFromCanvas();

    expect(houseController.getHouseViewCount('top')).toBe(1);
    expect(houseController.getHouse()?.views.top[0]?.instanceId).toBe('top_1');
    expect(houseController.getPilotiData('piloti_0_0')).toMatchObject({
      height: 2.5,
      isMaster: true,
      nivel: 0.8,
    });
  });

  it('clears house type when rebuild finds no house groups on canvas', () => {
    const canvas = createMockCanvas([]);
    initializeHouseControllerCanvas(canvas);
    houseController.setHouseType('tipo6');

    houseController.rebuildFromCanvas();

    expect(houseController.getHouseType()).toBeNull();
  });

  it('positions top door marker using rendered door geometry instead of stored door coordinates', () => {
    const topMarkerTop = createMockObject({isTopDoorMarker: true, doorMarkerSide: 'top', visible: false});
    const topMarkerBottom = createMockObject({isTopDoorMarker: true, doorMarkerSide: 'bottom', visible: false});
    const topMarkerLeft = createMockObject({isTopDoorMarker: true, doorMarkerSide: 'left', visible: false});
    const topMarkerRight = createMockObject({isTopDoorMarker: true, doorMarkerSide: 'right', visible: false});
    const topBody = createMockObject({
      isHouseBody: true,
      width: HOUSE_DIMENSIONS.footprint.width * HOUSE_DIMENSIONS.view.scale,
      height: HOUSE_DIMENSIONS.footprint.depth * HOUSE_DIMENSIONS.view.scale,
      scaleX: 1,
      scaleY: 1,
    });

    const {group: topGroup, objects: topObjects} = createMockGroup();
    topObjects.push(topBody, topMarkerTop, topMarkerBottom, topMarkerLeft, topMarkerRight);

    const {group: frontGroup} = createMockGroup();
    const canvas = createMockCanvas([topGroup, frontGroup]);
    initializeHouseControllerCanvas(canvas);
    houseController.setHouseType('tipo6');

    registerMockView('top', topGroup as any);
    registerMockView('front', frontGroup as any, 'bottom');

    expect(topMarkerBottom.visible).toBe(true);
    expect(topMarkerTop.visible).toBe(false);
    expect(topMarkerLeft.visible).toBe(false);
    expect(topMarkerRight.visible).toBe(false);

    const expectedScale = HOUSE_DIMENSIONS.view.scale;
    const expectedDoorWidth = HOUSE_DIMENSIONS.elements.common.doorWidth * expectedScale;
    const expectedWindowWidth = HOUSE_DIMENSIONS.elements.common.windowWidth * expectedScale;
    const expectedDoorShiftX = HOUSE_DIMENSIONS.elements.frontBack.doorShiftX * expectedScale;
    const expectedWindowShiftX = HOUSE_DIMENSIONS.elements.frontBack.windowShiftX * expectedScale;
    const expectedBodyWidth = HOUSE_DIMENSIONS.footprint.width * expectedScale;
    const expectedDoorX = expectedBodyWidth - expectedWindowWidth - expectedWindowShiftX - expectedDoorWidth - expectedDoorShiftX;
    const expectedDoorCenter = expectedDoorX + expectedDoorWidth / 2;
    const expectedBottomLeft = -expectedBodyWidth / 2 + expectedDoorCenter;

    expect(topMarkerBottom.left).toBe(expectedBottomLeft);
  });

  it('aplica auto contraventamento ao inserir a vista superior da casa', () => {
    const {group: topGroup, objects: topObjects} = createMockGroup({houseView: 'top'});
    initializeHouseControllerCanvas(createMockCanvas([topGroup]));
    houseController.setHouseType('tipo6');

    houseController.updatePiloti('piloti_1_1', {height: 1.0, nivel: 0.5});

    registerMockView('top', topGroup as any);

    expect(topObjects.some((object) => object?.isAutoContraventamento === true)).toBe(true);
  });

});
