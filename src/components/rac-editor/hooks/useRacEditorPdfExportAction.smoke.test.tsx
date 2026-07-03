import {act, renderHook} from '@testing-library/react';
import type {ReactNode} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

const pdfMocks = vi.hoisted(() => ({
  buildRacPdfReportModel: vi.fn(),
  createRacPdfReportDocument: vi.fn(),
  savePdf: vi.fn(),
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

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: pdfMocks.toastSuccess,
    error: pdfMocks.toastError,
    warning: pdfMocks.toastWarning,
  },
}));

describe('useRacEditorPdfExportAction.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marca a casa ativa como RAC Impressa somente após confirmar o checklist e salvar o PDF', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({save: pdfMocks.savePdf});

    const markActiveHouseRacPrinted = vi.fn();
    const onBeforeExportPdf = vi.fn().mockResolvedValue(undefined);
    const onAfterExportPdf = vi.fn();
    const canvasRef = {
      current: {
        createDocumentPort: () => ({
          exportImageDataUrl: () => 'data:image/png;base64,canvas',
        }),
      },
    };
    const house3DPdfSnapshotRef = {
      current: {
        captureImageDataUrl: vi.fn().mockResolvedValue(null),
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
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
    });

    expect(result.current.isPdfExportChecklistOpen).toBe(true);
    expect(pdfMocks.savePdf).not.toHaveBeenCalled();
    expect(markActiveHouseRacPrinted).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleConfirmPdfExport();
    });

    expect(onBeforeExportPdf).toHaveBeenCalledTimes(1);
    expect(pdfMocks.savePdf).toHaveBeenCalledWith('rac.pdf');
    expect(markActiveHouseRacPrinted).toHaveBeenCalledTimes(1);
    expect(onAfterExportPdf).toHaveBeenCalledTimes(1);
    expect(pdfMocks.toastSuccess).toHaveBeenCalledTimes(1);
    expect(markActiveHouseRacPrinted.mock.invocationCallOrder[0]).toBeLessThan(
      onAfterExportPdf.mock.invocationCallOrder[0],
    );
  });

  it('cancela a exportação no checklist sem alterar status da casa', async () => {
    pdfMocks.buildRacPdfReportModel.mockReturnValue({fileName: 'rac.pdf'});
    pdfMocks.createRacPdfReportDocument.mockReturnValue({save: pdfMocks.savePdf});

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
        house3DPdfSnapshotRef: {current: null} as never,
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
