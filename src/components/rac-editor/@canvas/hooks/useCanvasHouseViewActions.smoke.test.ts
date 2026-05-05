import {act, renderHook} from '@testing-library/react';
import type {RefObject} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCanvasHouseViewActions} from './useCanvasHouseViewActions.ts';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const HOUSE_INITIAL_EVENT = 'rac:house-initial-views-inserted';

function createCanvasObject(patch: Partial<CanvasObject>): CanvasObject {
  return {
    setCoords: vi.fn(),
    scaleX: 1,
    scaleY: 1,
    ...patch,
  } as CanvasObject;
}

function createGroup(params: {
  height: number;
  bounds: {left: number; top: number; width: number; height: number};
  objects: CanvasObject[];
}): CanvasGroup {
  const group = {
    type: 'group',
    height: params.height,
    scaleY: 1,
    left: 0,
    top: 0,
    set: vi.fn((patch: Record<string, unknown>) => Object.assign(group, patch)),
    setCoords: vi.fn(),
    getBoundingRect: vi.fn(() => params.bounds),
    getCanvasObjects: vi.fn(() => params.objects),
  };

  return group as unknown as CanvasGroup;
}

function createHouseReadPort(): HouseReadPort {
  return {
    getFamilyName: vi.fn(() => 'Familia'),
    getCurrentHouseType: vi.fn(() => 'tipo6'),
    getTerrainType: vi.fn(() => 1),
    getViewCount: vi.fn(() => ({current: 0, max: 1})),
    canDeleteTopView: vi.fn(() => true),
    isViewAtLimit: vi.fn(() => false),
    getPreAssignedSides: vi.fn(() => []),
    getAvailableSides: vi.fn(() => ['top', 'bottom']),
    hasPreAssignedSides: vi.fn(() => false),
    getPilotis: vi.fn(() => ({
      piloti_0_0: {height: 1, isMaster: true, nivel: 0.2},
    })),
    getSelectedPilotiHeights: vi.fn(() => [1, 1.5]),
    getPilotiData: vi.fn(() => ({height: 1, isMaster: true, nivel: 0.2})),
  } as unknown as HouseReadPort;
}

function createHouseWritePort(): HouseWritePort {
  return {
    applyHouseSetup: vi.fn(),
    renameFamily: vi.fn(),
    setHouseType: vi.fn(),
    refreshAutoStairsForCurrentSettings: vi.fn(),
    resetHouse: vi.fn(),
    setTerrainType: vi.fn((terrainType: number) => terrainType),
    removeView: vi.fn(),
    registerView: vi.fn((request) => ({
      ...request,
      registeredTopView: request.viewType === 'top',
    })),
    autoAssignAllSides: vi.fn(),
    updatePiloti: vi.fn((_pilotiId, patch) => ({
      height: 1,
      isMaster: Boolean(patch.isMaster),
      nivel: patch.nivel ?? 0.2,
    })),
    calculateAndApplyRecommendedHeights: vi.fn(),
  } as unknown as HouseWritePort;
}

describe('useCanvasHouseViewActions house insertion events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches a two-target event after inserting the initial house views', () => {
    const listener = vi.fn();
    const masterCircle = createCanvasObject({
      pilotiId: 'piloti_0_0',
      pilotiIsMaster: true,
      isPilotiCircle: true,
      left: 30,
      top: 40,
      width: 16,
      height: 16,
      originX: 'center',
      originY: 'center',
    });
    const masterNivel = createCanvasObject({
      pilotiId: 'piloti_0_0',
      isPilotiNivelText: true,
      left: 30,
      top: 20,
      width: 80,
      height: 12,
      originX: 'center',
      originY: 'center',
    });
    const plantGroup = createGroup({
      height: 100,
      bounds: {left: 100, top: 100, width: 320, height: 100},
      objects: [masterCircle, masterNivel],
    });
    const elevationGroup = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn()
          .mockReturnValueOnce(plantGroup)
          .mockReturnValueOnce(elevationGroup),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
        getGroupLocalPointScreenPosition: vi.fn((group: CanvasGroup, point) => ({
          x: (group.left ?? 0) + point.x,
          y: (group.top ?? 0) + point.y,
        })),
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas: vi.fn(() => true),
      houseReadPort: createHouseReadPort(),
      houseWritePort: createHouseWritePort(),
      pendingViewType: 'front',
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: 'top',
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    document.addEventListener(HOUSE_INITIAL_EVENT, listener as EventListener);

    try {
      act(() => {
        result.result.current.handleNiveisApplied({
          piloti_0_0: {nivel: 0.2, isMaster: true},
        });
      });
      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.kind).toBe('house-initial-views');
      expect(event.detail.targets['house-top-view']).toEqual({
        left: 100,
        top: 100,
        width: 320,
        height: 100,
      });
      expect(event.detail.targets['house-elevation-view']).toEqual({
        left: 160,
        top: 250,
        width: 360,
        height: 260,
      });
    } finally {
      document.removeEventListener(HOUSE_INITIAL_EVENT, listener as EventListener);
    }
  });
});
