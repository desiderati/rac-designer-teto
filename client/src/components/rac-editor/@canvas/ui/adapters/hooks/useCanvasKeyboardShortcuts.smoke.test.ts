import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {useCanvasKeyboardShortcuts} from './useCanvasKeyboardShortcuts.ts';

describe('atalhos do canvas', () => {
  it('preserva o Ctrl-Z do texto em edição e desfaz no canvas fora da edição', () => {
    const undo = vi.fn();
    const activeText = {type: 'i-text', isEditing: true};
    const canvas = {
      on: vi.fn(), off: vi.fn(), getActiveObject: vi.fn(() => activeText),
    } as unknown as FabricCanvas;
    const {result} = renderHook(() => useCanvasKeyboardShortcuts());
    const unbind = result.current.bindKeyboardShortcuts({
      canvas, isAnyEditorOpen: () => false, tryDelete: () => false,
      onSelectionChange: vi.fn(), copy: vi.fn(), paste: vi.fn(), undo,
    });

    try {
      act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'z', ctrlKey: true, bubbles: true})));
      expect(undo).not.toHaveBeenCalled();
      activeText.isEditing = false;
      act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'z', ctrlKey: true, bubbles: true})));
      expect(undo).toHaveBeenCalledOnce();
    } finally {
      unbind();
    }
  });
});
