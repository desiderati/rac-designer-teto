import {describe, expect, it, vi} from 'vitest';
import JSZip from 'jszip';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {
  buildRacPdfZipExport,
} from '@/components/rac-editor/lib/rac-pdf-zip-export.ts';

const zipExportMocks = vi.hoisted(() => ({
  createRacPdfReportDocument: vi.fn(),
}));

vi.mock('@/components/rac-editor/lib/rac-pdf-report-renderer.ts', () => ({
  createRacPdfReportDocument: zipExportMocks.createRacPdfReportDocument,
}));

describe('rac-pdf-zip-export.ts', () => {
  it('gera ZIP apenas com casas não arquivadas, incluindo construídas', async () => {
    zipExportMocks.createRacPdfReportDocument.mockReturnValue({
      output: vi.fn(() => new ArrayBuffer(4)),
    });

    const result = await buildRacPdfZipExport({
      constructionSite: createConstructionSite(),
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async () => 'data:image/png;base64,canvas',
    });

    const zip = await JSZip.loadAsync(result.blob);
    const fileNames = Object.keys(zip.files);

    expect(result.exportedHouseIds).toEqual(['house_1', 'house_3']);
    expect(fileNames).toHaveLength(2);
    expect(fileNames.some((fileName) => fileName.includes('FAMILIA-ARQUIVADA'))).toBe(false);
  });

  it('inclui relatório de falhas quando parte das casas não exporta', async () => {
    zipExportMocks.createRacPdfReportDocument.mockReturnValue({
      output: vi.fn(() => new ArrayBuffer(4)),
    });

    const result = await buildRacPdfZipExport({
      constructionSite: createConstructionSite(),
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async (house) => {
        if (house.id === 'house_3') throw new Error('Canvas inválido');
        return 'data:image/png;base64,canvas';
      },
    });

    const zip = await JSZip.loadAsync(result.blob);
    const errorReport = await zip.file('ERROS_EXPORTACAO_RACS.txt')?.async('string');

    expect(result.exportedHouseIds).toEqual(['house_1']);
    expect(result.failures).toEqual([{
      houseId: 'house_3',
      houseLabel: 'Família Construída',
      message: 'Canvas inválido',
    }]);
    expect(errorReport).toContain('Família Construída');
    expect(errorReport).toContain('Canvas inválido');
  });

  it('falha claramente quando não há casas não arquivadas', async () => {
    const constructionSite = createConstructionSite({
      houses: [
        createHouse('house_archived', 'family_archived', 'archived'),
      ],
    });

    await expect(buildRacPdfZipExport({
      constructionSite,
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async () => 'data:image/png;base64,canvas',
    })).rejects.toThrow('Nenhuma casa não arquivada disponível para exportar.');
  });
});

function createConstructionSite(input: { houses?: PersistedHouseRecord[] } = {}): ConstructionSiteState {
  const houses = input.houses ?? [
    createHouse('house_1', 'family_1', 'draft'),
    createHouse('house_2', 'family_2', 'archived'),
    createHouse('house_3', 'family_3', 'built'),
  ];

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC0001',
      constructionDate: '2026-07-02',
      communityId: 'community_1',
      status: 'in_progress',
      activeHouseId: houses[0]?.id,
      createdAt: '2026-07-02T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    },
    communities: [{id: 'community_1', name: 'Comunidade'}],
    families: [
      {id: 'family_1', constructionSiteId: 'construction_site_1', name: 'Família Um'},
      {id: 'family_2', constructionSiteId: 'construction_site_1', name: 'Família Arquivada'},
      {id: 'family_3', constructionSiteId: 'construction_site_1', name: 'Família Construída'},
      {id: 'family_archived', constructionSiteId: 'construction_site_1', name: 'Família Arquivada'},
    ],
    monitors: [],
    houses,
  };
}

function createHouse(
  id: string,
  familyId: string,
  status: PersistedHouseRecord['status'],
): PersistedHouseRecord {
  return {
    id,
    constructionSiteId: 'construction_site_1',
    familyId,
    houseType: 'tipo6',
    terrainType: 1,
    status,
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
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  };
}
