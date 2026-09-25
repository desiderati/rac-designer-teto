import { describe, expect, it } from 'vitest';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';
import { summarizeConstructionSiteChanges } from './construction-site-conflict-summary.ts';

function state(): ConstructionSiteState {
  return {
    constructionSite: {
      id: 'site-1', externalCode: 'CC2609', constructionDate: '2026-09-26',
      communityId: 'community-1', status: 'in_progress', documentVersion: 3,
      createdAt: '2026-09-24T10:00:00.000Z', updatedAt: '2026-09-24T10:00:00.000Z',
    },
    communities: [], families: [], monitors: [], houses: [],
  };
}

describe('resumo de diferenças do conflito', () => {
  it('mostra criações independentes em cada lado sem confundir metadados de sessão', () => {
    const base = state();
    const local = structuredClone(base);
    const remote = structuredClone(base);
    local.constructionSite.activeHouseId = 'house-local';
    local.constructionSite.updatedAt = '2026-09-24T11:00:00.000Z';
    local.houses.push({ id: 'house-local' } as ConstructionSiteState['houses'][number]);
    remote.constructionSite.documentVersion = 4;
    remote.families.push({ id: 'family-remote' } as ConstructionSiteState['families'][number]);

    expect(summarizeConstructionSiteChanges(base, local)).toEqual(['1 casa adicionada']);
    expect(summarizeConstructionSiteChanges(base, remote)).toEqual(['1 família adicionada']);
  });

  it('informa quando não há base comum para uma comparação confiável', () => {
    expect(summarizeConstructionSiteChanges(null, state()))
      .toEqual(['Versão-base indisponível para calcular as diferenças.']);
  });
});
