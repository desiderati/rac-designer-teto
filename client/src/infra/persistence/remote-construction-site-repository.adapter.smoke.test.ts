import {describe, expect, it, vi} from 'vitest';
import {RemoteConstructionSiteRepositoryAdapter} from './remote-construction-site-repository.adapter.ts';

const stateWithEmbeddedSnapshot = {
  constructionSite: {
    id: 'construction-1',
    externalCode: 'CC-001',
    constructionDate: '2026-09-17',
    communityId: 'community-1',
    status: 'in_progress' as const,
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  },
  communities: [],
  families: [],
  monitors: [],
  houses: [{
    id: 'house-1',
    constructionSiteId: 'construction-1',
    familyId: 'family-1',
    houseType: 'tipo6' as const,
    terrainType: 0,
    status: 'draft' as const,
    designSettings: {selectedPilotiHeights: []},
    siteAssessment: {},
    pilotiLayout: {points: []},
    drawingDocument: {
      schemaVersion: 1,
      house: null,
      canvas: {
        schemaVersion: 1,
        objects: [{
          id: 'snapshot-1',
          kind: 'image',
          shape: 'image',
          resource: {src: 'data:image/png;base64,iVBORw0KGgo='},
        }],
      },
    },
    version: 1,
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  }],
};

describe('RemoteConstructionSiteRepositoryAdapter', () => {
  it('externaliza uma imagem base64 antes de salvar o documento canônico', async () => {
    const uploadImage = vi.fn().mockResolvedValue({url: '/manus-storage/rac-designer-teto/unassigned/photos/snapshot.png'});
    const save = vi.fn().mockResolvedValue({documentVersion: 1});
    const client = {
      storage: {uploadImage: {mutate: uploadImage}},
      constructionSites: {save: {mutate: save}},
    } as any;
    const adapter = new RemoteConstructionSiteRepositoryAdapter(client);
    const state = structuredClone(stateWithEmbeddedSnapshot);

    await adapter.save(state as any);

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith(expect.objectContaining({
      constructionSiteId: 'construction-1',
    }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      expectedDocumentVersion: 0,
      state: expect.objectContaining({
        houses: [expect.objectContaining({
          drawingDocument: expect.objectContaining({
            canvas: expect.objectContaining({
              objects: [expect.objectContaining({
                resource: {src: '/manus-storage/rac-designer-teto/unassigned/photos/snapshot.png'},
              })],
            }),
          }),
        })],
      }),
    }));
    expect(state.houses[0].drawingDocument.canvas.objects[0].resource?.src)
      .toBe('/manus-storage/rac-designer-teto/unassigned/photos/snapshot.png');
  });
});
