import {describe, expect, it, vi} from 'vitest';

const storageAdmin = vi.hoisted(() => ({
  assertPhysicalStorageDeletionAvailable: vi.fn(),
  getStorageInventory: vi.fn(),
  preparePhysicalStorageDeletion: vi.fn(),
  STORAGE_PHYSICAL_DELETE_UNAVAILABLE_MESSAGE: 'provider-unavailable',
  STORAGE_PROVIDER_CAPABILITIES: {list: false, physicalDelete: false},
}));

vi.mock('./storage-admin.ts', () => storageAdmin);

import {appRouter} from './routers.ts';

function caller(role: 'admin' | 'user') {
  return appRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user: {
      id: role === 'admin' ? 1 : 2,
      openId: `${role}-open-id`,
      name: role,
      email: `${role}@example.test`,
      loginMethod: 'test',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

describe('storage admin router', () => {
  it('permite capacidades somente para admin', async () => {
    await expect(caller('admin').storage.capabilities()).resolves.toEqual({
      coverage: 'ledger-known-only',
      provider: {list: false, physicalDelete: false},
      physicalDeleteMessage: 'provider-unavailable',
    });
    await expect(caller('user').storage.capabilities()).rejects.toMatchObject({code: 'FORBIDDEN'});
  });

  it('expõe o inventário conhecido pelo ledger sem prometer cobertura global', async () => {
    storageAdmin.getStorageInventory.mockResolvedValue({
      coverage: 'ledger-known-only', total: 0, limit: 100, offset: 0, items: [],
    });
    await expect(caller('admin').storage.inventory({lifecycle: 'quarantined'})).resolves.toEqual({
      provider: {list: false, physicalDelete: false},
      coverage: 'ledger-known-only', total: 0, limit: 100, offset: 0, items: [],
    });
    expect(storageAdmin.getStorageInventory).toHaveBeenCalledWith({lifecycle: 'quarantined'});
  });
});
