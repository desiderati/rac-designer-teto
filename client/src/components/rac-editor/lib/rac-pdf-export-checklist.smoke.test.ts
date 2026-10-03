import {describe, expect, it} from 'vitest';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import type {HousePiloti, HouseState, HouseViews} from '@/shared/types/house.ts';
import {
  buildRacPdfExportChecklist,
  formatRacPdfExportChecklistSummary,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';

describe('rac-pdf-export-checklist.ts', () => {
  it.each(['stairBeams', 'floorBeams', 'rafters', 'secondaryBeams', 'gutters', 'gutterCount', 'gutterCaps', 'gutterElbows', 'bracing'] as const)(
    'recomenda justificativa para quantidade positiva isolada em %s', (field) => {
      const site = createCompleteConstructionSite();
      const pending = () => buildRacPdfExportChecklist(site).missingRecommendedItems.map((item) => item.id);
      site.houses[0].extraMaterials = {[field]: 3, justification: '  '};
      expect(pending()).toContain('extra-materials-justification');
      expect(buildRacPdfExportChecklist(site).hasBlockingItems).toBe(false);
      site.houses[0].extraMaterials.justification = 'Reforço necessário.';
      expect(pending()).not.toContain('extra-materials-justification');
      site.houses[0].extraMaterials = {[field]: 0};
      expect(pending()).not.toContain('extra-materials-justification');
    },
  );

  it('não trata opções sem quantidade como material que exige justificativa', () => {
    const site = createCompleteConstructionSite();
    site.houses[0].extraMaterials = {asphaltBlanket: true, stairType: 'access_ramp'};
    expect(buildRacPdfExportChecklist(site).missingRecommendedItems.map((item) => item.id))
      .not.toContain('extra-materials-justification');
  });

  it('bloqueia exportação quando não há construção/casa mínima', () => {
    const checklist = buildRacPdfExportChecklist(null);

    expect(checklist.hasBlockingItems).toBe(true);
    expect(checklist.missingRequiredItems.map((item) => item.id)).toEqual([
      'construction',
      'house',
      'house-drawing',
      'any-view',
      'house-type',
      'top-view',
    ]);
  });

  it('gera checklist completo sem pendências para uma RAC preenchida', () => {
    const checklist = buildRacPdfExportChecklist(createCompleteConstructionSite());

    expect(checklist.hasBlockingItems).toBe(false);
    expect(checklist.missingRequiredItems).toEqual([]);
    expect(checklist.missingRecommendedItems).toEqual([]);
    expect(formatRacPdfExportChecklistSummary(checklist)).toBe('Checklist sem pendências.');
  });

  it('valida a casa informada quando recebe um ID específico', () => {
    const constructionSite = createCompleteConstructionSite();
    constructionSite.families.push({
      id: 'family_2',
      constructionSiteId: 'construction_site_1',
      communityId: 'community_1',
      name: 'Família Sem Desenho',
    });
    constructionSite.houses.push({
      ...createCompleteHouse(),
      id: 'house_2',
      familyId: 'family_2',
      drawingDocument: {
        schemaVersion: 1,
        house: null,
        canvas: {
          schemaVersion: 1,
          objects: [],
        },
        views: {},
      },
    });

    const checklist = buildRacPdfExportChecklist(constructionSite, 'house_2');

    expect(checklist.hasBlockingItems).toBe(true);
    expect(checklist.missingRequiredItems.map((item) => item.id)).toEqual([
      'house-drawing',
      'any-view',
      'top-view',
    ]);
  });

  it('bloqueia elevações sem planta, mas permite planta sem elevações', () => {
    const site = createCompleteConstructionSite();
    const drawing = site.houses[0].drawingDocument;
    drawing.views.top = [];
    drawing.house!.views.top = [];
    const blocked = buildRacPdfExportChecklist(site);
    expect(blocked.missingRequiredItems.map((item) => item.id)).toEqual(['top-view']);
    expect(blocked.missingRequiredItems[0].description).toContain('Insira a planta (vista superior)');
    drawing.views.top = [{instanceId: 'top_1', viewType: 'top', payload: {}}];
    drawing.house!.views.top = [{instanceId: 'top_1'}];
    drawing.views.front = [];
    drawing.house!.views.front = [];
    const allowed = buildRacPdfExportChecklist(site);
    expect(allowed.hasBlockingItems).toBe(false);
    expect(allowed.missingRecommendedItems.map((item) => item.id)).toContain('elevation-view');
  });

  it('classifica dados complementares ausentes como alertas', () => {
    const constructionSite = createCompleteConstructionSite();
    constructionSite.houses[0] = {
      ...constructionSite.houses[0],
      leaders: '',
      houseSize: undefined,
      siteAssessment: {},
      extraMaterials: {rafters: 2},
    };
    constructionSite.monitors = [];

    const checklist = buildRacPdfExportChecklist(constructionSite);

    expect(checklist.hasBlockingItems).toBe(false);
    expect(checklist.missingRecommendedItems.map((item) => item.id)).toEqual(expect.arrayContaining([
      'house-size',
      'soil',
      'location',
      'leaders',
      'monitor',
      'extra-materials-justification',
    ]));
  });
});

function createCompleteConstructionSite(): ConstructionSiteState {
  const house = createCompleteHouse();
  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC0001',
      constructionDate: '2026-07-02',
      communityId: 'community_1',
      status: 'in_progress',
      activeHouseId: house.id,
      createdAt: '2026-07-02T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    },
    communities: [{
      id: 'community_1',
      name: 'Comunidade Alfa',
    }],
    families: [{
      id: 'family_1',
      constructionSiteId: 'construction_site_1',
      communityId: 'community_1',
      name: 'Família Silva',
      primaryContactName: 'Maria Silva',
      primaryContactPhone: '11999999999',
    }],
    monitors: [{
      id: 'monitor_1',
      constructionSiteId: 'construction_site_1',
      name: 'Monitor A',
      phone: '11999999999',
      status: 'active',
      createdAt: '2026-07-02T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    }],
    houses: [house],
  };
}

function createCompleteHouse(): PersistedHouseRecord {
  const houseState = createHouseState();
  return {
    id: 'house_1',
    constructionSiteId: 'construction_site_1',
    familyId: 'family_1',
    communityId: 'community_1',
    houseType: 'tipo6',
    terrainType: 1,
    status: 'draft',
    houseSize: 'large',
    leaders: 'Liderança A',
    extraMaterials: {
      rafters: 1,
      justification: 'Reforço solicitado pela equipe de campo.',
    },
    designSettings: {
      selectedPilotiHeights: [1, 1.5, 2],
    },
    siteAssessment: {
      soilProfile: 'stable_clay',
      locationQuery: 'Rua A, 123',
    },
    pilotiLayout: {
      points: [],
    },
    drawingDocument: {
      schemaVersion: 1,
      house: houseState,
      canvas: {
        schemaVersion: 1,
        objects: [],
      },
      views: {
        top: [{instanceId: 'top_1', viewType: 'top', payload: {}}],
        front: [{instanceId: 'front_1', viewType: 'front', payload: {}}],
      },
    },
    version: 1,
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  };
}

function createHouseState(): HouseState {
  const pilotis = Object.fromEntries(
    getAllPilotiIds().map((pilotiId, index): [string, HousePiloti] => [
      pilotiId,
      {height: 1, nivel: 0.2, isMaster: index === 0},
    ]),
  );
  const views: HouseViews = {
    top: [{instanceId: 'top_1'}],
    front: [{instanceId: 'front_1', side: 'top'}],
    back: [],
    side1: [],
    side2: [],
  };

  return {
    id: 'house_state_1',
    houseType: 'tipo6',
    pilotis,
    terrainType: 1,
    views,
    sideMappings: {
      top: 'front',
      bottom: null,
      left: null,
      right: null,
    },
    preAssignedSides: {},
  };
}
