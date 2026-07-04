import {describe, expect, it, vi} from 'vitest';
import {
  createReactiveConstructionSiteSessionStorage,
  persistReactiveConstructionSites,
} from '@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

describe('useIndexedDbConstructionSiteSessionStorage.ts', () => {
  it('remove do repositório IndexedDB as construções que saíram da lista reativa', async () => {
    const repository = {
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const firstConstructionSite = createConstructionSiteState('construction_site_1');
    const secondConstructionSite = createConstructionSiteState('construction_site_2');

    await persistReactiveConstructionSites(repository, [secondConstructionSite], [
      firstConstructionSite,
      secondConstructionSite,
    ]);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(secondConstructionSite);
    expect(repository.remove).toHaveBeenCalledTimes(1);
    expect(repository.remove).toHaveBeenCalledWith('construction_site_1');
  });

  it('não remove construção quando apenas filhos foram excluídos dela', async () => {
    const repository = {
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const constructionSite = createConstructionSiteState('construction_site_1');
    const constructionSiteWithoutChildren: ConstructionSiteState = {
      ...constructionSite,
      families: [],
      monitors: [],
      houses: [],
    };

    await persistReactiveConstructionSites(repository, [constructionSiteWithoutChildren], [constructionSite]);

    expect(repository.save).toHaveBeenCalledWith(constructionSiteWithoutChildren);
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('informa construções removidas ao persistir uma lista menor', async () => {
    const onWrite = vi.fn().mockResolvedValue(undefined);
    const firstConstructionSite = createConstructionSiteState('construction_site_1');
    const secondConstructionSite = createConstructionSiteState('construction_site_2');
    const storage = createReactiveConstructionSiteSessionStorage([
      firstConstructionSite,
      secondConstructionSite,
    ], onWrite);

    storage.write([secondConstructionSite]);

    expect(storage.read().constructionSites.map((entry) => entry.constructionSite.id)).toEqual([
      'construction_site_2',
    ]);
    expect(onWrite).toHaveBeenCalledWith(
      [secondConstructionSite],
      [firstConstructionSite, secondConstructionSite],
    );
  });

  it('mantém exclusões internas como sobrescrita da construção existente', async () => {
    const onWrite = vi.fn().mockResolvedValue(undefined);
    const constructionSite = createConstructionSiteState('construction_site_1');
    const storage = createReactiveConstructionSiteSessionStorage([constructionSite], onWrite);
    const constructionSiteWithoutChildren: ConstructionSiteState = {
      ...constructionSite,
      families: [],
      monitors: [],
      houses: [],
    };

    storage.write([constructionSiteWithoutChildren]);

    expect(onWrite).toHaveBeenCalledWith(
      [constructionSiteWithoutChildren],
      [constructionSite],
    );
  });
});

function createConstructionSiteState(id: string): ConstructionSiteState {
  return {
    constructionSite: {
      id,
      externalCode: id.toUpperCase(),
      constructionDate: '2026-07-03',
      communityId: `${id}_community`,
      status: 'in_progress',
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    },
    communities: [{
      id: `${id}_community`,
      name: 'Comunidade',
    }],
    families: [{
      id: `${id}_family`,
      constructionSiteId: id,
      name: 'Família',
    }],
    monitors: [{
      id: `${id}_monitor`,
      constructionSiteId: id,
      name: 'Monitor',
      phone: '(11) 99999-0000',
      status: 'inactive',
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }],
    houses: [{
      id: `${id}_house`,
      constructionSiteId: id,
      familyId: `${id}_family`,
      houseType: 'tipo6',
      terrainType: 1,
      status: 'archived',
      designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
      siteAssessment: {},
      pilotiLayout: {points: []},
      drawingDocument: {
        schemaVersion: 1,
        house: null,
        canvas: {
          schemaVersion: 1,
          objects: [],
        },
        views: {},
      },
      version: 1,
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }],
  };
}
