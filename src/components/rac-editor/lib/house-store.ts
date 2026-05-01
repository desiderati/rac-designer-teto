import {useSyncExternalStore} from 'react';
import {type EditorPorts, useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

type Listener = () => void;

interface HouseStoreSubscriptionPort {
  subscribe(listener: Listener): () => void;
}

function createStoreBridge(port: HouseStoreSubscriptionPort, beforeEmit: () => void = () => {}) {
  const listeners = new Set<Listener>();
  let unsubscribePort: (() => void) | null = null;

  function emitChange() {
    beforeEmit();
    listeners.forEach((listener) => listener());
  }

  function ensureBridge() {
    if (unsubscribePort) return;
    unsubscribePort = port.subscribe(() => {
      emitChange();
    });
  }

  function subscribe(listener: Listener): () => void {
    ensureBridge();
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && unsubscribePort) {
        unsubscribePort();
        unsubscribePort = null;
      }
    };
  }

  return {emitChange, subscribe};
}

type HouseStorePorts = Pick<EditorPorts, 'houseStatePort' | 'houseRuntimeSnapshotPort'>;

interface HouseStoreBridge {
  emitChange(): void;
  getRuntimeSnapshot(): HouseRuntimeSnapshot<HouseRuntimeGroupRef> | null;
  getStateSnapshot(): ReturnType<EditorPorts['houseStatePort']['getStateSnapshot']>;
  getVersionSnapshot(): number;
  runtimeSubscribe(listener: Listener): () => void;
  stateSubscribe(listener: Listener): () => void;
}

const bridgesByPorts = new WeakMap<HouseStorePorts, HouseStoreBridge>();

function createHouseStoreBridge(ports: HouseStorePorts): HouseStoreBridge {
  let version = 0;
  const incrementVersion = () => {
    version += 1;
  };
  const stateBridge = createStoreBridge(ports.houseStatePort, incrementVersion);
  const runtimeBridge = createStoreBridge(ports.houseRuntimeSnapshotPort);

  return {
    emitChange: () => {
      stateBridge.emitChange();
      runtimeBridge.emitChange();
    },
    getRuntimeSnapshot: () =>
      ports.houseRuntimeSnapshotPort.getRuntimeSnapshot() as HouseRuntimeSnapshot<HouseRuntimeGroupRef> | null,
    getStateSnapshot: () => ports.houseStatePort.getStateSnapshot(),
    getVersionSnapshot: () => version,
    runtimeSubscribe: runtimeBridge.subscribe,
    stateSubscribe: stateBridge.subscribe,
  };
}

function getHouseStoreBridge(ports: HouseStorePorts): HouseStoreBridge {
  const existing = bridgesByPorts.get(ports);
  if (existing) return existing;

  const created = createHouseStoreBridge(ports);
  bridgesByPorts.set(ports, created);
  return created;
}

function useHouseStoreBridge(): HouseStoreBridge {
  return getHouseStoreBridge(useEditorPorts());
}

export function useHouseRuntimeSnapshot<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef>() {
  const bridge = useHouseStoreBridge();

  return useSyncExternalStore(
    bridge.runtimeSubscribe,
    bridge.getRuntimeSnapshot,
    bridge.getRuntimeSnapshot,
  ) as HouseRuntimeSnapshot<TGroup> | null;
}

export function useHouseStateSnapshot() {
  const bridge = useHouseStoreBridge();

  return useSyncExternalStore(
    bridge.stateSubscribe,
    bridge.getStateSnapshot,
    bridge.getStateSnapshot,
  );
}

export function useHouseStoreVersion() {
  const bridge = useHouseStoreBridge();

  return useSyncExternalStore(
    bridge.stateSubscribe,
    bridge.getVersionSnapshot,
    bridge.getVersionSnapshot,
  );
}

export function useHouseStoreEmitter() {
  return useHouseStoreBridge().emitChange;
}
