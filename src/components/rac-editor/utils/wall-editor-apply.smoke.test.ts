import {describe, expect, it, vi} from 'vitest';
import {applyWallEditorChange} from '@/components/rac-editor/utils/wall-editor-apply';

describe('wall-editor-apply regression', () => {
  it('does not remove grouped wall when clearing name and allows editing again', () => {
    const wallState: Record<string, unknown> = {
      type: 'rect',
      myType: 'wall',
      stroke: '#111111',
    };
    const labelState: Record<string, unknown> = {
      type: 'i-text',
      myType: 'wallLabel',
      text: 'Muro A',
      fill: '#111111',
      visible: true,
    };

    const wall = {
      ...wallState,
      set: (patch: Record<string, unknown>) => Object.assign(wallState, patch),
    };
    const label = {
      ...labelState,
      set: (patch: Record<string, unknown>) => Object.assign(labelState, patch),
    };
    const group = {
      type: 'group',
      myType: 'wall',
      getObjects: () => [wall, label],
      setCoords: vi.fn(),
    };
    Object.assign(wall, {_group: group});

    const canvas = {
      remove: vi.fn(),
      add: vi.fn(),
      renderAll: vi.fn(),
      setActiveObject: vi.fn(),
    };

    applyWallEditorChange({
      canvas: canvas as never,
      wall: wall as never,
      name: '',
      color: '#e67e22',
    });

    expect(canvas.remove).not.toHaveBeenCalled();
    expect(canvas.add).not.toHaveBeenCalled();
    expect(wallState.stroke).toBe('#e67e22');
    expect(labelState.text).toBe(' ');
    expect(labelState.fill).toBe('#e67e22');
    expect(labelState.visible).toBe(true);

    applyWallEditorChange({
      canvas: canvas as never,
      wall: wall as never,
      name: 'Vizinho',
      color: '#3498db',
    });

    expect(wallState.stroke).toBe('#3498db');
    expect(labelState.text).toBe('Vizinho');
    expect(labelState.fill).toBe('#3498db');
    expect(labelState.visible).toBe(true);
  });

  it('updates grouped wall label when parent group is exposed via `group`', () => {
    const wallState: Record<string, unknown> = {
      type: 'rect',
      myType: 'wall',
      stroke: '#222222',
    };
    const labelState: Record<string, unknown> = {
      type: 'i-text',
      myType: 'wallLabel',
      text: 'Vizinho',
      fill: '#222222',
      visible: true,
      left: 0,
      top: 0,
    };

    const wall = {
      ...wallState,
      set: (patch: Record<string, unknown>) => Object.assign(wallState, patch),
      setCoords: vi.fn(),
    };
    const label = {
      ...labelState,
      set: (patch: Record<string, unknown>) => Object.assign(labelState, patch),
      setCoords: vi.fn(),
    };
    const group = {
      type: 'group',
      myType: 'wall',
      getObjects: () => [wall, label],
      setCoords: vi.fn(),
    };
    Object.assign(wall, {group});

    const canvas = {
      remove: vi.fn(),
      add: vi.fn(),
      renderAll: vi.fn(),
      setActiveObject: vi.fn(),
    };

    applyWallEditorChange({
      canvas: canvas as never,
      wall: wall as never,
      name: 'Muro Atualizado',
      color: '#e67e22',
    });

    expect(canvas.remove).not.toHaveBeenCalled();
    expect(canvas.add).not.toHaveBeenCalled();
    expect(wallState.stroke).toBe('#e67e22');
    expect(labelState.text).toBe('Muro Atualizado');
    expect(labelState.fill).toBe('#e67e22');
    expect(labelState.left).toBe(0);
    expect(labelState.top).toBe(0);
    expect(labelState.visible).toBe(true);
  });
});
