import {ReactNode} from 'react';
import {renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {EditorStoreProvider} from '@/bootstrap/editor-context.tsx';

function wrapper({children}: { children: ReactNode }) {
  return <EditorStoreProvider>{children}</EditorStoreProvider>;
}

describe('editor-context.tsx', () => {
  it('provides a stable editor store instance', () => {
    const {result, rerender} = renderHook(() => useEditorStore(), {wrapper});
    const first = result.current;

    first.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: {
        type: 'piloti',
        pilotiId: 'piloti_0_0',
        houseView: 'top',
        screenPosition: {x: 1, y: 2},
      },
    });
    rerender();

    expect(result.current).toBe(first);
    expect(result.current.getState().selection?.type).toBe('piloti');
  });

  it('fails fast when the editor store hook is used outside the provider', () => {
    const {result} = renderHook(() => {
      try {
        return useEditorStore();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });
});
