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

const houseStoreMocks = vi.hoisted(() => ({
  emitHouseStoreChange: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/rac-editor/lib/house-store.ts', () => ({
  useHouseStoreEmitter: () => houseStoreMocks.emitHouseStoreChange,
}));

const HOUSE_INITIAL_EVENT = 'rac:house-top-view-inserted';
const HOUSE_ELEVATION_EVENT = 'rac:house-elevation-view-inserted';

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
    applyPilotisSetup: vi.fn(),
    renameFamily: vi.fn(),
    setHouseType: vi.fn(),
    refreshAutoStairsForCurrentSettings: vi.fn(),
    refreshAutoContraventamentoForCurrentHouse: vi.fn(),
    refreshTopDoorMarkersForCurrentHouse: vi.fn(),
    refreshHouseViewReferenceMarkersForCurrentHouse: vi.fn(),
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
    applyInitialPilotiNiveis: vi.fn(),
    calculateAndApplyRecommendedHeights: vi.fn(),
  } as unknown as HouseWritePort;
}

describe('useCanvasHouseViewActions house insertion events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    houseStoreMocks.emitHouseStoreChange.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches a top-view event after inserting the initial house', () => {
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
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn()
          .mockReturnValueOnce(plantGroup),
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
      onHouseDrawingChange: vi.fn(),
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
      expect(event.detail.kind).toBe('house-top-view-inserted');
      expect(event.detail.targets['house-top-view']).toEqual({
        left: 100,
        top: 100,
        width: 320,
        height: 100,
      });
      expect(event.detail.targets['house-top-view-piloti']).toEqual({
        left: 22,
        top: 32,
        width: 16,
        height: 16,
      });
      expect(event.detail.targets['house-elevation-view']).toBeUndefined();
      expect(canvasRef.current.createHouseViewGroup).toHaveBeenCalledTimes(1);
      expect(canvasRef.current.createHouseViewGroup).toHaveBeenCalledWith(expect.objectContaining({
        viewType: 'top',
      }));
    } finally {
      document.removeEventListener(HOUSE_INITIAL_EVENT, listener as EventListener);
    }
  });

  it('persiste o desenho depois que a vista inicial é registrada no estado lógico', () => {
    const plantGroup = createGroup({
      height: 100,
      bounds: {left: 100, top: 100, width: 320, height: 100},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn()
          .mockReturnValueOnce(plantGroup),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const houseWritePort = createHouseWritePort();
    const onHouseDrawingChange = vi.fn();
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas: vi.fn(() => true),
      onHouseDrawingChange,
      houseReadPort: createHouseReadPort(),
      houseWritePort,
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

    act(() => {
      result.result.current.handleNiveisApplied({
        piloti_0_0: {nivel: 0.2, isMaster: true},
      });
    });

    const registerView = vi.mocked(houseWritePort.registerView);

    expect(registerView).toHaveBeenCalledTimes(1);
    expect(onHouseDrawingChange).toHaveBeenCalledTimes(1);
    expect(registerView.mock.invocationCallOrder[0])
      .toBeLessThan(onHouseDrawingChange.mock.invocationCallOrder[0]);
  });

  it('dispara o guided tour de vista elevada apenas na primeira inserção', () => {
    const listener = vi.fn();
    const group = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn(() => group),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
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
      onHouseDrawingChange: vi.fn(),
      houseReadPort: createHouseReadPort(),
      houseWritePort: createHouseWritePort(),
      pendingViewType: null,
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: null,
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    document.addEventListener(HOUSE_ELEVATION_EVENT, listener as EventListener);

    try {
      act(() => {
        result.result.current.addViewToCanvas('front', 'top');
      });
      act(() => {
        result.result.current.addViewToCanvas('front', 'top');
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.kind).toBe('house-elevation-view-inserted');
      expect(event.detail.targets['house-elevation-view']).toEqual({
        left: 160,
        top: 250,
        width: 360,
        height: 260,
      });
    } finally {
      document.removeEventListener(HOUSE_ELEVATION_EVENT, listener as EventListener);
    }
  });

  it('registra a vista antes de inseri-la no canvas para o autosave observar estado lógico atual', () => {
    const group = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn(() => group),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const houseWritePort = createHouseWritePort();
    const addObjectToCanvas = vi.fn(() => true);
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas,
      onHouseDrawingChange: vi.fn(),
      houseReadPort: createHouseReadPort(),
      houseWritePort,
      pendingViewType: null,
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: null,
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    act(() => {
      result.result.current.addViewToCanvas('front', 'top');
    });

    const registerView = vi.mocked(houseWritePort.registerView);
    const refreshAutoContraventamento =
      vi.mocked(houseWritePort.refreshAutoContraventamentoForCurrentHouse);
    const refreshTopDoorMarkers =
      vi.mocked(houseWritePort.refreshTopDoorMarkersForCurrentHouse);
    const refreshReferenceMarkers =
      vi.mocked(houseWritePort.refreshHouseViewReferenceMarkersForCurrentHouse);

    expect(registerView).toHaveBeenCalledTimes(1);
    expect(addObjectToCanvas).toHaveBeenCalledTimes(1);
    expect(refreshTopDoorMarkers).toHaveBeenCalledTimes(1);
    expect(refreshAutoContraventamento).toHaveBeenCalledTimes(1);
    expect(refreshReferenceMarkers).toHaveBeenCalledTimes(1);
    expect(registerView.mock.invocationCallOrder[0])
      .toBeLessThan(addObjectToCanvas.mock.invocationCallOrder[0]);
    expect(addObjectToCanvas.mock.invocationCallOrder[0])
      .toBeLessThan(refreshTopDoorMarkers.mock.invocationCallOrder[0]);
    expect(refreshTopDoorMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshReferenceMarkers.mock.invocationCallOrder[0]);
    expect(refreshReferenceMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshAutoContraventamento.mock.invocationCallOrder[0]);
  });

  it('recalcula efeitos derivados da planta depois que a vista entra no canvas', () => {
    const group = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn(() => group),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const houseWritePort = createHouseWritePort();
    const addObjectToCanvas = vi.fn(() => true);
    const onHouseDrawingChange = vi.fn();
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas,
      onHouseDrawingChange,
      houseReadPort: createHouseReadPort(),
      houseWritePort,
      pendingViewType: null,
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: null,
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    act(() => {
      result.result.current.addViewToCanvas('top');
    });

    const registerView = vi.mocked(houseWritePort.registerView);
    const refreshAutoContraventamento =
      vi.mocked(houseWritePort.refreshAutoContraventamentoForCurrentHouse);
    const refreshTopDoorMarkers =
      vi.mocked(houseWritePort.refreshTopDoorMarkersForCurrentHouse);
    const refreshReferenceMarkers =
      vi.mocked(houseWritePort.refreshHouseViewReferenceMarkersForCurrentHouse);

    expect(registerView).toHaveBeenCalledTimes(1);
    expect(addObjectToCanvas).toHaveBeenCalledTimes(1);
    expect(refreshTopDoorMarkers).toHaveBeenCalledTimes(1);
    expect(refreshAutoContraventamento).toHaveBeenCalledTimes(1);
    expect(refreshReferenceMarkers).toHaveBeenCalledTimes(1);
    expect(onHouseDrawingChange).toHaveBeenCalledTimes(1);
    expect(registerView.mock.invocationCallOrder[0])
      .toBeLessThan(addObjectToCanvas.mock.invocationCallOrder[0]);
    expect(addObjectToCanvas.mock.invocationCallOrder[0])
      .toBeLessThan(refreshTopDoorMarkers.mock.invocationCallOrder[0]);
    expect(refreshTopDoorMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshReferenceMarkers.mock.invocationCallOrder[0]);
    expect(refreshReferenceMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshAutoContraventamento.mock.invocationCallOrder[0]);
    expect(refreshAutoContraventamento.mock.invocationCallOrder[0])
      .toBeLessThan(onHouseDrawingChange.mock.invocationCallOrder[0]);
    expect(refreshReferenceMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(onHouseDrawingChange.mock.invocationCallOrder[0]);
  });

  it('reemite snapshot visual fresco antes de concluir a inserção da vista', () => {
    const group = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const canvasRef = {
      current: {
        createHouseViewGroup: vi.fn(() => group),
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const houseWritePort = createHouseWritePort();
    const addObjectToCanvas = vi.fn(() => true);
    const onHouseDrawingChange = vi.fn();
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas,
      onHouseDrawingChange,
      houseReadPort: createHouseReadPort(),
      houseWritePort,
      pendingViewType: null,
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: null,
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    act(() => {
      result.result.current.addViewToCanvas('front', 'top');
    });

    const refreshAutoContraventamento =
      vi.mocked(houseWritePort.refreshAutoContraventamentoForCurrentHouse);
    const refreshTopDoorMarkers =
      vi.mocked(houseWritePort.refreshTopDoorMarkersForCurrentHouse);
    const refreshReferenceMarkers =
      vi.mocked(houseWritePort.refreshHouseViewReferenceMarkersForCurrentHouse);

    expect(houseStoreMocks.emitHouseStoreChange).toHaveBeenCalledTimes(1);
    expect(addObjectToCanvas.mock.invocationCallOrder[0])
      .toBeLessThan(refreshTopDoorMarkers.mock.invocationCallOrder[0]);
    expect(refreshTopDoorMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshReferenceMarkers.mock.invocationCallOrder[0]);
    expect(refreshReferenceMarkers.mock.invocationCallOrder[0])
      .toBeLessThan(refreshAutoContraventamento.mock.invocationCallOrder[0]);
    expect(refreshAutoContraventamento.mock.invocationCallOrder[0])
      .toBeLessThan(houseStoreMocks.emitHouseStoreChange.mock.invocationCallOrder[0]);
    expect(houseStoreMocks.emitHouseStoreChange.mock.invocationCallOrder[0])
      .toBeLessThan(onHouseDrawingChange.mock.invocationCallOrder[0]);
  });

  it('aplica níveis iniciais por comando automático dedicado antes de inserir as vistas', () => {
    const plantGroup = createGroup({
      height: 100,
      bounds: {left: 100, top: 100, width: 320, height: 100},
      objects: [],
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
      },
    } as unknown as RefObject<
      CanvasObjectCreationHandle
      & CanvasRenderHandle
      & CanvasScreenProjectionHandle
    >;
    const houseWritePort = createHouseWritePort();
    const addObjectToCanvas = vi.fn(() => true);
    const result = renderHook(() => useCanvasHouseViewActions({
      canvasRef,
      getVisibleCenter: () => ({x: 300, y: 300}),
      closeAllMenus: vi.fn(),
      addObjectToCanvas,
      onHouseDrawingChange: vi.fn(),
      houseReadPort: createHouseReadPort(),
      houseWritePort,
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

    const niveis = {
      piloti_0_0: {nivel: 0.45, isMaster: true},
      piloti_3_0: {nivel: 0.95, isMaster: false},
      piloti_0_2: {nivel: 1.11, isMaster: false},
      piloti_3_2: {nivel: 1.45, isMaster: false},
    };

    act(() => {
      result.result.current.handleNiveisApplied(niveis);
    });

    const applyInitialPilotiNiveis = vi.mocked(houseWritePort.applyInitialPilotiNiveis);

    expect(applyInitialPilotiNiveis).toHaveBeenCalledWith(niveis);
    expect(houseWritePort.updatePiloti).not.toHaveBeenCalled();
    expect(houseWritePort.calculateAndApplyRecommendedHeights).not.toHaveBeenCalled();
    expect(canvasRef.current.createHouseViewGroup).toHaveBeenCalledTimes(1);
    expect(canvasRef.current.createHouseViewGroup).toHaveBeenCalledWith(expect.objectContaining({
      viewType: 'top',
    }));
    expect(applyInitialPilotiNiveis.mock.invocationCallOrder[0])
      .toBeLessThan(addObjectToCanvas.mock.invocationCallOrder[0]);
  });

  it('repassa o modo manual para a criação visual da vista elevada', () => {
    const group = createGroup({
      height: 200,
      bounds: {left: 160, top: 250, width: 360, height: 260},
      objects: [],
    });
    const createHouseViewGroup = vi.fn(() => group);
    const canvasRef = {
      current: {
        createHouseViewGroup,
        renderAll: vi.fn(),
        getCanvasPointScreenPosition: vi.fn((point) => point),
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
      onHouseDrawingChange: vi.fn(),
      houseReadPort: createHouseReadPort(),
      houseWritePort: createHouseWritePort(),
      pendingViewType: null,
      setPendingViewType: vi.fn(),
      sideSelectorMode: 'position',
      setSideSelectorMode: vi.fn(),
      setHouseSideSlots: vi.fn(),
      pendingNivelSide: null,
      setPendingNivelSide: vi.fn(),
      niveisAppliedRef: {current: false},
      transitionToNivelRef: {current: false},
      shouldShowAllElevationNivelLabels: () => true,
      setSideSelectorOpen: vi.fn(),
      setNivelDefinitionOpen: vi.fn(),
    }));

    act(() => {
      result.result.current.addViewToCanvas('front', 'top');
    });

    expect(createHouseViewGroup).toHaveBeenCalledWith(expect.objectContaining({
      viewType: 'front',
      showAllElevationNivelLabels: true,
    }));
  });
});
