import {beforeEach, describe, expect, it, vi} from 'vitest';

const db = vi.hoisted(() => ({
  getStorageAssetByStorageKey: vi.fn(),
  listStorageAssetInventory: vi.fn(),
}));

vi.mock('./db.ts', () => db);

import {
  assertPhysicalStorageDeletionAvailable,
  getStorageInventory,
  preparePhysicalStorageDeletion,
  STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE,
  STORAGE_PROVIDER_CAPABILITIES,
} from './storage-admin.ts';

describe('storage admin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('declara que o inventário é somente do ledger e não promete capacidades inexistentes', () => {
    expect(STORAGE_PROVIDER_CAPABILITIES).toEqual({list: false, physicalDelete: false});
  });

  it('delega inventário paginado ao ledger', async () => {
    db.listStorageAssetInventory.mockResolvedValue({
      coverage: 'ledger-known-only', total: 1, limit: 10, offset: 0, items: [],
    });
    await expect(getStorageInventory({lifecycle: 'quarantined', limit: 10})).resolves.toMatchObject({
      coverage: 'ledger-known-only', total: 1,
    });
    expect(db.listStorageAssetInventory).toHaveBeenCalledWith({lifecycle: 'quarantined', limit: 10});
  });

  it('inspeciona um asset conhecido sem prometer deleção', async () => {
    db.getStorageAssetByStorageKey.mockResolvedValue({
      storageKey: 'rac/site/orphan.png', lifecycle: 'quarantined', protected: false, referenceCount: 0,
    });
    await expect(preparePhysicalStorageDeletion('rac/site/orphan.png')).resolves.toEqual({
      found: true,
      storageKey: 'rac/site/orphan.png',
      lifecycle: 'quarantined',
      protected: false,
      referenceCount: 0,
      canDelete: false,
      reason: STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE,
    });
  });

  it('falha fechado ao tentar deleção física sem API do provedor', async () => {
    await expect(assertPhysicalStorageDeletionAvailable()).rejects.toThrow(
      STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE,
    );
  });
});
