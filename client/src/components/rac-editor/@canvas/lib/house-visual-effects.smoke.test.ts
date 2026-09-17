import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {PILOTI_BASE_HEIGHT_PX} from '@/shared/constants.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import {
  refreshElevationNivelLabels,
  refreshTopSlopeIndicators,
} from '@/components/rac-editor/@canvas/lib/house-visual-effects.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';

function createCanvasObject(props: Partial<CanvasObject> = {}): CanvasObject {
  return {
    ...props,
    set(patch: Record<string, unknown>) {
      Object.assign(this, patch);
    },
    setCoords: vi.fn(),
  } as unknown as CanvasObject;
}

function createGroup(objects: CanvasObject[], houseView: string): CanvasGroup {
  const group = {
    _objects: objects,
    myType: 'house',
    houseView,
    isRightSide: false,
    getObjects() {
      return this._objects;
    },
    getCanvasObjects() {
      return this._objects;
    },
    setControlsVisibility: vi.fn(),
    setCoords: vi.fn(),
    _clearCache: vi.fn(),
    _calcBounds: vi.fn(),
  };

  return group as unknown as CanvasGroup;
}

function createPilotiRect(pilotiId: string, left: number, nivel: number): CanvasObject {
  return createCanvasObject({
    isPilotiRect: true,
    pilotiId,
    pilotiNivel: nivel,
    pilotiBaseHeight: PILOTI_BASE_HEIGHT_PX,
    left,
    top: 100,
    width: 10,
    height: 100,
  });
}

function createHouseSnapshot(topGroup: CanvasGroup, elevationGroup: CanvasGroup): HouseRuntimeSnapshot<CanvasGroup> {
  return {
    houseType: 'tipo6',
    sideMappings: {},
    pilotis: {},
    terrainType: 1,
    views: {
      top: [{instanceId: 'top_1', group: topGroup}],
      front: [{instanceId: 'front_1', group: elevationGroup}],
      back: [],
      side1: [],
      side2: [],
    },
  } as unknown as HouseRuntimeSnapshot<CanvasGroup>;
}

function createSettingsPort(autoAdjustPilotiHeightsFromNivel: boolean): SettingsPort {
  return {
    getSettings: () => ({
      ...APP_SETTINGS_DEFAULTS,
      autoAdjustPilotiHeightsFromNivel,
    }),
    updateSetting: vi.fn(),
  };
}

function getNivelLabelTexts(group: CanvasGroup): string[] {
  return group.getCanvasObjects()
    .filter((object) => object.isNivelLabel)
    .map((object) => String(object.text ?? ''));
}

describe('house-visual-effects.ts', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn((text: string) => ({
        width: text.length * 8,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
      })),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('alterna labels de nível centrais nas elevações sem alterar a vista planta', () => {
    const topGroup = createGroup([
      createCanvasObject({isPilotiNivelText: true, pilotiId: 'piloti_0_0', text: '0,20'}),
    ], 'top');
    const elevationGroup = createGroup([
      createCanvasObject({left: 0, top: 0, width: 130, height: 80}),
      createPilotiRect('piloti_0_0', 10, 0.2),
      createPilotiRect('piloti_0_1', 60, 0.3),
      createPilotiRect('piloti_0_2', 110, 0.4),
    ], 'side');
    const house = createHouseSnapshot(topGroup, elevationGroup);
    const requestRender = vi.fn();

    refreshElevationNivelLabels({
      house,
      requestRender,
      settingsPort: createSettingsPort(false),
    });

    expect(elevationGroup.showAllPilotiNivelLabels).toBe(true);
    expect(getNivelLabelTexts(elevationGroup)).toEqual(['0,20', '0,40', '0,30']);
    expect(topGroup.showAllPilotiNivelLabels).toBeUndefined();
    expect(topGroup.getCanvasObjects().filter((object) => object.isNivelLabel)).toHaveLength(0);

    refreshElevationNivelLabels({
      house,
      requestRender,
      settingsPort: createSettingsPort(true),
    });

    expect(elevationGroup.showAllPilotiNivelLabels).toBe(false);
    expect(getNivelLabelTexts(elevationGroup)).toEqual(['0,20', '0,40']);
    expect(topGroup.showAllPilotiNivelLabels).toBeUndefined();
    expect(requestRender).toHaveBeenCalledTimes(2);
  });

  it('sincroniza a seta de desnível em vista planta já carregada', () => {
    const topGroup = createGroup([
      createCanvasObject({isHouseBody: true, width: 160, height: 90}),
      createPilotiCircle('piloti_0_0', -60, -30, 0.2),
      createPilotiCircle('piloti_3_0', 60, -30, 0.5),
      createPilotiCircle('piloti_0_2', -60, 30, 0.6),
      createPilotiCircle('piloti_3_2', 60, 30, 0.9),
    ], 'top');
    const elevationGroup = createGroup([], 'side');
    const house = createHouseSnapshot(topGroup, elevationGroup);
    const requestRender = vi.fn();

    refreshTopSlopeIndicators({house, requestRender});

    const slopeObjects = topGroup.getCanvasObjects().filter((object) => object.isTopSlopeIndicator);
    expect(slopeObjects).toHaveLength(2);
    expect(slopeObjects[0].isTopSlopeIndicatorText).toBeUndefined();
    expect(slopeObjects[1].text).toBe('Desnível 0,70 m');
    expect(requestRender).toHaveBeenCalledOnce();
  });
});

function createPilotiCircle(pilotiId: string, left: number, top: number, nivel: number): CanvasObject {
  return createCanvasObject({
    isPilotiCircle: true,
    pilotiId,
    pilotiNivel: nivel,
    left,
    top,
  });
}
