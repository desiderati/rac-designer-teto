import {describe, expect, it, vi} from 'vitest';
import {applyLineArrowEditorChange} from '@/components/rac-editor/utils/line-arrow-editor-apply';

describe('line-arrow-editor-apply regression', () => {
  it('keeps grouped line object on canvas when clearing label', () => {
    const labelState: Record<string, unknown> = {
      myType: 'lineArrowLabel',
      text: 'Linha A',
      fill: '#111111',
      visible: true,
    };
    const lineState: Record<string, unknown> = {
      type: 'line',
      stroke: '#111111',
    };

    const label = {
      ...labelState,
      set: (patch: Record<string, unknown>) => Object.assign(labelState, patch),
    };
    const line = {
      ...lineState,
      set: (patch: Record<string, unknown>) => Object.assign(lineState, patch),
    };
    const group = {
      type: 'group',
      myType: 'line',
      getObjects: () => [line, label],
      setCoords: vi.fn(),
    };
    const canvas = {
      remove: vi.fn(),
      add: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    applyLineArrowEditorChange({
      canvas: canvas as never,
      object: group as never,
      myType: 'line',
      color: '#22c55e',
      label: '',
    });

    expect(lineState.stroke).toBe('#22c55e');
    expect(labelState.text).toBe(' ');
    expect(labelState.fill).toBe('#22c55e');
    expect(labelState.visible).toBe(true);
    expect(canvas.remove).not.toHaveBeenCalled();
    expect(canvas.add).not.toHaveBeenCalled();
  });
});
