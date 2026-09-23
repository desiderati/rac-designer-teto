import { describe, expect, it } from 'vitest';
import { mergeConstructionSiteStates } from './construction-site-conflict-merge.ts';
import type { ConstructionSiteState, PersistedHouseRecord } from '@/shared/types/construction-site.ts';

function house(id: string, updatedAt = '2026-09-23T10:00:00.000Z'): PersistedHouseRecord {
  return {
    id,
    constructionSiteId: 'site-1',
    familyId: `family-${id}`,
    houseType: 'tipo6',
    terrainType: 1,
    status: 'draft',
    designSettings: {selectedPilotiHeights: []},
    siteAssessment: {},
    pilotiLayout: {points: []},
    drawingDocument: {schemaVersion: 1, house: null, canvas: {schemaVersion: 1, objects: []}, views: {}},
    version: 1,
    createdAt: updatedAt,
    updatedAt,
  } as unknown as PersistedHouseRecord;
}

function state(houses: PersistedHouseRecord[] = []): ConstructionSiteState {
  return {
    constructionSite: {
      id: 'site-1',
      externalCode: 'RAC-001',
      documentVersion: 4,
      constructionDate: '2026-09-23',
      communityId: 'community-1',
      status: 'in_progress',
      createdAt: '2026-09-23T10:00:00.000Z',
      updatedAt: '2026-09-23T10:00:00.000Z',
    },
    communities: [{id: 'community-1', name: 'Comunidade Base'}],
    families: [],
    monitors: [],
    houses,
  };
}

describe('mergeConstructionSiteStates', () => {
  it('preserva casas criadas independentemente por duas sessões', () => {
    const base = state([house('house-base')]);
    const local = state([house('house-base'), house('house-local')]);
    const remote = state([house('house-base'), house('house-remote')]);

    const result = mergeConstructionSiteStates(base, local, remote);

    expect(result.ok).toBe(true);
    expect(result.state?.houses.map((entry) => entry.id)).toEqual([
      'house-base',
      'house-remote',
      'house-local',
    ]);
    expect(result.remoteOnlyEntities).toEqual([
      {kind: 'houses', id: 'house-remote', label: 'Casa house-remote'},
    ]);
  });

  it('não permite que uma sessão stale remova uma casa que só existe no servidor', () => {
    const base = state([house('house-base')]);
    const local = state([house('house-base')]);
    const remote = state([house('house-base'), house('house-thais')]);

    const result = mergeConstructionSiteStates(base, local, remote);

    expect(result.ok).toBe(true);
    expect(result.state?.houses.map((entry) => entry.id)).toContain('house-thais');
    expect(result.conflicts).toEqual([]);
  });

  it('bloqueia alteração concorrente no mesmo campo em vez de escolher um lado silenciosamente', () => {
    const base = state([house('house-base')]);
    const local = state([house('house-base')]);
    const remote = state([house('house-base')]);
    local.constructionSite.externalCode = 'RAC-LOCAL';
    remote.constructionSite.externalCode = 'RAC-REMOTE';

    const result = mergeConstructionSiteStates(base, local, remote);

    expect(result.ok).toBe(false);
    expect(result.state).toBeNull();
    expect(result.conflicts).toEqual([
      'constructionSite.externalCode: alterações concorrentes no mesmo campo',
    ]);
  });

  it('bloqueia remoção de entidade que o outro lado ainda mantém', () => {
    const base = state([house('house-base')]);
    const local = state([house('house-base')]);
    const remote = state([]);

    const result = mergeConstructionSiteStates(base, local, remote);

    expect(result.ok).toBe(false);
    expect(result.conflicts[0]).toContain('houses.house-base');
    expect(result.conflicts[0]).toContain('removida no servidor');
  });
});
