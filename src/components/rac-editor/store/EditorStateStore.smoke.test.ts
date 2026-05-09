import {describe, expect, it, vi} from 'vitest';
import type {EditorSelection} from '@/components/rac-editor/store/types.ts';
import {EditorStore} from './editor-state-store.ts';

const pilotiSelection: EditorSelection = {
  type: 'piloti',
  pilotiId: 'piloti_0_0',
  houseView: 'top',
  screenPosition: {x: 10, y: 20},
};

describe('editor-state-store.ts', () => {
  it('dispatches serializable selection commands and notifies subscribers with snapshots', () => {
    const store = new EditorStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const changed = store.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: pilotiSelection,
    });

    expect(changed).toBe(true);
    expect(store.getState()).toEqual({selection: pilotiSelection});
    expect(listener).toHaveBeenCalledWith(
      {selection: pilotiSelection},
      {selection: null},
      {type: 'SELECT_EDITOR_TARGET', selection: pilotiSelection},
    );
  });

  it('does not notify when a command keeps the observable state unchanged', () => {
    const store = new EditorStore({selection: pilotiSelection});
    const listener = vi.fn();
    store.subscribe(listener);

    const changed = store.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: pilotiSelection,
    });

    expect(changed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects runtime-shaped selections before they enter shared editor state', () => {
    const store = new EditorStore();

    expect(() => store.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: {type: 'piloti', group: {type: 'group'}} as never,
    })).toThrow(/Invalid editor selection/);
  });

  it('clears selection through an explicit command', () => {
    const store = new EditorStore({selection: pilotiSelection});

    const changed = store.dispatch({type: 'CLEAR_EDITOR_SELECTION'});

    expect(changed).toBe(true);
    expect(store.getState()).toEqual({selection: null});
  });
});
