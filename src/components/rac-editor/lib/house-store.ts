import {useSyncExternalStore} from 'react';
import {
  houseManagerRuntimeSnapshotPort,
  houseManagerStatePort,
} from '@/components/rac-editor/adapters/house-manager-state-adapter.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';

type Listener = () => void;

interface HouseStoreSubscriptionPort {
  subscribe(listener: Listener): () => void;
}

let version = 0;

function incrementVersion() {
  version += 1;
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

const stateBridge = createStoreBridge(houseManagerStatePort, incrementVersion);
const runtimeBridge = createStoreBridge(houseManagerRuntimeSnapshotPort);

function getHouseRuntimeSnapshot(): HouseRuntimeSnapshot<HouseRuntimeGroupRef> | null {
  return houseManagerRuntimeSnapshotPort.getRuntimeSnapshot() as HouseRuntimeSnapshot<HouseRuntimeGroupRef> | null;
}

function getHouseStateSnapshot() {
  return houseManagerStatePort.getStateSnapshot();
}

function getVersionSnapshot() {
  return version;
}

export function emitHouseStoreChange() {
  stateBridge.emitChange();
  runtimeBridge.emitChange();
}

export function useHouseRuntimeSnapshot<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef>() {
  return useSyncExternalStore(
    runtimeBridge.subscribe,
    getHouseRuntimeSnapshot,
    getHouseRuntimeSnapshot,
  ) as HouseRuntimeSnapshot<TGroup> | null;
}

export function useHouseSnapshot<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef>() {
  return useHouseRuntimeSnapshot<TGroup>();
}

export function useHouseStateSnapshot() {
  return useSyncExternalStore(stateBridge.subscribe, getHouseStateSnapshot, getHouseStateSnapshot);
}

export function useHouseStoreVersion() {
  return useSyncExternalStore(stateBridge.subscribe, getVersionSnapshot, getVersionSnapshot);
}
