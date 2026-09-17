import {afterEach, describe, expect, it, vi} from 'vitest';
import {installRacEditorDebugBridge} from './canvas-debug-bridge.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';

type RacDebugWindow = Window & { __racDebug?: Record<string, (...args: unknown[]) => unknown> };

describe('rac-editor-debug-bridge.ts', () => {
  afterEach(() => {
    delete (window as RacDebugWindow).__racDebug;
  });

  it('instala a API global de debug usando portas injetadas', () => {
    const topGroup = {
      getObjects: () => [
        {pilotiId: 'piloti_0_0', isPilotiCircle: true, left: 5, top: 7},
      ],
    } as unknown as CanvasGroup;
    const removeObject = vi.fn();
    const removeView = vi.fn();
    const updatePiloti = vi.fn();
    const setPilotiSelection = vi.fn();
    const setIsPilotiEditorOpen = vi.fn();
    const cleanup = installRacEditorDebugBridge({
      getCanvasHandle: () => ({
        createDebugPort: () => ({
          removeObject,
          getCanvasScreenCenter: () => ({x: 50, y: 60}),
          selectObjectByMyType: () => true,
          getActiveObjectSummary: () => null,
          getObjectsSummary: () => [],
        }),
        getGroupLocalPointScreenPosition: () => ({x: 10, y: 20}),
        getCanvasPosition: () => ({x: 1, y: 2}),
        setCanvasPosition: vi.fn(),
      } as any),
      getShowTips: () => true,
      getShowZoomControls: () => false,
      houseReadPort: {
        getPilotis: () => ({
          piloti_0_0: {height: 1.5, isMaster: false, nivel: 0},
        }),
      },
      houseWritePort: {
        removeView,
        updatePiloti,
      },
      houseSnapshot: {
        id: 'house_1',
        houseType: 'tipo6',
        terrainType: 3,
        pilotis: {},
        views: {
          top: [{instanceId: 'top_1', group: topGroup}],
          front: [],
          back: [],
          side1: [],
          side2: [],
        },
        sideMappings: {
          top: null,
          bottom: null,
          left: null,
          right: null,
        },
        preAssignedSides: {},
      },
      setPilotiSelection,
      setIsPilotiEditorOpen,
    });
    const debug = (window as RacDebugWindow).__racDebug!;

    expect(debug.getPilotiScreenPosition('piloti_0_0')).toEqual({x: 10, y: 20});
    expect(debug.openPilotiEditor('piloti_0_0')).toBe(true);
    expect(setPilotiSelection).toHaveBeenCalledWith(expect.objectContaining({
      pilotiId: 'piloti_0_0',
      screenPosition: {x: 10, y: 20},
    }));

    debug.updatePiloti('piloti_0_0', {nivel: 0.2});
    expect(updatePiloti).toHaveBeenCalledWith('piloti_0_0', {nivel: 0.2});

    expect(debug.removeView('top')).toBe(true);
    expect(removeObject).toHaveBeenCalledWith(topGroup);
    expect(removeView).toHaveBeenCalledWith('top_1');
    expect(debug.getUiState()).toEqual({showTips: true, showZoomControls: false});

    cleanup();
    expect((window as RacDebugWindow).__racDebug).toBeUndefined();
  });
});
