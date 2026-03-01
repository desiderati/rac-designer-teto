import {describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useCanvasSelectionActions} from './useCanvasSelectionActions.ts';
import {TERRAIN_STYLE} from '@/shared/config.ts';

type MockCanvasObject = {
  type?: string;
  myType?: string;
  houseView?: string;
  fill?: string;
  stroke?: string;
  isGroundFill?: boolean;
  isGroundLine?: boolean;
  isNivelMarker?: boolean;
  isNivelLabel?: boolean;
  isTerrainRachao?: boolean;
  isTerrainSideGravel?: boolean;
  dirty?: boolean;
  set: (patch: Record<string, unknown>) => void;
  getObjects?: () => MockCanvasObject[];
  setCoords?: () => void;
};

function createCanvasObject(initial: Partial<MockCanvasObject>): MockCanvasObject {
  const state: MockCanvasObject = {
    ...initial,
    set(patch: Record<string, unknown>) {
      Object.assign(state, patch);
    },
  };

  return state;
}

describe('useCanvasSelectionActions', () => {
  it('highlights terrain when an elevation house group is selected', () => {
    const groundFill = createCanvasObject({
      isGroundFill: true,
      isTerrainRachao: false,
      isTerrainSideGravel: false,
    });
    const groundLine = createCanvasObject({isGroundLine: true});
    const nivelMarker = createCanvasObject({isNivelMarker: true});
    const nivelLabel = createCanvasObject({isNivelLabel: true});

    const selectedHouseGroup = createCanvasObject({
      type: 'group',
      myType: 'house',
      houseView: 'front',
      getObjects: () => [groundFill, groundLine, nivelMarker, nivelLabel],
      setCoords: () => undefined,
    });

    const handlers: Record<string, (() => void) | undefined> = {};
    const onSelectionChange = vi.fn();
    const clearPilotiSelection = vi.fn();

    const canvas = {
      getObjects: () => [selectedHouseGroup],
      on: (event: string, handler: () => void) => {
        handlers[event] = handler;
      },
      renderAll: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const {result} = renderHook(() => useCanvasSelectionActions());
    result.current.bindSelectionActions({
      canvas: canvas as any,
      onSelectionChange,
      clearPilotiSelection,
      isAnyEditorOpen: () => false,
      isContraventamentoMode: () => false,
    });

    act(() => {
      handlers['selection:created']?.();
    });

    expect(groundFill.fill).toBe(TERRAIN_STYLE.selectedFillColor);
    expect(groundLine.stroke).toBe(TERRAIN_STYLE.selectedStrokeColor);
    expect(nivelMarker.stroke).toBe(TERRAIN_STYLE.selectedStrokeColor);
    expect(nivelLabel.fill).toBe(TERRAIN_STYLE.selectedStrokeColor);
    expect(clearPilotiSelection).toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalled();
  });
});

