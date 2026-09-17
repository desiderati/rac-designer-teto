import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from './_core/context.ts';

const db = vi.hoisted(() => ({
  listConstructionSiteSummaries: vi.fn(),
  getConstructionSiteDocument: vi.fn(),
  saveConstructionSiteDocument: vi.fn(),
  removeConstructionSiteDocument: vi.fn(),
}));
const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock('./db.ts', () => ({
  ...db,
  ConstructionSiteVersionConflictError: class ConstructionSiteVersionConflictError extends Error {},
  ConstructionSiteDeleteNotAllowedError: class ConstructionSiteDeleteNotAllowedError extends Error {},
}));
vi.mock('./storage.ts', () => storage);

import { appRouter } from './routers.ts';

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: 'manus-user',
      name: 'Pessoa de Teste',
      email: 'person@example.com',
      loginMethod: 'manus',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext['req'],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext['res'],
  };
}

function constructionSiteState() {
  return {
    constructionSite: {
      id: 'construction-1',
      externalCode: 'CC2603',
      constructionDate: '2026-09-17',
      communityId: 'community-1',
      status: 'in_progress' as const,
      photoDataUrl: undefined as string | undefined,
      createdAt: '2026-09-17T00:00:00.000Z',
      updatedAt: '2026-09-17T00:00:00.000Z',
    },
    communities: [],
    families: [],
    monitors: [],
    houses: [],
  };
}

describe('constructionSites procedures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists a canonical document behind a protected procedure', async () => {
    db.saveConstructionSiteDocument.mockResolvedValue({ documentVersion: 1 });
    const caller = appRouter.createCaller(createContext());
    const state = constructionSiteState();

    await expect(caller.constructionSites.save({ state, expectedDocumentVersion: 0 })).resolves.toEqual({ documentVersion: 1 });
    expect(db.saveConstructionSiteDocument).toHaveBeenCalledWith(state, 0);
  });

  it('rejects embedded image data instead of writing base64 into the document', async () => {
    const caller = appRouter.createCaller(createContext());
    const state = constructionSiteState();
    state.constructionSite.photoDataUrl = 'data:image/png;base64,iVBORw0KGgo=';

    await expect(caller.constructionSites.save({ state, expectedDocumentVersion: 0 }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.saveConstructionSiteDocument).not.toHaveBeenCalled();
  });

  it('validates a PNG signature and delegates bytes to native storage', async () => {
    storage.storagePut.mockResolvedValue({
      key: 'rac-designer-teto/unassigned/photos/terreno_123.png',
      url: '/manus-storage/rac-designer-teto/unassigned/photos/terreno_123.png',
    });
    const caller = appRouter.createCaller(createContext());
    const base64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');

    await expect(caller.storage.uploadImage({
      fileName: 'terreno.png',
      mimeType: 'image/png',
      base64,
    })).resolves.toMatchObject({
      key: 'rac-designer-teto/unassigned/photos/terreno_123.png',
      mimeType: 'image/png',
      bytes: 8,
    });
    expect(storage.storagePut).toHaveBeenCalledWith(
      'rac-designer-teto/unassigned/photos/terreno.png',
      expect.any(Buffer),
      'image/png',
    );
  });
});
