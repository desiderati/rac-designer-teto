import {useEffect} from 'react';
import {render} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {FabricObject} from 'fabric';
import {useCanvasInlineEditorEvents} from '@/components/rac-editor/hooks/useCanvasInlineEditorEvents';
import type {
  CanvasPointerPayload,
  CanvasRuntimeObject,
} from '@/components/rac-editor/hooks/canvas-fabric-runtime-types';

type CanvasEventHandler = (event: unknown) => void;

function createCanvasMock() {
  const handlers: Record<string, CanvasEventHandler[]> = {};

  const canvas = {
    on: (event: string, handler: CanvasEventHandler) => {
      handlers[event] = handlers[event] || [];
      handlers[event].push(handler);
    },
    off: (event: string, handler: CanvasEventHandler) => {
      handlers[event] = (handlers[event] || []).filter((cb) => cb !== handler);
    },
    getPointer: () => ({x: 0, y: 0}),
    getObjects: () => [],
    getActiveObject: () => null,
  };

  const emit = (event: string, payload: unknown) => {
    for (const handler of handlers[event] || []) {
      handler(payload);
    }
  };

  return {canvas, emit};
}

function InlineEditorEventsHarness({
  canvas,
  onObjectNameSelect,
  onSelectionChange,
}: {
  canvas: object;
  onObjectNameSelect: (selection: {
    object: object;
    currentValue: string;
    screenPosition: {x: number; y: number};
  }) => void;
  onSelectionChange: (message: string) => void;
}) {
  const {bindInlineEditorEvents} = useCanvasInlineEditorEvents();

  useEffect(() => {
    return bindInlineEditorEvents({
      canvas: canvas as never,
      toRuntimeObject: (object: FabricObject | null | undefined) =>
        object as CanvasRuntimeObject | null,
      getEventPayload: (event: unknown) => event as CanvasPointerPayload,
      handlePilotiSelection: () => undefined,
      onDistanceSelect: () => undefined,
      onObjectNameSelect: (selection) =>
        onObjectNameSelect({
          object: selection.object,
          currentValue: selection.currentValue,
          screenPosition: selection.screenPosition,
        }),
      onLineArrowSelect: () => undefined,
      onSelectionChange,
      getCurrentScreenPoint: (canvasPoint) => ({x: canvasPoint.x, y: canvasPoint.y}),
      isEditorOpen: () => false,
    });
  }, [bindInlineEditorEvents, canvas, onObjectNameSelect, onSelectionChange]);

  return null;
}

describe('useCanvasInlineEditorEvents regression', () => {
  it('opens wall editor for grouped wall and preserves current label text', () => {
    const onObjectNameSelect = vi.fn();
    const onSelectionChange = vi.fn();
    const {canvas, emit} = createCanvasMock();

    render(
      <InlineEditorEventsHarness
        canvas={canvas}
        onObjectNameSelect={onObjectNameSelect}
        onSelectionChange={onSelectionChange}
      />,
    );

    const wallRect = {
      type: 'rect',
      myType: 'wall',
    };
    const wallLabel = {
      type: 'i-text',
      myType: 'wallLabel',
      text: 'Vizinho',
    };
    const groupedWall = {
      type: 'group',
      myType: 'wall',
      getObjects: () => [wallRect, wallLabel],
      getCenterPoint: () => ({x: 120, y: 240}),
    };

    emit('mouse:dblclick', {target: groupedWall});

    expect(onObjectNameSelect).toHaveBeenCalledWith({
      object: wallRect,
      currentValue: 'Vizinho',
      screenPosition: {x: 120, y: 240},
    });
    expect(onSelectionChange).toHaveBeenCalledWith('Editando nome do objeto.');
  });
});
