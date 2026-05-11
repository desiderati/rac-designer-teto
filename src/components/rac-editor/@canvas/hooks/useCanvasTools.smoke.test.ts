import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {RefObject} from 'react';
import {useCanvasTools} from './useCanvasTools.ts';
import type {CanvasObject, ElementStrategyKey} from '@/components/rac-editor/@canvas/lib';
import type {CanvasDrawingModeHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {EditorScreenPoint} from '@/components/rac-editor/store/types.ts';

const INSERTED_EVENT = 'rac:canvas-object-inserted';

function createCanvasObject(
  bounds: {left: number; top: number; width: number; height: number} = {left: 10, top: 20, width: 30, height: 40},
  center: EditorScreenPoint = {x: 25, y: 40},
): CanvasObject {
  return {
    setCoords: vi.fn(),
    getBoundingRect: vi.fn(() => bounds),
    getCenterPoint: vi.fn(() => center),
  } as unknown as CanvasObject;
}

function renderCanvasTools(
  object: CanvasObject,
  constructionSite: (point: EditorScreenPoint) => EditorScreenPoint | null = (point) => ({
    x: point.x + 100,
    y: point.y + 200,
  }),
) {
  const canvasRef = {
    current: {
      createElementObject: vi.fn((_kind: ElementStrategyKey) => object),
      createHouseViewGroup: vi.fn(),
      addObjectAtVisibleCenter: vi.fn(),
      getCanvasPointScreenPosition: vi.fn(constructionSite),
      getGroupLocalPointScreenPosition: vi.fn(),
      setDrawingModeEnabled: vi.fn(),
    },
  } as unknown as RefObject<
    CanvasDrawingModeHandle
    & CanvasObjectCreationHandle
    & CanvasScreenProjectionHandle
  >;
  const addObjectToCanvas = vi.fn(() => true);
  const {result} = renderHook(() => useCanvasTools({
    canvasRef,
    addObjectToCanvas,
    closeAllMenus: vi.fn(),
    disableDrawingMode: vi.fn(),
    isDrawing: false,
    setIsDrawing: vi.fn(),
    setInfoMessage: vi.fn(),
  }));

  return {result, addObjectToCanvas};
}

describe('useCanvasTools guided tour events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches a canvas object event with the inserted line screen rect', () => {
    const listener = vi.fn();
    const {result} = renderCanvasTools(createCanvasObject());
    document.addEventListener(INSERTED_EVENT, listener as EventListener);

    try {
      act(() => {
        result.current.handleAddLine();
      });
      expect(listener).not.toHaveBeenCalled();

      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        kind: 'line',
        rect: {left: 110, top: 220, width: 30, height: 40},
      });
    } finally {
      document.removeEventListener(INSERTED_EVENT, listener as EventListener);
    }
  });

  it('uses a centered fallback rect when the object bounds are not projectable', () => {
    const listener = vi.fn();
    const object = createCanvasObject({left: 10, top: 20, width: 0, height: 0}, {x: 35, y: 55});
    const constructionSite = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({x: 300, y: 400});
    const {result} = renderCanvasTools(object, constructionSite);
    document.addEventListener(INSERTED_EVENT, listener as EventListener);

    try {
      act(() => {
        result.current.handleAddWall();
      });
      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        kind: 'wall',
        rect: {left: 276, top: 376, width: 48, height: 48},
      });
    } finally {
      document.removeEventListener(INSERTED_EVENT, listener as EventListener);
    }
  });

  it('does not dispatch guided-tour events for non-tip object kinds', () => {
    const listener = vi.fn();
    const {result} = renderCanvasTools(createCanvasObject());
    document.addEventListener(INSERTED_EVENT, listener as EventListener);

    try {
      act(() => {
        result.current.handleAddText();
      });
      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(listener).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener(INSERTED_EVENT, listener as EventListener);
    }
  });
});
