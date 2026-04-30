import {useSyncExternalStore} from 'react';
import {
  houseManagerRuntimeSnapshotPort,
  houseManagerStatePort,
} from '@/infra/house/house-manager-state-adapter.ts';

type Listener = () => void;

const listeners = new Set<Listener>();
let unsubscribeHouseManager: (() => void) | null = null;
let version = 0;

function emitChange() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function ensureBridge() {
  if (unsubscribeHouseManager) return;
  unsubscribeHouseManager = houseManagerRuntimeSnapshotPort.subscribe(() => {
    emitChange();
  });
}

function subscribe(listener: Listener): () => void {
  ensureBridge();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && unsubscribeHouseManager) {
      unsubscribeHouseManager();
      unsubscribeHouseManager = null;
    }
  };
}

function getHouseRuntimeSnapshot() {
  return houseManagerRuntimeSnapshotPort.getRuntimeSnapshot();
}

function getHouseStateSnapshot() {
  return houseManagerStatePort.getStateSnapshot();
}

function getVersionSnapshot() {
  return version;
}

export function emitHouseStoreChange() {
  emitChange();
}

export function useHouseRuntimeSnapshot() {
  return useSyncExternalStore(subscribe, getHouseRuntimeSnapshot, getHouseRuntimeSnapshot);
}

export function useHouseSnapshot() {
  return useHouseRuntimeSnapshot();
}

export function useHouseStateSnapshot() {
  return useSyncExternalStore(subscribe, getHouseStateSnapshot, getHouseStateSnapshot);
}

export function useHouseStoreVersion() {
  return useSyncExternalStore(subscribe, getVersionSnapshot, getVersionSnapshot);
}
