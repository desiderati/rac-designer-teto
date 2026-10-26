import {
  getStorageAssetByStorageKey,
  listStorageAssetInventory,
} from './db.ts';

export const STORAGE_PROVIDER_CAPABILITIES = {
  list: false,
  physicalDelete: false,
} as const;

export const STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE =
  'O provedor de Storage não oferece listagem global nem deleção física neste ambiente. Nenhum objeto foi removido.';

export type StorageInventoryQuery = {
  lifecycle?: 'pending' | 'active' | 'quarantined' | 'manual_review';
  limit?: number;
  offset?: number;
};

export async function getStorageInventory(query: StorageInventoryQuery = {}) {
  return listStorageAssetInventory(query);
}

export async function assertPhysicalStorageDeletionAvailable(): Promise<never> {
  throw new Error(STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE);
}

export async function preparePhysicalStorageDeletion(storageKey: string) {
  const asset = await getStorageAssetByStorageKey(storageKey);
  if (!asset) {
    return {found: false as const, storageKey};
  }

  return {
    found: true as const,
    storageKey: asset.storageKey,
    lifecycle: asset.lifecycle,
    protected: asset.protected,
    referenceCount: asset.referenceCount,
    canDelete: false as const,
    reason: STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE,
  };
}
