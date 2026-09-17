import {describe, expect, it} from 'vitest';
import {
  isEditorContraventamentoDraft,
  type EditorContraventamentoDraft,
} from './editor-contraventamento.ts';

describe('editor-contraventamento.ts', () => {
  it('describes contraventamento selection intent without canvas runtime objects', () => {
    const draft: EditorContraventamentoDraft = {
      viewId: 'top_1',
      side: 'left',
      originPilotiId: 'piloti_0_0',
      destinationPilotiId: 'piloti_0_2',
      column: 0,
    };

    expect(isEditorContraventamentoDraft(draft)).toBe(true);
    expect(JSON.parse(JSON.stringify(draft))).toEqual(draft);
    expect('group' in draft).toBe(false);
  });

  it('allows pending destination but rejects invalid runtime-shaped drafts', () => {
    expect(isEditorContraventamentoDraft({
      viewId: 'top_1',
      side: 'right',
      originPilotiId: 'piloti_1_0',
      destinationPilotiId: null,
      column: 1,
    })).toBe(true);
    expect(isEditorContraventamentoDraft({viewId: 'top_1', side: 'left', group: {}})).toBe(false);
    expect(isEditorContraventamentoDraft({viewId: 'top_1', side: 'middle'})).toBe(false);
  });

  it('describes horizontal contraventamento draft by row', () => {
    expect(isEditorContraventamentoDraft({
      viewId: 'top_1',
      side: 'bottom',
      originPilotiId: 'piloti_0_1',
      destinationPilotiId: null,
      row: 1,
    })).toBe(true);

    expect(isEditorContraventamentoDraft({
      viewId: 'top_1',
      side: 'bottom',
      originPilotiId: 'piloti_0_1',
      destinationPilotiId: null,
      column: 0,
    })).toBe(false);
  });
});
