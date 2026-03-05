import {beforeEach, describe, expect, it, vi} from 'vitest';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {FabricImage} from 'fabric';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';

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

describe('house-manager.ts', () => {
  beforeEach(() => {
    houseManager.reset();
  });

  it('creates house state for tipo6 and tipo3 with expected view limits', () => {
    houseManager.setHouseType('tipo6');

    expect(houseManager.getMaxHouseViewCount('top')).toBe(1);
    expect(houseManager.getMaxHouseViewCount('front')).toBe(1);
    expect(houseManager.getMaxHouseViewCount('back')).toBe(1);
    expect(houseManager.getMaxHouseViewCount('side1')).toBe(2);
    expect(houseManager.getMaxHouseViewCount('side2')).toBe(0);
    expect(houseManager.canAddView('side2')).toBe(false);
    expect(houseManager.getAvailableViews()).toEqual(['top', 'front', 'back', 'side1']);

    houseManager.setHouseType('tipo3');

    expect(houseManager.getMaxHouseViewCount('top')).toBe(1);
    expect(houseManager.getMaxHouseViewCount('front')).toBe(0);
    expect(houseManager.getMaxHouseViewCount('back')).toBe(2);
    expect(houseManager.getMaxHouseViewCount('side1')).toBe(1);
    expect(houseManager.getMaxHouseViewCount('side2')).toBe(1);
    expect(houseManager.canAddView('front')).toBe(false);
    expect(houseManager.getAvailableViews()).toEqual(['top', 'back', 'side1', 'side2']);
  });

  it('updates piloti data and keeps single master globally', () => {
    houseManager.setHouseType('tipo6');

    houseManager.updatePiloti('piloti_0_0', {height: 2.0, nivel: 0.5, isMaster: true});
    houseManager.updatePiloti('piloti_3_2', {isMaster: true});

    expect(houseManager.getPilotiData('piloti_3_2').isMaster).toBe(true);
    expect(houseManager.getPilotiData('piloti_0_0').isMaster).toBe(false);
    expect(houseManager.getPilotiData('piloti_0_0').height).toBe(2.0);
    expect(houseManager.getPilotiData('piloti_0_0').nivel).toBe(0.5);
  });

  it('recalcula níveis intermediários quando um nível de canto é alterado', () => {
    houseManager.setHouseType('tipo6');

    houseManager.updatePiloti('piloti_0_0', {nivel: 0.2});
    houseManager.updatePiloti('piloti_3_0', {nivel: 1.0});
    houseManager.updatePiloti('piloti_0_2', {nivel: 0.2});
    houseManager.updatePiloti('piloti_3_2', {nivel: 1.0});

    expect(houseManager.getPilotiData('piloti_1_1').nivel).toBe(0.47);
    expect(houseManager.getPilotiData('piloti_2_1').nivel).toBe(0.73);

    // A regra recalcula nível interpolado sem sobrescrever altura manual dos intermediários.
    expect(houseManager.getPilotiData('piloti_1_1').height).toBe(DEFAULT_HOUSE_PILOTI.height);
  });

  it('registers and removes views while syncing side assignments', () => {
    houseManager.setHouseType('tipo6');
    const {group} = createMockGroup();
    expect(houseManager.hasAnyView()).toBe(false);

    houseManager.registerView('front', group as any, 'top');
    expect(houseManager.getHouseViewCount('front')).toBe(1);
    expect(houseManager.hasOtherViews()).toBe(true);
    expect(houseManager.hasAnyView()).toBe(true);
    expect(houseManager.getAllGroups()).toHaveLength(1);
    expect(houseManager.getHouse()?.sideMappings.top).toBe('front');

    houseManager.removeView(group as any);
    expect(houseManager.getHouseViewCount('front')).toBe(0);
    expect(houseManager.hasAnyView()).toBe(false);
    expect(houseManager.getAllGroups()).toHaveLength(0);
    expect(houseManager.getHouse()?.sideMappings.top).toBeNull();
  });

  it('mantém tipo de terreno global e aplica para todas as vistas elevadas', () => {
    houseManager.setHouseType('tipo6');
    const {group: topGroup} = createMockGroup({houseView: 'top'});
    const {group: frontGroup} = createMockGroup({houseView: 'front'});
    const {group: sideGroup} = createMockGroup({houseView: 'side'});

    houseManager.registerView('top', topGroup as any);
    houseManager.registerView('front', frontGroup as any, 'top');
    houseManager.registerView('side1', sideGroup as any, 'left');

    const terrain = houseManager.setTerrainType(4);
    expect(terrain).toBe(4);
    expect(houseManager.getTerrainType()).toBe(4);
    expect(houseManager.getHouse()?.terrainType).toBe(4);
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
    houseManager.initialize(canvas as any);
    houseManager.setHouseType('tipo6');
    houseManager.rebuildFromCanvas();

    expect(houseManager.getHouseViewCount('top')).toBe(1);
    expect(houseManager.getHouse()?.views.top[0]?.instanceId).toBe('top_1');
    expect(houseManager.getPilotiData('piloti_0_0')).toMatchObject({
      height: 2.5,
      isMaster: true,
      nivel: 0.8,
    });
  });

  it('clears house type when rebuild finds no house groups on canvas', () => {
    const canvas = createMockCanvas([]);
    houseManager.initialize(canvas as any);
    houseManager.setHouseType('tipo6');

    houseManager.rebuildFromCanvas();

    expect(houseManager.getHouseType()).toBeNull();
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
    houseManager.initialize(canvas as any);
    houseManager.setHouseType('tipo6');

    houseManager.registerView('top', topGroup as any);
    houseManager.registerView('front', frontGroup as any, 'bottom');

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

  it('inserts 3D snapshot on canvas with centered position and bounded scale', async () => {
    const image = createMockObject({
      width: 2000,
      height: 1000,
      setControlsVisibility: vi.fn(),
    });
    const setSpy = vi.spyOn(image as any, 'set');
    const fromUrlSpy = vi.spyOn(FabricImage, 'fromURL').mockResolvedValue(image as any);

    const canvas = {
      getObjects: vi.fn(() => []),
      getVpCenter: vi.fn(() => ({x: 100, y: 120})),
      getWidth: vi.fn(() => 1000),
      getHeight: vi.fn(() => 800),
      add: vi.fn(),
      setActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
    };
    houseManager.initialize(canvas as any);

    const inserted = await houseManager.insert3DSnapshotOnCanvas('data:image/png;base64,abc');

    expect(inserted).toBe(true);
    expect(fromUrlSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        left: 100,
        top: 120,
        scaleX: 0.225,
        scaleY: 0.225,
        lockRotation: true,
      }),
    );
    expect((image as any).left).toBe(100);
    expect((image as any).top).toBe(120);
    expect((image as any).scaleX).toBe(0.225);
    expect((image as any).scaleY).toBe(0.225);
    expect((image as any).setControlsVisibility).toHaveBeenCalledWith({mtr: false});
    expect(canvas.add).toHaveBeenCalledWith(image);
    expect(canvas.setActiveObject).toHaveBeenCalledWith(image);
    expect(canvas.requestRenderAll).toHaveBeenCalled();

    fromUrlSpy.mockRestore();
  });

  it('returns false when 3D snapshot loading fails', async () => {
    const fromUrlSpy = vi.spyOn(FabricImage, 'fromURL').mockRejectedValue(new Error('load failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    });
    const canvas = {
      getObjects: vi.fn(() => []),
      getVpCenter: vi.fn(() => ({x: 0, y: 0})),
      getWidth: vi.fn(() => 1000),
      getHeight: vi.fn(() => 1000),
      add: vi.fn(),
      setActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
    };
    houseManager.initialize(canvas as any);

    const inserted = await houseManager.insert3DSnapshotOnCanvas('data:image/png;base64,abc');

    expect(inserted).toBe(false);
    expect(canvas.add).not.toHaveBeenCalled();
    expect(canvas.setActiveObject).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    fromUrlSpy.mockRestore();
  });

  it('aplica auto contraventamento ao inserir a vista superior da casa', () => {
    houseManager.setHouseType('tipo6');

    houseManager.updatePiloti('piloti_1_1', {height: 1.0, nivel: 0.5});

    const {group: topGroup, objects: topObjects} = createMockGroup({houseView: 'top'});
    houseManager.registerView('top', topGroup as any);

    expect(topObjects.some((object) => object?.isAutoContraventamento === true)).toBe(true);
  });

});
