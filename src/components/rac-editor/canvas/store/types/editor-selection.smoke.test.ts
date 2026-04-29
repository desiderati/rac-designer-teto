import {describe, expect, it} from 'vitest';
import {
  EDITOR_SELECTION_KINDS,
  isEditorSelection,
  type EditorSelection,
} from './editor-selection.ts';

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('editor-selection.ts', () => {
  it('keeps editor selection contracts serializable and independent from Fabric runtime objects', () => {
    const selections: EditorSelection[] = [
      {
        type: 'piloti',
        pilotiId: 'piloti_0_0',
        houseView: 'top',
        screenPosition: {x: 10, y: 20},
      },
      {
        type: 'wall',
        objectId: 'wall_1',
        currentLabel: '',
        screenPosition: {x: 30, y: 40},
      },
      {
        type: 'linear',
        objectId: 'line_1',
        linearType: 'line',
        currentLabel: '',
        currentColor: '#000000',
        screenPosition: {x: 50, y: 60},
      },
      {
        type: 'terrain',
        viewId: 'front_1',
        terrainType: 4,
        screenPosition: {x: 70, y: 80},
      },
      {
        type: 'contraventamento',
        viewId: 'top_1',
        contraventamentoId: 'contraventamento_1',
        side: 'left',
      },
    ];

    expect(EDITOR_SELECTION_KINDS).toEqual([
      'piloti',
      'wall',
      'linear',
      'terrain',
      'contraventamento',
    ]);

    selections.forEach((selection) => {
      const parsed = roundTrip(selection);
      expect(parsed).toEqual(selection);
      expect(isEditorSelection(parsed)).toBe(true);
      expect('group' in parsed).toBe(false);
      expect('canvas' in parsed).toBe(false);
    });
  });

  it('rejects null, unknown selection types and runtime-shaped objects', () => {
    expect(isEditorSelection(null)).toBe(false);
    expect(isEditorSelection({type: 'unknown'})).toBe(false);
    expect(isEditorSelection({type: 'piloti', group: {type: 'group'}})).toBe(false);
    expect(isEditorSelection({type: 'wall', canvas: {}})).toBe(false);
  });
});
