import {act, renderHook} from '@testing-library/react';
import type {ReactNode} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {clearRacPdfCache} from '@/components/rac-editor/lib/rac-pdf-cache.ts';

const pdfMocks = vi.hoisted(() => ({
  buildRacPdfReportModel: vi.fn(),
  createRacPdfReportDocument: vi.fn(),
  savePdf: vi.fn(),
  outputPdf: vi.fn(),
  downloadBlob: vi.fn(),
  toastLoading: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock('@/components/rac-editor/lib/rac-pdf-report-model.ts', () => ({
  buildRacPdfReportModel: pdfMocks.buildRacPdfReportModel,
}));

vi.mock('@/components/rac-editor/lib/rac-pdf-report-renderer.ts', () => ({
  createRacPdfReportDocument: pdfMocks.createRacPdfReportDocument,
}));

vi.mock('@/components/rac-editor/lib/rac-pdf-zip-export.ts', () => ({
  downloadBlob: pdfMocks.downloadBlob,
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(),
}));

vi.mock('@/components/ui/sonner.tsx', () => ({
  toast: {
    loading: pdfMocks.toastLoading,
    success: pdfMocks.toastSuccess,
    error: pdfMocks.toastError,
    warning: pdfMocks.toastWarning,
  },
}));

describe('useRacEditorPdfExportAction.ts', () => {
  beforeEach(() => {
    clearRacPdfCache();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:rac-preview'),
      revokeObjectURL: vi.fn(),
    });
    pdfMocks.outputPdf.mockReturnValue(new Blob(['%PDF'], {type: 'application/pdf'}));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('marca a casa ativa como RAC Impressa somente após confirmar o checklist e salvar o PDF', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({save: pdfMocks.savePdf, output: pdfMocks.outputPdf, getNumberOfPages: () => 2});

    const markActiveHouseRacPrinted = vi.fn();
    const onBeforeExportPdf = vi.fn().mockResolvedValue(undefined);
    const onAfterExportPdf = vi.fn();
    const generateHouseIllustration = vi.fn().mockResolvedValue({
      dataUrl: 'data:image/png;base64,illustrated-pdf',
      storageUrl: '/manus-storage/temp/house-3d/illustration.png',
    });
    const canvasRef = {
      current: {
        createDocumentPort: () => ({
          exportImageDataUrl: () => 'data:image/png;base64,canvas',
        }),
      },
    };
    const house3DPdfSnapshotRef = {
      current: {
        captureImageDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,3d'),
      },
    };

    const {result} = renderHook(
      () => useRacEditorPdfExportAction({
        canvasRef: canvasRef as never,
        house3DPdfSnapshotRef: house3DPdfSnapshotRef as never,
        canExportPdf: () => true,
        onBeforeExportPdf,
        onAfterExportPdf,
      }),
      {wrapper: createWrapper({
        constructionSiteManagementPort: {
          getConstructionSiteSnapshot: vi.fn(() => createConstructionSiteSnapshot()),
          markActiveHouseRacPrinted,
        } as never,
        houseIllustrationPort: {generateFromDataUrl: generateHouseIllustration} as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
    });

    expect(result.current.isPdfExportChecklistOpen).toBe(true);
    expect(pdfMocks.toastWarning).not.toHaveBeenCalled();
    expect(pdfMocks.savePdf).not.toHaveBeenCalled();
    expect(markActiveHouseRacPrinted).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleConfirmPdfExport();
    });

    expect(onBeforeExportPdf).toHaveBeenCalledTimes(1);
    expect(generateHouseIllustration).toHaveBeenCalledWith(
      'data:image/png;base64,3d',
      {wallColor: '#c4967a'},
    );
    expect(pdfMocks.buildRacPdfReportModel).toHaveBeenCalledWith(expect.objectContaining({
      house3DImageDataUrl: 'data:image/png;base64,illustrated-pdf',
    }));
    expect(result.current.isPdfPreviewOpen).toBe(true);
    expect(result.current.pdfPreviewUrl).toBe('blob:rac-preview');
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(pdfMocks.toastLoading.mock.calls[0][0]().props.statuses).toEqual({
      'capture-canvas': 'active', 'capture-3d': 'pending', 'prepare-photos': 'pending',
      'build-report-model': 'pending', 'render-pdf': 'pending', 'create-preview': 'pending',
    });
    expect(pdfMocks.toastSuccess.mock.calls[0][0]().props.statuses['create-preview']).toBe('success');
    expect(pdfMocks.downloadBlob).not.toHaveBeenCalled();
    expect(markActiveHouseRacPrinted).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleDownloadPdfPreview();
    });

    expect(pdfMocks.downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'rac.pdf');
    expect(markActiveHouseRacPrinted).toHaveBeenCalledTimes(1);
    expect(onAfterExportPdf).toHaveBeenCalledTimes(1);
    expect(pdfMocks.toastSuccess).toHaveBeenCalledTimes(2);
    expect(markActiveHouseRacPrinted.mock.invocationCallOrder[0]).toBeLessThan(
      onAfterExportPdf.mock.invocationCallOrder[0],
    );
  });

  it('fechar o progresso não cancela o PDF nem reabre o aviso após a captura', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({output: pdfMocks.outputPdf, getNumberOfPages: () => 1});
    let finishCapture!: (image: {imageDataUrl: string; hasOmittedRasterSources: boolean}) => void;
    const capture = new Promise<{imageDataUrl: string; hasOmittedRasterSources: boolean}>((resolve) => { finishCapture = resolve; });
    const {result} = renderHook(() => useRacEditorPdfExportAction({
      canvasRef: {current: {createDocumentPort: () => ({exportSafeImageDataUrlWithStatus: () => capture})}} as never,
      house3DPdfSnapshotRef: {current: {captureImageDataUrl: () => Promise.resolve('data:image/png;base64,3d')}} as never,
    }), {wrapper: createWrapper({constructionSiteManagementPort: {
      getConstructionSiteSnapshot: () => createConstructionSiteSnapshot(),
    } as never})});

    await act(async () => { await result.current.handleSavePDF(); });
    let preparation!: Promise<void>;
    await act(async () => {
      preparation = result.current.handleConfirmPdfExport();
      await Promise.resolve();
    });
    const options = pdfMocks.toastLoading.mock.calls[0][1];
    expect(options.id).toEqual(expect.stringMatching(/^rac-pdf-export-/));
    act(() => { options.onDismiss({id: options.id}); });

    await act(async () => {
      finishCapture({imageDataUrl: 'data:image/png;base64,canvas', hasOmittedRasterSources: false});
      await preparation;
    });
    expect(result.current.isPdfPreviewOpen).toBe(true);
    expect(pdfMocks.toastSuccess).not.toHaveBeenCalled();
    expect(pdfMocks.toastError).not.toHaveBeenCalled();
  });

  it.each(['sem-desenho', 'somente-elevação', 'runtime-ausente'])(
    'bloqueia %s no checklist antes da captura e da prévia', async (scenario) => {
      const site = createConstructionSiteSnapshot();
      if (scenario !== 'runtime-ausente') {
        site.houses[0].drawingDocument.views.top = [];
        site.houses[0].drawingDocument.house.views.top = [];
        if (scenario === 'sem-desenho') site.houses[0].drawingDocument.house = null as never;
      }
      const captureCanvas = vi.fn(() => 'data:image/png;base64,canvas');
      const capture3D = vi.fn();
      const markActiveHouseRacPrinted = vi.fn();
      const {result} = renderHook(() => useRacEditorPdfExportAction({
        canvasRef: {current: {createDocumentPort: () => ({exportImageDataUrl: captureCanvas})}} as never,
        house3DPdfSnapshotRef: {current: {captureImageDataUrl: capture3D}} as never,
        canExportPdf: () => scenario !== 'runtime-ausente',
      }), {wrapper: createWrapper({constructionSiteManagementPort: {
        getConstructionSiteSnapshot: () => site, markActiveHouseRacPrinted,
      } as never})});

      await act(async () => { await result.current.handleSavePDF(); });
      expect(result.current.isPdfExportChecklistOpen).toBe(true);
      expect(result.current.pdfExportChecklist?.hasBlockingItems).toBe(true);
      expect(result.current.pdfExportChecklist?.missingRequiredItems).toEqual(expect.arrayContaining([
        expect.objectContaining({description: expect.stringContaining('Insira a planta (vista superior)')}),
      ]));
      await act(async () => { await result.current.handleConfirmPdfExport(); });
      expect(result.current.isPdfPreviewOpen).toBe(false);
      expect(captureCanvas).not.toHaveBeenCalled();
      expect(capture3D).not.toHaveBeenCalled();
      expect(pdfMocks.toastLoading).not.toHaveBeenCalled();
      expect(pdfMocks.downloadBlob).not.toHaveBeenCalled();
      expect(markActiveHouseRacPrinted).not.toHaveBeenCalled();
    },
  );

  it.each(['documento', 'runtime'])('revalida a planta no %s ao confirmar um checklist já aberto', async (source) => {
    const site = createConstructionSiteSnapshot();
    let runtimeHasTop = true;
    const capture = vi.fn();
    const {result} = renderHook(() => useRacEditorPdfExportAction({
      canvasRef: {current: {createDocumentPort: () => ({exportImageDataUrl: capture})}} as never,
      house3DPdfSnapshotRef: {current: {captureImageDataUrl: capture}} as never,
      canExportPdf: () => runtimeHasTop,
    }), {wrapper: createWrapper({constructionSiteManagementPort: {
      getConstructionSiteSnapshot: () => site, markActiveHouseRacPrinted: vi.fn(),
    } as never})});
    await act(async () => { await result.current.handleSavePDF(); });
    expect(result.current.pdfExportChecklist?.hasBlockingItems).toBe(false);
    if (source === 'runtime') runtimeHasTop = false;
    else {
      site.houses[0].drawingDocument.views.top = [];
      site.houses[0].drawingDocument.house.views.top = [];
    }
    await act(async () => { await result.current.handleConfirmPdfExport(); });
    expect(result.current.isPdfExportChecklistOpen).toBe(true);
    expect(result.current.pdfExportChecklist?.hasBlockingItems).toBe(true);
    expect(result.current.isPdfPreviewOpen).toBe(false);
    expect(capture).not.toHaveBeenCalled();
    expect(pdfMocks.toastLoading).not.toHaveBeenCalled();
  });

  it('mantém falha real de captura 3D como erro e bloqueia retry se a planta for removida', async () => {
    const site = createConstructionSiteSnapshot();
    let hasTop = true;
    const capture3D = vi.fn().mockResolvedValue(null);
    const {result} = renderHook(() => useRacEditorPdfExportAction({
      canvasRef: {current: {createDocumentPort: () => ({exportImageDataUrl: () => 'data:image/png;base64,canvas'})}} as never,
      house3DPdfSnapshotRef: {current: {captureImageDataUrl: capture3D}} as never,
      canExportPdf: () => hasTop,
    }), {wrapper: createWrapper({constructionSiteManagementPort: {
      getConstructionSiteSnapshot: () => site, markActiveHouseRacPrinted: vi.fn(),
    } as never})});
    await act(async () => { await result.current.handleSavePDF(); });
    await act(async () => { await result.current.handleConfirmPdfExport(); });
    expect(result.current.isPdfPreviewOpen).toBe(true);
    expect(result.current.pdfPreviewError).toContain('Falha ao preparar');
    expect(pdfMocks.toastError).toHaveBeenCalledWith(expect.any(Function), {id: expect.any(String), onDismiss: expect.any(Function)});
    expect(pdfMocks.createRacPdfReportDocument).not.toHaveBeenCalled();
    hasTop = false;
    await act(async () => { await result.current.handleRetryPdfPreview(); });
    expect(result.current.isPdfPreviewOpen).toBe(false);
    expect(result.current.pdfExportChecklist?.hasBlockingItems).toBe(true);
    expect(capture3D).toHaveBeenCalledTimes(1);
  });

  it('cancela a exportação no checklist sem alterar status da casa', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({save: pdfMocks.savePdf, output: pdfMocks.outputPdf, getNumberOfPages: () => 2});

    const markActiveHouseRacPrinted = vi.fn();
    const canvasRef = {
      current: {
        createDocumentPort: () => ({
          exportImageDataUrl: () => 'data:image/png;base64,canvas',
        }),
      },
    };

    const {result} = renderHook(
      () => useRacEditorPdfExportAction({
        canvasRef: canvasRef as never,
        house3DPdfSnapshotRef: {current: {captureImageDataUrl: async () => 'data:image/png;base64,3d'}} as never,
        canExportPdf: () => true,
      }),
      {wrapper: createWrapper({
        constructionSiteManagementPort: {
          getConstructionSiteSnapshot: vi.fn(() => createConstructionSiteSnapshot()),
          markActiveHouseRacPrinted,
        } as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
    });
    act(() => {
      result.current.handleCancelPdfExport();
    });

    expect(result.current.isPdfExportChecklistOpen).toBe(false);
    expect(pdfMocks.savePdf).not.toHaveBeenCalled();
    expect(markActiveHouseRacPrinted).not.toHaveBeenCalled();
  });

  it('reabre o PDF atualizado da mesma casa a partir do Blob em cache', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({output: pdfMocks.outputPdf, getNumberOfPages: () => 2});
    const constructionSite = createConstructionSiteSnapshot();
    const {result} = renderHook(
      () => useRacEditorPdfExportAction({
        canvasRef: {current: {createDocumentPort: () => ({exportImageDataUrl: () => 'data:image/png;base64,canvas'})}} as never,
        house3DPdfSnapshotRef: {current: {captureImageDataUrl: async () => 'data:image/png;base64,3d'}} as never,
        canExportPdf: () => true,
      }),
      {wrapper: createWrapper({
        constructionSiteManagementPort: {
          getConstructionSiteSnapshot: vi.fn(() => constructionSite),
          markActiveHouseRacPrinted: vi.fn(),
        } as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
    });
    await act(async () => {
      await result.current.handleConfirmPdfExport();
    });
    act(() => result.current.handleClosePdfPreview());
    await act(async () => {
      await result.current.handleSavePDF();
    });
    await act(async () => {
      await result.current.handleConfirmPdfExport();
    });

    expect(result.current.isPdfPreviewOpen).toBe(true);
    expect(pdfMocks.createRacPdfReportDocument).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('mantém a prévia aberta e exibe erro quando o retry falha', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument
      .mockReturnValueOnce({save: pdfMocks.savePdf, output: pdfMocks.outputPdf, getNumberOfPages: () => 2})
      .mockImplementationOnce(() => {
        throw new Error('chunk do renderer indisponível');
      });

    const {result} = renderHook(
      () => useRacEditorPdfExportAction({
        canvasRef: {current: {createDocumentPort: () => ({exportImageDataUrl: () => 'data:image/png;base64,canvas'})}} as never,
        house3DPdfSnapshotRef: {current: {captureImageDataUrl: async () => 'data:image/png;base64,3d'}} as never,
        canExportPdf: () => true,
      }),
      {wrapper: createWrapper({
        constructionSiteManagementPort: {
          getConstructionSiteSnapshot: vi.fn(() => createConstructionSiteSnapshot()),
          markActiveHouseRacPrinted: vi.fn(),
        } as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
      await result.current.handleConfirmPdfExport();
      await result.current.handleRetryPdfPreview();
    });

    expect(result.current.isPdfPreviewOpen).toBe(true);
    expect(result.current.pdfPreviewError).toContain('Você pode tentar novamente');
    expect(pdfMocks.toastError).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      id: expect.any(String), onDismiss: expect.any(Function),
    }));
  });

  it('mantém o sucesso do PDF quando a sincronização posterior do status falha', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({save: pdfMocks.savePdf, output: pdfMocks.outputPdf, getNumberOfPages: () => 2});

    const onAfterExportPdf = vi.fn(() => {
      throw new Error('sincronização indisponível');
    });
    const {result} = renderHook(
      () => useRacEditorPdfExportAction({
        canvasRef: {
          current: {
            createDocumentPort: () => ({exportImageDataUrl: () => 'data:image/png;base64,canvas'}),
          },
        } as never,
        house3DPdfSnapshotRef: {current: {captureImageDataUrl: async () => 'data:image/png;base64,3d'}} as never,
        canExportPdf: () => true,
        onAfterExportPdf,
      }),
      {wrapper: createWrapper({
        constructionSiteManagementPort: {
          getConstructionSiteSnapshot: vi.fn(() => createConstructionSiteSnapshot()),
          markActiveHouseRacPrinted: vi.fn(),
        } as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
      await result.current.handleConfirmPdfExport();
    });

    expect(result.current.isPdfPreviewOpen).toBe(true);
    await act(async () => {
      result.current.handleDownloadPdfPreview();
    });
    expect(pdfMocks.downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'rac.pdf');
    expect(pdfMocks.toastSuccess).toHaveBeenCalledWith(expect.any(String));
    expect(pdfMocks.toastWarning).toHaveBeenCalledWith('PDF salvo, mas o status da RAC não pôde ser sincronizado agora.');
  });
});

function createWrapper(portOverrides: Partial<EditorPorts>) {
  const ports = portOverrides as EditorPorts;

  return function Wrapper({children}: { children: ReactNode }) {
    return (
      <EditorPortsContext.Provider value={ports}>
        {children}
      </EditorPortsContext.Provider>
    );
  };
}

function createConstructionSiteSnapshot() {
  const views = {
    top: [{instanceId: 'top_1'}],
    front: [{instanceId: 'front_1', side: 'top'}],
    back: [],
    side1: [],
    side2: [],
  };
  const pilotis = Object.fromEntries(
    getAllPilotiIds().map((pilotiId, index) => [
      pilotiId,
      {height: 1, nivel: 0.2, isMaster: index === 0},
    ]),
  );

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC0001',
      constructionDate: '2026-07-02',
      communityId: 'community_1',
      status: 'in_progress',
      activeHouseId: 'house_1',
    },
    communities: [{id: 'community_1', name: 'Comunidade Alfa'}],
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
    }],
    houses: [{
      id: 'house_1',
      constructionSiteId: 'construction_site_1',
      familyId: 'family_1',
      houseType: 'tipo6',
      status: 'draft',
      houseSize: 'large',
      leaders: 'Liderança A',
      extraMaterials: {
        rafters: 1,
        justification: 'Reforço solicitado pela equipe de campo.',
      },
      designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
      siteAssessment: {
        soilProfile: 'stable_clay',
        locationQuery: 'Rua A, 123',
      },
      pilotiLayout: {points: []},
      drawingDocument: {
        schemaVersion: 1,
        viewer3D: {cameraPose: null, wallColor: '#c4967a', hideBelowTerrain: true},
        house: {
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
        },
        canvas: {
          schemaVersion: 1,
          objects: [],
        },
        views: {
          top: [{instanceId: 'top_1', viewType: 'top', payload: {}}],
          front: [{instanceId: 'front_1', viewType: 'front', payload: {}}],
        },
      },
    }],
  };
}
