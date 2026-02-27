import {describe, expect, it} from 'vitest';
import {reducer} from './use-toast.ts';

describe('use-toast reducer', () => {
  it('adds, updates and removes toasts', () => {
    const initial = {toasts: []};
    const added = reducer(initial, {
      type: 'ADD_TOAST',
      toast: {id: '1', open: true},
    } as any);
    expect(added.toasts).toHaveLength(1);

    const updated = reducer(added, {
      type: 'UPDATE_TOAST',
      toast: {id: '1', title: 'Atualizado'},
    } as any);
    expect(updated.toasts[0]?.title).toBe('Atualizado');

    const removed = reducer(updated, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    } as any);
    expect(removed.toasts).toHaveLength(0);
  });
});
