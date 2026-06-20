import {act, renderHook} from '@testing-library/react';
import type {ReactNode} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';

const pdfMocks = vi.hoisted(() => ({
  buildRacPdfReportModel: vi.fn(),
  createRacPdfReportDocument: vi.fn(),
  savePdf: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
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
  },
}));

describe('useRacEditorPdfExportAction.ts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marca a casa ativa como RAC Impressa após salvar o PDF', async () => {
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
          getConstructionSiteSnapshot: vi.fn(() => ({constructionSite: {id: 'construction_site_1'}})),
          markActiveHouseRacPrinted,
        } as never,
      })},
    );

    await act(async () => {
      await result.current.handleSavePDF();
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
