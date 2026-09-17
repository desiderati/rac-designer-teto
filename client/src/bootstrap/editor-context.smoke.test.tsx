import {ReactNode} from 'react';
import {renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {createEditorPorts, useEditorPorts, useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';

function wrapper({children}: { children: ReactNode }) {
  return <RacEditorStoreProvider>{children}</RacEditorStoreProvider>;
}

function createStorageForPorts() {
  return {
    read: vi.fn(() => ({version: 1, constructionSites: []})),
    write: vi.fn(),
  };
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

  it('provides a stable editor ports instance', () => {
    const ports = createEditorPorts({
      constructionSiteSessionStorage: createStorageForPorts(),
    });
    const wrapper = ({children}: { children: ReactNode }) => (
      <RacEditorStoreProvider ports={ports}>{children}</RacEditorStoreProvider>
    );
    const {result, rerender} = renderHook(() => useEditorPorts(), {wrapper});

    expect(result.current).toBe(ports);
    rerender();
    expect(result.current).toBe(ports);
  });

  it('fails fast when the editor ports hook is used outside the provider', () => {
    const {result} = renderHook(() => {
      try {
        return useEditorPorts();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });
});
