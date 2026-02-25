import {useEffect} from 'react';
import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {FabricObject} from 'fabric';
import {useCanvasKeyboardShortcuts} from '@/components/rac-editor/canvas/hooks/useCanvasKeyboardShortcuts.ts';

type CanvasEventHandler = (event: {target?: FabricObject | null}) => void;

function createCanvasMock() {
  const handlers: Record<string, CanvasEventHandler[]> = {};

  // noinspection JSUnusedGlobalSymbols
  const canvas = {
    on: (event: string, handler: CanvasEventHandler) => {
      handlers[event] = handlers[event] || [];
      handlers[event].push(handler);
    },
    off: (event: string, handler: CanvasEventHandler) => {
      handlers[event] = (handlers[event] || []).filter((cb) => cb !== handler);
    },
    getActiveObject: () => null,
    getActiveObjects: () => [],
    discardActiveObject: () => undefined,
    remove: () => undefined,
  };

  const emit = (event: string, payload: {target?: FabricObject | null}) => {
    for (const handler of handlers[event] || []) {
      handler(payload);
    }
  };

  return {canvas, emit};
}

function KeyboardShortcutsHarness({canvas}: {canvas: object}) {
  const {bindKeyboardShortcuts} = useCanvasKeyboardShortcuts();

  useEffect(() => {
    return bindKeyboardShortcuts({
      canvas: canvas as never,
      isAnyEditorOpen: () => false,
      tryDelete: () => false,
      onSelectionChange: () => undefined,
      copy: () => undefined,
      paste: () => undefined,
      undo: () => undefined,
    });
  }, [bindKeyboardShortcuts, canvas]);

  return null;
}

describe('useCanvasKeyboardShortcuts regression', () => {
  it('snaps line rotation to orthogonal angles', () => {
    const {canvas, emit} = createCanvasMock();
    render(<KeyboardShortcutsHarness canvas={canvas}/>);

    const lineObject = {angle: 88} as FabricObject;
    emit('object:rotating', {target: lineObject});
    expect(lineObject.angle).toBe(90);

    lineObject.angle = 181;
    emit('object:rotating', {target: lineObject});
    expect(lineObject.angle).toBe(180);
  });
});
