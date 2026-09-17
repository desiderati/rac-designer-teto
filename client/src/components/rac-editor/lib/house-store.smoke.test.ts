import {describe, expect, it} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {createElement, type ReactNode} from 'react';
import {
  useHouseRuntimeSnapshot,
  useHouseStateSnapshot,
  useHouseStoreEmitter,
  useHouseStoreVersion,
} from './house-store.ts';
import {createEditorPorts, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import type {HouseRuntimeViews, HouseState} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

const injectedHouseState: HouseState = {
  id: 'injected-house',
  houseType: 'tipo6',
  pilotis: {},
  terrainType: 3,
  views: {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  },
  sideMappings: {
    top: null,
    bottom: null,
    left: null,
    right: null,
  },
  preAssignedSides: {},
};

function createInjectedPorts(): EditorPorts {
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    ...createEditorPorts(),
    houseStatePort: {
      subscribe,
      getStateSnapshot: () => injectedHouseState,
    },
    houseRuntimeSnapshotPort: {
      subscribe,
      getRuntimeSnapshot: () => null,
    },
  };
}

function createWrapper(ports: EditorPorts) {
  return function wrapper({children}: { children: ReactNode }) {
    return createElement(RacEditorStoreProvider, {ports, children});
  };
}

describe('house-store.ts', () => {
  it('incrementa a versão usando as portas injetadas no provider', () => {
    const ports = createInjectedPorts();
    const {result} = renderHook(() => ({
      emitChange: useHouseStoreEmitter(),
      version: useHouseStoreVersion(),
    }), {wrapper: createWrapper(ports)});
    const initial = result.current.version;

    act(() => {
      result.current.emitChange();
    });

    expect(result.current.version).toBe(initial + 1);
  });

  it('lê o estado lógico a partir das portas injetadas no provider', () => {
    const ports = createInjectedPorts();
    const {result} = renderHook(() => useHouseStateSnapshot(), {wrapper: createWrapper(ports)});

    expect(result.current?.id).toBe('injected-house');
  });

  it('mantém snapshot lógico estável entre renders sem nova emissão', () => {
    const ports = createInjectedPorts();
    ports.houseStatePort = {
      subscribe: () => () => undefined,
      getStateSnapshot: () => ({...injectedHouseState}),
    };
    const {result, rerender} = renderHook(() => useHouseStateSnapshot(), {wrapper: createWrapper(ports)});
    const firstSnapshot = result.current;

    rerender();

    expect(result.current).toBe(firstSnapshot);
  });

  it('atualiza snapshot de runtime ao assinar depois de uma mudança sem assinante prévio', () => {
    let runtimeSnapshot: HouseRuntimeSnapshot<never> | null = null;
    const ports = createInjectedPorts();
    ports.houseRuntimeSnapshotPort = {
      subscribe: () => () => undefined,
      getRuntimeSnapshot: () => runtimeSnapshot,
    };

    renderHook(() => useHouseStoreVersion(), {wrapper: createWrapper(ports)});

    runtimeSnapshot = {
      ...injectedHouseState,
      views: {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      } as HouseRuntimeViews<never>,
    };

    const {result} = renderHook(() => useHouseRuntimeSnapshot(), {wrapper: createWrapper(ports)});

    expect(result.current?.id).toBe('injected-house');
  });
});

