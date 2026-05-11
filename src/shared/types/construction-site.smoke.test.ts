import {describe, expect, it} from 'vitest';
import {
  EMPTY_SITE_ASSESSMENT,
  type ConstructionSiteState,
  toConstructionSiteSummary,
} from '@/shared/types/construction-site.ts';

describe('constructionSite.ts', () => {
  it('expõe comunidade única no resumo da Construção TETO', () => {
    const summary = toConstructionSiteSummary(createConstructionSiteState());

    expect((summary as { label?: string }).label).toBe('CC2603 · Tiradentes');
    expect(summary.externalCode).toBe('CC2603');
    expect(summary.constructionDate).toBe('2026-05-11');
    expect((summary as { communityName?: string }).communityName).toBe('Tiradentes');
    expect('communityNames' in summary).toBe(false);
  });

  it('ignora communityIds antigo e mantém comunidade obrigatória por fallback explícito', () => {
    const state = createConstructionSiteState() as ConstructionSiteState & {
      constructionSite: ConstructionSiteState['constructionSite'] & { communityIds?: string[] };
    };
    state.constructionSite.communityId = undefined as never;
    state.constructionSite.communityIds = ['community_1'];

    const summary = toConstructionSiteSummary(state);

    expect((summary as { communityName?: string }).communityName).toBe('Comunidade não informada');
    expect(summary.label).toBe('CC2603 · Comunidade não informada');
  });

  it('não exige nome persistido para Construção TETO', () => {
    const state = createConstructionSiteState();

    expect('name' in state.constructionSite).toBe(false);
  });

  it('usa contrato destrutivo de local com cinco complexidades de terreno', () => {
    expect(EMPTY_SITE_ASSESSMENT).toEqual({
      terrainComplexity: 'flat',
    });
    expect(Object.keys(EMPTY_SITE_ASSESSMENT)).not.toEqual(expect.arrayContaining([
      'hasConcreteGross',
      'hasConcreteFine',
      'hasStone',
      'hasWater',
      'hasRoots',
      'hasPipe',
      'hasBranches',
      'hasWires',
      'soilNotes',
      'obstacleNotes',
    ]));
  });
});

function createConstructionSiteState(): ConstructionSiteState {
  const now = '2026-05-09T00:00:00.000Z';

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityId: 'community_1',
      status: 'in_progress',
      activeHouseId: 'house_1',
      createdAt: now,
      updatedAt: now,
    },
    communities: [
      {
        id: 'community_1',
        name: 'Tiradentes',
      },
      {
        id: 'community_2',
        name: 'Heliópolis',
      },
    ],
    families: [
      {
        id: 'family_1',
        constructionSiteId: 'construction_site_1',
        name: 'Família Teste',
      },
    ],
    houses: [],
  } as unknown as ConstructionSiteState;
}
