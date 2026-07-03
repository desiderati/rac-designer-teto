import {describe, expect, it} from 'vitest';
import {IndexedDbConstructionSiteRepositoryAdapter} from '@/infra/persistence/indexed-db-construction-site-repository.adapter.ts';
import type {ConstructionSiteStorageDriver, StoredConstructionSitesDocument} from '@/infra/storage/indexed-db-construction-sites.storage.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

describe('IndexedDbConstructionSiteRepositoryAdapter', () => {
  it('salva, lista, carrega e remove construções pelo driver IndexedDB', async () => {
    const driver = createMemoryDriver();
    const repository = new IndexedDbConstructionSiteRepositoryAdapter(driver);
    const constructionSite = createConstructionSiteState('construction_site_1', 'CC2603', 'Tiradentes', '2026-05-09T01:00:00.000Z');

    await repository.save(constructionSite);

    expect(await repository.list()).toEqual([
      {
        id: 'construction_site_1',
        label: 'CC2603 · Tiradentes',
        externalCode: 'CC2603',
        constructionDate: '2026-05-11',
        communityName: 'Tiradentes',
        status: 'in_progress',
        activeHouseId: undefined,
        houseCount: 0,
        nonArchivedHouseCount: 0,
        familyCount: 0,
        updatedAt: '2026-05-09T01:00:00.000Z',
      },
    ]);
    expect(await repository.load('construction_site_1')).toEqual(constructionSite);

    await repository.remove('construction_site_1');

    expect(await repository.load('construction_site_1')).toBeNull();
    expect(await repository.list()).toEqual([]);
  });

  it('serializa salvamentos concorrentes sem perder construções', async () => {
    const driver = createMemoryDriver();
    const repository = new IndexedDbConstructionSiteRepositoryAdapter(driver);
    const firstConstructionSite =
      createConstructionSiteState('construction_site_1', 'CC2603', 'Tiradentes', '2026-05-09T01:00:00.000Z');
    const secondConstructionSite =
      createConstructionSiteState('construction_site_2', 'CC2604', 'Pinheiros', '2026-05-10T01:00:00.000Z');

    await Promise.all([
      repository.save(firstConstructionSite),
      repository.save(secondConstructionSite),
    ]);

    expect(driver.getDocument().constructionSites.map((entry) => entry.constructionSite.id).sort()).toEqual([
      'construction_site_1',
      'construction_site_2',
    ]);
  });
});

function createMemoryDriver(): ConstructionSiteStorageDriver & { getDocument(): StoredConstructionSitesDocument } {
  let document: StoredConstructionSitesDocument = {
    version: 1,
    constructionSites: [],
  };

  return {
    async read() {
      return structuredClone(document);
    },
    async write(nextDocument) {
      document = structuredClone(nextDocument);
    },
    getDocument() {
      return structuredClone(document);
    },
  };
}

function createConstructionSiteState(
  id: string,
  externalCode: string,
  communityName: string,
  updatedAt: string,
): ConstructionSiteState {
  return {
    constructionSite: {
      id,
      externalCode,
      constructionDate: '2026-05-11',
      communityId: 'community_1',
      status: 'in_progress',
      createdAt: updatedAt,
      updatedAt,
    },
    communities: [
      {
        id: 'community_1',
        name: communityName,
      },
    ],
    families: [],
    monitors: [],
    houses: [],
  };
}
