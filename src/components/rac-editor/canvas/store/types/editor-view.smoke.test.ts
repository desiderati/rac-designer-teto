import {describe, expect, it} from 'vitest';
import {
  isEditorViewRef,
  type EditorViewRef,
} from './editor-view.ts';

describe('editor-view.ts', () => {
  it('represents house views without carrying canvas groups', () => {
    const view: EditorViewRef = {
      viewId: 'front_1',
      viewType: 'front',
      side: 'top',
    };

    expect(isEditorViewRef(view)).toBe(true);
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
    expect('group' in view).toBe(false);
  });

  it('rejects runtime-shaped view refs', () => {
    expect(isEditorViewRef({viewId: 'front_1', viewType: 'front', group: {type: 'group'}})).toBe(false);
    expect(isEditorViewRef({viewId: 'front_1', viewType: 'invalid'})).toBe(false);
    expect(isEditorViewRef(null)).toBe(false);
  });
});
