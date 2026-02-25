import {useSyncExternalStore} from 'react';
import {houseManager} from '@/components/lib/house-manager.ts';

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
  unsubscribeHouseManager = houseManager.subscribe(() => {
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

function getHouseSnapshot() {
  return houseManager.getHouse();
}

function getVersionSnapshot() {
  return version;
}

export function emitHouseStoreChange() {
  emitChange();
}

export function useHouseSnapshot() {
  return useSyncExternalStore(subscribe, getHouseSnapshot, getHouseSnapshot);
}

export function useHouseStoreVersion() {
  return useSyncExternalStore(subscribe, getVersionSnapshot, getVersionSnapshot);
}
