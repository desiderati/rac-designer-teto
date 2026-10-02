import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import JSZip from 'jszip';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {
  buildRacPdfHouseExport,
  buildRacPdfZipExport,
} from '@/components/rac-editor/lib/rac-pdf-zip-export.ts';
import {clearRacPdfCache, getRacPdfFingerprint} from '@/components/rac-editor/lib/rac-pdf-cache.ts';
import {writeCanvasViewportStorage} from '@/components/rac-editor/@canvas/lib/canvas-viewport-storage.ts';

const zipExportMocks = vi.hoisted(() => ({
  createRacPdfReportDocument: vi.fn(),
}));
const TINY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

vi.mock('@/components/rac-editor/lib/rac-pdf-report-renderer.ts', () => ({
  createRacPdfReportDocument: zipExportMocks.createRacPdfReportDocument,
}));

describe('rac-pdf-zip-export.ts', () => {
  beforeEach(() => {
    clearRacPdfCache();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('gera PDF individual para uma casa não arquivada específica', async () => {
    const output = vi.fn(() => new ArrayBuffer(4));
    zipExportMocks.createRacPdfReportDocument.mockReturnValue({output});
    const constructionSite = createConstructionSite();
    const renderCanvasImageDataUrl = vi.fn(async () => 'data:image/png;base64,canvas');

    const result = await buildRacPdfHouseExport({
      constructionSite,
      houseId: 'house_3',
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl,
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d-house_3',
    });

    expect(result.exportedHouseId).toBe('house_3');
    expect(result.fileName).toContain('FAMILIA-CONSTRUIDA');
    expect(result.blob.type).toBe('application/pdf');
    expect(renderCanvasImageDataUrl).toHaveBeenCalledWith(constructionSite.houses[2]);
    expect(output).toHaveBeenCalledWith('arraybuffer');
  });

  it('bloqueia PDF individual de casa arquivada', async () => {
    await expect(buildRacPdfHouseExport({
      constructionSite: createConstructionSite(),
      houseId: 'house_2',
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async () => 'data:image/png;base64,canvas',
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d',
    })).rejects.toThrow('Casa não arquivada não encontrada para exportar.');
  });

  it('bloqueia casa sem planta antes de capturar imagens no PDF individual', async () => {
    const constructionSite = createConstructionSite();
    constructionSite.houses[0].drawingDocument.house = null;
    constructionSite.houses[0].drawingDocument.views = {};
    const renderCanvasImageDataUrl = vi.fn();
    const renderHouse3DImageDataUrl = vi.fn();
    await expect(buildRacPdfHouseExport({
      constructionSite, houseId: 'house_1', jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl, renderHouse3DImageDataUrl,
    })).rejects.toThrow('Insira a planta (vista superior)');
    expect(renderCanvasImageDataUrl).not.toHaveBeenCalled();
    expect(renderHouse3DImageDataUrl).not.toHaveBeenCalled();
    expect(zipExportMocks.createRacPdfReportDocument).not.toHaveBeenCalled();
  });

  it('inclui ausência de planta no relatório do ZIP e exporta somente a casa válida', async () => {
    const constructionSite = createConstructionSite();
    constructionSite.houses[0].drawingDocument.house = null;
    constructionSite.houses[0].drawingDocument.views = {};
    zipExportMocks.createRacPdfReportDocument.mockReturnValue({output: () => new ArrayBuffer(4)});
    const renderCanvasImageDataUrl = vi.fn(async () => 'data:image/png;base64,canvas');
    const renderHouse3DImageDataUrl = vi.fn(async () => 'data:image/png;base64,3d');
    const result = await buildRacPdfZipExport({
      constructionSite, JSZip, jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl, renderHouse3DImageDataUrl,
    });
    expect(result.exportedHouseIds).toEqual(['house_3']);
    expect(result.failures).toEqual([expect.objectContaining({
      houseId: 'house_1', message: expect.stringContaining('Insira a planta (vista superior)'),
    })]);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(1);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledWith(constructionSite.houses[2]);
    const zip = await JSZip.loadAsync(result.blob);
    expect(await zip.file('ERROS_EXPORTACAO_RACS.txt')!.async('string')).toContain('Insira a planta');
  });

  it('gera ZIP apenas com casas não arquivadas, incluindo construídas', async () => {
    zipExportMocks.createRacPdfReportDocument.mockReturnValue({
      output: vi.fn(() => new ArrayBuffer(4)),
    });

    const result = await buildRacPdfZipExport({
      constructionSite: createConstructionSite(),
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async () => 'data:image/png;base64,canvas',
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d',
    });

    const zip = await JSZip.loadAsync(result.blob);
    const fileNames = Object.keys(zip.files);

    expect(result.exportedHouseIds).toEqual(['house_1', 'house_3']);
    expect(fileNames).toHaveLength(2);
    expect(fileNames.some((fileName) => fileName.includes('FAMILIA-ARQUIVADA'))).toBe(false);
  });

  it('inclui a captura 3D da casa correspondente em cada PDF do ZIP', async () => {
    const reports: Array<{house3DImageDataUrl: string | null}> = [];
    zipExportMocks.createRacPdfReportDocument.mockImplementation(({report}) => {
      reports.push(report);
      return {output: () => new ArrayBuffer(4)};
    });
    const renderHouse3DImageDataUrl = vi.fn(async (house: PersistedHouseRecord) => `data:image/png;base64,3d-${house.id}`);

    await buildRacPdfZipExport({
      constructionSite: createConstructionSite(),
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl: async () => 'data:image/png;base64,canvas',
      renderHouse3DImageDataUrl,
    });

    expect(renderHouse3DImageDataUrl).toHaveBeenCalledTimes(2);
    expect(reports.map((report) => report.house3DImageDataUrl)).toEqual([
      'data:image/png;base64,3d-house_1',
      'data:image/png;base64,3d-house_3',
    ]);
  });

  it('reutiliza o Blob por casa quando só o zoom do canvas muda e regenera a casa editada', async () => {
    zipExportMocks.createRacPdfReportDocument.mockImplementation(() => ({output: () => new ArrayBuffer(4)}));
    const constructionSite = createConstructionSite();
    const renderCanvasImageDataUrl = vi.fn(async () => 'data:image/png;base64,canvas');
    const renderHouse3DImageDataUrl = vi.fn(async () => 'data:image/png;base64,3d');
    const args = {constructionSite, JSZip, jsPDF: vi.fn() as never, renderCanvasImageDataUrl, renderHouse3DImageDataUrl};

    await buildRacPdfZipExport(args);
    writeCanvasViewportStorage({zoom: 1.5, viewportX: 200, viewportY: 100});
    constructionSite.houses[0].drawingDocument.canvasMeta = {selectedObjectId: 'obj-1'};
    constructionSite.houses[0].updatedAt = '2026-07-03T00:00:00.000Z';
    await buildRacPdfZipExport(args);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(2);
    expect(renderHouse3DImageDataUrl).toHaveBeenCalledTimes(2);

    constructionSite.houses[0].extraMaterials = {gutterCount: 2};
    await buildRacPdfZipExport(args);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(3);
    expect(renderHouse3DImageDataUrl).toHaveBeenCalledTimes(3);
    expect(zipExportMocks.createRacPdfReportDocument).toHaveBeenCalledTimes(3);
  });

  it('invalida apenas o PDF da casa quando a configuração 3D persistida muda', () => {
    const constructionSite = createConstructionSite();
    const first = getRacPdfFingerprint(constructionSite, 'house_1');
    const other = getRacPdfFingerprint(constructionSite, 'house_3');
    constructionSite.houses[0].drawingDocument.viewer3D = {
      cameraPose: {position: [4, 5, 6], target: [0, 0, 0], fov: 60, zoom: 1.25},
      wallColor: '#ffffff',
      hideBelowTerrain: true,
    };
    expect(getRacPdfFingerprint(constructionSite, 'house_1')).not.toBe(first);
    expect(getRacPdfFingerprint(constructionSite, 'house_3')).toBe(other);
    const withViewer = getRacPdfFingerprint(constructionSite, 'house_1');
    constructionSite.houses[0].drawingDocument.viewer3D.hideBelowTerrain = false;
    expect(getRacPdfFingerprint(constructionSite, 'house_1')).toBe(withViewer);
  });

  it('reprocessa a mesma URL de foto depois de falha temporária, sem reutilizar PDF incompleto', async () => {
    const constructionSite = createConstructionSite({houses: [createHouse('house_1', 'family_1', 'draft')]});
    constructionSite.families[0].photoDataUrl = TINY_PNG_DATA_URL;
    const reports: Array<{familyPhotoImageDataUrl: string | null}> = [];
    zipExportMocks.createRacPdfReportDocument.mockImplementation(({report}) => {
      reports.push(report);
      return {output: () => new ArrayBuffer(4)};
    });
    let imageAttempts = 0;
    class FakeImage {
      naturalWidth = 100;
      naturalHeight = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_source: string) {
        imageAttempts += 1;
        const shouldFail = imageAttempts === 1;
        queueMicrotask(() => shouldFail ? this.onerror?.() : this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName !== 'canvas') return originalCreateElement(tagName);
      return {
        width: 0,
        height: 0,
        getContext: () => ({fillRect: vi.fn(), drawImage: vi.fn()}),
        toDataURL: () => TINY_PNG_DATA_URL,
      } as unknown as HTMLCanvasElement;
    }) as typeof document.createElement);
    const renderCanvasImageDataUrl = vi.fn(async () => 'data:image/png;base64,canvas');
    const renderHouse3DImageDataUrl = vi.fn(async () => 'data:image/png;base64,3d');
    const args = {constructionSite, JSZip, jsPDF: vi.fn() as never, renderCanvasImageDataUrl, renderHouse3DImageDataUrl};

    await buildRacPdfZipExport(args);
    expect(reports[0].familyPhotoImageDataUrl).toBeNull();
    await buildRacPdfZipExport(args);
    expect(reports[1].familyPhotoImageDataUrl).toBe(TINY_PNG_DATA_URL);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(2);
    await buildRacPdfZipExport(args);
    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(2);
    expect(imageAttempts).toBe(2);
  });

  it('reprocessa o mesmo canvas após omissão temporária de raster, sem cachear o PDF incompleto', async () => {
    zipExportMocks.createRacPdfReportDocument.mockImplementation(() => ({output: () => new ArrayBuffer(4)}));
    const constructionSite = createConstructionSite({houses: [createHouse('house_1', 'family_1', 'draft')]});
    const renderCanvasImageDataUrl = vi.fn()
      .mockResolvedValueOnce({imageDataUrl: 'data:image/png;base64,canvas-incompleto', hasOmittedRasterSources: true})
      .mockResolvedValue({imageDataUrl: 'data:image/png;base64,canvas-completo', hasOmittedRasterSources: false});
    const args = {
      constructionSite,
      JSZip,
      jsPDF: vi.fn() as never,
      renderCanvasImageDataUrl,
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d',
    };

    await buildRacPdfZipExport(args);
    await buildRacPdfZipExport(args);
    await buildRacPdfZipExport(args);

    expect(renderCanvasImageDataUrl).toHaveBeenCalledTimes(2);
    expect(zipExportMocks.createRacPdfReportDocument).toHaveBeenCalledTimes(2);
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
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d',
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
      renderHouse3DImageDataUrl: async () => 'data:image/png;base64,3d',
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
      house: {
        id: `drawing_${id}`, houseType: 'tipo6', terrainType: 1, pilotis: {},
        views: {top: [{instanceId: `top_${id}`}], front: [], back: [], side1: [], side2: []},
        sideMappings: {top: null, bottom: null, left: null, right: null},
        preAssignedSides: {},
      },
      canvas: {
        schemaVersion: 1,
        objects: [],
      },
      views: {top: [{instanceId: `top_${id}`, viewType: 'top', payload: {}}]},
    },
    version: 1,
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  };
}
