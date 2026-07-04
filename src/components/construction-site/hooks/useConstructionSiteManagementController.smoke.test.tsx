import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import type {MutableRefObject, ReactNode} from 'react';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {
  useConstructionSiteManagementController,
} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {HouseState} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingCanvasDocument,
  type HouseDrawingDocument,
  type HouseDrawingElementDocument,
} from '@/shared/types/house-drawing-document.ts';

const controllerMocks = vi.hoisted(() => ({
  buildRacPdfHouseExport: vi.fn(),
  buildRacPdfZipExport: vi.fn(),
  downloadBlob: vi.fn(),
  renderHouseDrawingCanvasImageDataUrl: vi.fn(),
  JSZip: vi.fn(),
  jsPDF: vi.fn(),
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: controllerMocks.toast,
}));

vi.mock('jszip', () => ({
  default: controllerMocks.JSZip,
}));

vi.mock('jspdf', () => ({
  jsPDF: controllerMocks.jsPDF,
}));

vi.mock('@/components/rac-editor/lib/rac-pdf-zip-export.ts', () => ({
  buildRacPdfHouseExport: controllerMocks.buildRacPdfHouseExport,
  buildRacPdfZipExport: controllerMocks.buildRacPdfZipExport,
  downloadBlob: controllerMocks.downloadBlob,
}));

vi.mock('@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts', () => ({
  renderHouseDrawingCanvasImageDataUrl: controllerMocks.renderHouseDrawingCanvasImageDataUrl,
}));

type CanvasHandle = CanvasDocumentHandle & CanvasHistoryHandle;
type ConstructionSiteManagementPortMock = EditorPorts['constructionSiteManagementPort'] & {
  [Key in keyof EditorPorts['constructionSiteManagementPort']]: ReturnType<typeof vi.fn>;
};

describe('useConstructionSiteManagementController.ts', () => {
  beforeEach(() => {
    controllerMocks.buildRacPdfHouseExport.mockReset();
    controllerMocks.buildRacPdfZipExport.mockReset();
    controllerMocks.downloadBlob.mockReset();
    controllerMocks.renderHouseDrawingCanvasImageDataUrl.mockReset();
    controllerMocks.JSZip.mockReset();
    controllerMocks.jsPDF.mockReset();
    controllerMocks.toast.success.mockReset();
    controllerMocks.toast.warning.mockReset();
    controllerMocks.toast.error.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('salva a casa anterior e hidrata a casa ativa quando o Canvas remonta após a gestão', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle));

    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_a')],
    };
    const savedDocument = createDrawingDocument('house_a', 'Família A', savedCanvas);
    const restoredCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_b')],
    };
    const restoredDocument = createDrawingDocument('house_b', 'Família B', restoredCanvas);
    let activeDocument: HouseDrawingDocument | null = null;

    const exportCanvasDocument = vi.fn(() => savedCanvas);
    const loadCanvasDocument = vi.fn(async () => true);
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      activateHouse: vi.fn(() => {
        activeDocument = restoredDocument;
        return restoredDocument;
      }),
      getActiveHouseDrawingDocument: vi.fn(() => activeDocument),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => savedDocument),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    act(() => {
      result.current.saveActiveHouseDocument();
    });

    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).toHaveBeenCalledWith(savedDocument);

    canvasRef.current = null;

    await act(async () => {
      await result.current.actions.activateHouse('construction_site_b', 'house_b');
    });

    expect(constructionSiteManagementPort.activateHouse).toHaveBeenCalledWith('construction_site_b', 'house_b');
    expect(loadCanvasDocument).not.toHaveBeenCalledWith(restoredCanvas);

    canvasRef.current = canvasHandle;

    act(() => {
      result.current.hydrateActiveHouseDocument();
    });

    await waitFor(() => {
      expect(loadCanvasDocument).toHaveBeenCalledWith(restoredCanvas);
    });
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(restoredDocument);
    expect(canvasHandle.saveHistory).toHaveBeenCalled();
  });

  it('descarta hidratação pendente da casa anterior ao trocar de casa com o Canvas montado', async () => {
    const scheduledFrames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      scheduledFrames.push(callback);
      return scheduledFrames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const initialCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_a')],
    };
    const switchedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_b')],
    };
    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_current')],
    };
    const initialDocument = createDrawingDocument('house_a', 'Família A', initialCanvas);
    const switchedDocument = createDrawingDocument('house_b', 'Família B', switchedCanvas);
    const savedDocument = createDrawingDocument('house_a', 'Família A Editada', savedCanvas);
    let activeDocument: HouseDrawingDocument | null = initialDocument;

    const exportCanvasDocument = vi.fn(() => savedCanvas);
    const loadCanvasDocument = vi.fn(async () => true);
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      activateHouse: vi.fn(() => {
        activeDocument = switchedDocument;
        return switchedDocument;
      }),
      getActiveHouseDrawingDocument: vi.fn(() => activeDocument),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => savedDocument),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    expect(scheduledFrames).toHaveLength(1);

    act(() => {
      void result.current.notifyActiveHouseDocumentChanged();
    });

    await act(async () => {
      await result.current.actions.activateHouse('construction_site_b', 'house_b');
    });

    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).toHaveBeenCalledWith(savedDocument);
    expect(loadCanvasDocument).toHaveBeenLastCalledWith(switchedCanvas);

    await act(async () => {
      scheduledFrames[0]?.(performance.now());
      await Promise.resolve();
    });

    expect(loadCanvasDocument).toHaveBeenCalledTimes(1);
    expect(loadCanvasDocument).toHaveBeenLastCalledWith(switchedCanvas);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(switchedDocument);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).not.toHaveBeenCalledWith(initialDocument);
  });

  it('não salva o documento da casa ao abrir edição sem alteração pendente no Canvas', async () => {
    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_current')],
    };
    const targetCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_b')],
    };
    const targetDocument = createDrawingDocument('house_b', 'Família B', targetCanvas);
    const exportCanvasDocument = vi.fn(() => savedCanvas);
    const loadCanvasDocument = vi.fn(async () => true);
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      activateHouse: vi.fn(() => targetDocument),
      getActiveHouseDrawingDocument: vi.fn(() => targetDocument),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => createDrawingDocument('house_a', 'Família A', savedCanvas)),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    await act(async () => {
      await result.current.actions.activateHouse('construction_site_b', 'house_b');
    });

    expect(constructionSiteManagementPort.activateHouse).toHaveBeenCalledWith('construction_site_b', 'house_b');
    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();
    expect(loadCanvasDocument).toHaveBeenCalledWith(targetCanvas);
  });

  it('serializa trocas rápidas de casa para não salvar canvas antigo com estado lógico novo', async () => {
    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_current')],
    };
    const firstTargetCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_b')],
    };
    const secondTargetCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_c')],
    };
    const savedDocument = createDrawingDocument('house_a', 'Família A', savedCanvas);
    const firstTargetDocument = createDrawingDocument('house_b', 'Família B', firstTargetCanvas);
    const secondTargetDocument = createDrawingDocument('house_c', 'Família C', secondTargetCanvas);
    const loadResolvers: Array<(loaded: boolean) => void> = [];

    const exportCanvasDocument = vi.fn(() => savedCanvas);
    const loadCanvasDocument = vi.fn((_canvas: HouseDrawingCanvasDocument) => new Promise<boolean>((resolve) => {
      loadResolvers.push(resolve);
    }));
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const activateHouse = vi.fn((_constructionSiteId: string, houseId: string) =>
      houseId === 'house_b' ? firstTargetDocument : secondTargetDocument);
    const constructionSiteManagementPort = createConstructionSiteManagementPort({activateHouse});
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => savedDocument),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    const firstActivation = result.current.actions.activateHouse('construction_site_b', 'house_b');
    const secondActivation = result.current.actions.activateHouse('construction_site_c', 'house_c');

    await waitFor(() => {
      expect(activateHouse).toHaveBeenCalledTimes(1);
    });
    expect(activateHouse).toHaveBeenLastCalledWith('construction_site_b', 'house_b');
    expect(loadCanvasDocument).toHaveBeenCalledWith(firstTargetCanvas);

    await act(async () => {
      loadResolvers[0]?.(true);
      await firstActivation;
    });

    await waitFor(() => {
      expect(activateHouse).toHaveBeenCalledTimes(2);
    });
    expect(activateHouse).toHaveBeenLastCalledWith('construction_site_c', 'house_c');
    expect(loadCanvasDocument).toHaveBeenLastCalledWith(secondTargetCanvas);

    await act(async () => {
      loadResolvers[1]?.(true);
      await secondActivation;
    });

    expect(loadCanvasDocument.mock.calls.map(([canvas]) => canvas)).toEqual([
      firstTargetCanvas,
      secondTargetCanvas,
    ]);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenNthCalledWith(1, firstTargetDocument);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenNthCalledWith(2, secondTargetDocument);
  });

  it('exporta RACs em ZIP para a construção selecionada e marca as casas exportadas', async () => {
    const constructionSite = createConstructionSiteSnapshot();
    const blob = new Blob(['zip']);
    controllerMocks.buildRacPdfZipExport.mockResolvedValue({
      fileName: 'RACS-CC2603.zip',
      blob,
      exportedHouseIds: ['house_draft', 'house_built'],
      failures: [],
    });
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      getConstructionSiteSnapshots: vi.fn(() => [constructionSite]),
      getConstructionSiteSnapshot: vi.fn(() => null),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({}),
      {wrapper: createWrapper(ports)},
    );

    await act(async () => {
      await result.current.actions.exportConstructionRacsZip('construction_site_1');
    });

    expect(controllerMocks.buildRacPdfZipExport).toHaveBeenCalledWith({
      constructionSite,
      JSZip: controllerMocks.JSZip,
      jsPDF: controllerMocks.jsPDF,
      renderCanvasImageDataUrl: controllerMocks.renderHouseDrawingCanvasImageDataUrl,
    });
    expect(controllerMocks.downloadBlob).toHaveBeenCalledWith(blob, 'RACS-CC2603.zip');
    expect(constructionSiteManagementPort.markHouseRacPrinted.mock.calls).toEqual([
      ['house_draft'],
      ['house_built'],
    ]);
    expect(controllerMocks.toast.success).toHaveBeenCalledWith('ZIP de RACs gerado com 2 PDF(s).');
  });

  it('exporta RAC em PDF para a casa selecionada e marca a casa exportada', async () => {
    const constructionSite = createConstructionSiteSnapshot();
    makeHousePrintable(constructionSite, 'house_draft');
    const blob = new Blob(['pdf']);
    controllerMocks.buildRacPdfHouseExport.mockResolvedValue({
      fileName: 'RAC-CC2603-FAMILIA-RASCUNHO.pdf',
      blob,
      exportedHouseId: 'house_draft',
    });
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      getConstructionSiteSnapshots: vi.fn(() => [constructionSite]),
      getConstructionSiteSnapshot: vi.fn(() => null),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({}),
      {wrapper: createWrapper(ports)},
    );

    await act(async () => {
      await result.current.actions.exportHouseRacPdf('construction_site_1', 'house_draft');
    });

    expect(controllerMocks.buildRacPdfHouseExport).toHaveBeenCalledWith({
      constructionSite,
      houseId: 'house_draft',
      jsPDF: controllerMocks.jsPDF,
      renderCanvasImageDataUrl: controllerMocks.renderHouseDrawingCanvasImageDataUrl,
    });
    expect(controllerMocks.downloadBlob).toHaveBeenCalledWith(blob, 'RAC-CC2603-FAMILIA-RASCUNHO.pdf');
    expect(constructionSiteManagementPort.markHouseRacPrinted).toHaveBeenCalledWith('house_draft');
    expect(controllerMocks.toast.success).toHaveBeenCalledWith('PDF da RAC gerado.');
  });

  it('não exporta RAC em PDF para casa arquivada pela listagem', async () => {
    const constructionSite = createConstructionSiteSnapshot();
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      getConstructionSiteSnapshots: vi.fn(() => [constructionSite]),
      getConstructionSiteSnapshot: vi.fn(() => null),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({}),
      {wrapper: createWrapper(ports)},
    );

    await act(async () => {
      await result.current.actions.exportHouseRacPdf('construction_site_1', 'house_archived');
    });

    expect(controllerMocks.buildRacPdfHouseExport).not.toHaveBeenCalled();
    expect(constructionSiteManagementPort.markHouseRacPrinted).not.toHaveBeenCalled();
    expect(controllerMocks.toast.error)
      .toHaveBeenCalledWith('A impressão de RAC só está disponível para casas não arquivadas.');
  });

  it('não exporta RACs em ZIP para construção concluída porque a ação altera status', async () => {
    const constructionSite = createConstructionSiteSnapshot('completed');
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      getConstructionSiteSnapshots: vi.fn(() => [constructionSite]),
      getConstructionSiteSnapshot: vi.fn(() => null),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({}),
      {wrapper: createWrapper(ports)},
    );

    await act(async () => {
      await result.current.actions.exportConstructionRacsZip('construction_site_1');
    });

    expect(controllerMocks.buildRacPdfZipExport).not.toHaveBeenCalled();
    expect(constructionSiteManagementPort.markHouseRacPrinted).not.toHaveBeenCalled();
    expect(controllerMocks.toast.error)
      .toHaveBeenCalledWith('A exportação em ZIP só está disponível para construções em andamento.');
  });

  it('salva a casa ativa quando o Canvas notifica mudança documental real', async () => {
    vi.useFakeTimers();

    const changedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_changed')],
    };
    const changedDocument = createDrawingDocument('house_a', 'Família A', changedCanvas);
    const exportCanvasDocument = vi.fn(() => changedCanvas);
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument: vi.fn(async () => true),
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const constructionSiteManagementPort = createConstructionSiteManagementPort();
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => changedDocument),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    expect(result.current.documentSaveStatus).toBe('saved');

    let savePromise!: Promise<void>;
    await act(async () => {
      savePromise = result.current.notifyActiveHouseDocumentChanged();
    });

    expect(result.current.documentSaveStatus).toBe('saving');
    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(exportCanvasDocument).toHaveBeenCalled();
    expect(ports.houseDrawingDocumentPort.exportHouseDrawingDocument).toHaveBeenCalledWith(changedCanvas);
    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).toHaveBeenCalledWith(changedDocument);
    expect(result.current.documentSaveStatus).toBe('saving');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      await savePromise;
    });

    expect(result.current.documentSaveStatus).toBe('saved');
  });

  it('salva o documento pendente antes de atualizar a configuração da casa e hidrata o nome salvo', async () => {
    const currentCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_current')],
    };
    const savedDocument = createDrawingDocument('house_a', 'Família Antiga', currentCanvas);
    const updatedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [createCanvasObject('object_updated')],
    };
    const updatedDocument = createDrawingDocument('house_a', 'Família Nova', updatedCanvas);
    let activeDocument: HouseDrawingDocument | null = savedDocument;

    const exportCanvasDocument = vi.fn(() => currentCanvas);
    const loadCanvasDocument = vi.fn(async () => true);
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: MutableRefObject<CanvasHandle | null> = {current: canvasHandle};
    const constructionSiteManagementPort = createConstructionSiteManagementPort({
      updateActiveHouseConfiguration: vi.fn(() => {
        activeDocument = updatedDocument;
      }),
      getActiveHouseDrawingDocument: vi.fn(() => activeDocument),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => savedDocument),
        importHouseDrawingDocument: vi.fn(),
      },
    });

    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef}),
      {wrapper: createWrapper(ports)},
    );

    let pendingSave!: Promise<void>;
    await act(async () => {
      pendingSave = result.current.notifyActiveHouseDocumentChanged();
      await result.current.actions.updateActiveHouseConfiguration({familyName: 'Família Nova'});
      await pendingSave;
    });

    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).toHaveBeenCalledWith(savedDocument);
    expect(constructionSiteManagementPort.updateActiveHouseConfiguration).toHaveBeenCalledWith({
      familyName: 'Família Nova',
    });
    expect(
      constructionSiteManagementPort.saveActiveHouseDrawingDocument.mock.invocationCallOrder[0],
    ).toBeLessThan(
      constructionSiteManagementPort.updateActiveHouseConfiguration.mock.invocationCallOrder[0],
    );
    expect(loadCanvasDocument).toHaveBeenCalledWith(updatedCanvas);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(updatedDocument);
    expect(canvasHandle.saveHistory).toHaveBeenCalled();
  });
});

function createWrapper(ports: EditorPorts) {
  return function Wrapper({children}: { children: ReactNode }) {
    return (
      <EditorPortsContext.Provider value={ports}>
        {children}
      </EditorPortsContext.Provider>
    );
  };
}

function createCanvasObject(id: string): HouseDrawingElementDocument {
  return {
    id,
    kind: 'test',
    shape: 'rect',
  };
}

function createEditorPorts(overrides: Partial<EditorPorts>): EditorPorts {
  return {
    houseReadPort: {} as EditorPorts['houseReadPort'],
    houseWritePort: {} as EditorPorts['houseWritePort'],
    houseRuntimePort: {} as EditorPorts['houseRuntimePort'],
    houseStatePort: {
      subscribe: vi.fn(() => () => {}),
      getStateSnapshot: vi.fn(() => null),
    },
    houseRuntimeSnapshotPort: {
      subscribe: vi.fn(() => () => {}),
      getRuntimeSnapshot: vi.fn(() => null),
    },
    house3DProjectionPort: {} as EditorPorts['house3DProjectionPort'],
    houseDrawingDocumentPort: {
      exportHouseDrawingDocument: vi.fn(() => null),
      importHouseDrawingDocument: vi.fn(),
    },
    constructionSiteManagementPort: createConstructionSiteManagementPort(),
    settingsPort: {} as EditorPorts['settingsPort'],
    ...overrides,
  };
}

function createConstructionSiteManagementPort(
  overrides: Partial<ConstructionSiteManagementPortMock> = {},
): ConstructionSiteManagementPortMock {
  return {
    subscribe: vi.fn(() => () => {}),
    getConstructionSiteSummaries: vi.fn(() => []),
    getConstructionSiteSnapshots: vi.fn(() => []),
    getConstructionSiteSnapshot: vi.fn(() => null),
    canOpenRacEditor: vi.fn(() => true),
    prepareRacEditorOpening: vi.fn(() => null),
    createConstructionSite: vi.fn(),
    updateActiveConstructionSite: vi.fn(),
    archiveActiveConstructionSite: vi.fn(),
    archiveConstructionSite: vi.fn(),
    unarchiveConstructionSite: vi.fn(),
    activateConstructionSite: vi.fn(() => null),
    createHouse: vi.fn(),
    duplicateActiveHouse: vi.fn(),
    archiveActiveHouse: vi.fn(),
    archiveHouse: vi.fn(),
    unarchiveHouse: vi.fn(),
    markActiveHouseRacPrinted: vi.fn(),
    markHouseRacPrinted: vi.fn(),
    markHouseBuilt: vi.fn(),
    markHouseDraft: vi.fn(),
    activateHouse: vi.fn(() => null),
    updateActiveFamily: vi.fn(),
    updateActiveHouseSiteAssessment: vi.fn(),
    updateActiveHouseConfiguration: vi.fn(),
    updateActiveHouseExtraMaterials: vi.fn(),
    saveActiveHouseDrawingDocument: vi.fn(),
    getActiveHouseDrawingDocument: vi.fn(() => null),
    ...overrides,
  } as ConstructionSiteManagementPortMock;
}

function makeHousePrintable(constructionSite: ConstructionSiteState, houseId: string): void {
  const house = constructionSite.houses.find((entry) => entry.id === houseId);
  if (!house) return;

  house.drawingDocument = {
    ...house.drawingDocument,
    house: {
      id: house.id,
      houseType: house.houseType,
      terrainType: house.terrainType,
      pilotis: {},
      views: {
        top: [{instanceId: 'top_1'}],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideMappings: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      preAssignedSides: {},
    } satisfies HouseState,
    views: {
      top: [{instanceId: 'top_1', viewType: 'top', payload: {}}],
    },
  };
}

function createDrawingDocument(
  houseId: string,
  familyName: string,
  canvas: HouseDrawingCanvasDocument,
): HouseDrawingDocument {
  return {
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {
      familyName,
      selectedPilotiHeights: [1, 1.5, 2],
    },
    house: {
      id: houseId,
      houseType: null,
      terrainType: 1,
      pilotis: {},
      views: {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideMappings: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      preAssignedSides: {},
    } satisfies HouseState,
    canvas,
  };
}

function createConstructionSiteSnapshot(
  status: ConstructionSiteState['constructionSite']['status'] = 'in_progress',
): ConstructionSiteState {
  const houses = [
    createPersistedHouse('house_draft', 'family_draft', 'draft'),
    createPersistedHouse('house_archived', 'family_archived', 'archived'),
    createPersistedHouse('house_built', 'family_built', 'built'),
  ];

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC2603',
      constructionDate: '2026-07-02',
      communityId: 'community_1',
      status,
      activeHouseId: 'house_draft',
      createdAt: '2026-07-02T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    },
    communities: [{id: 'community_1', name: 'Comunidade'}],
    families: [
      {id: 'family_draft', constructionSiteId: 'construction_site_1', name: 'Família Rascunho'},
      {id: 'family_archived', constructionSiteId: 'construction_site_1', name: 'Família Arquivada'},
      {id: 'family_built', constructionSiteId: 'construction_site_1', name: 'Família Construída'},
    ],
    monitors: [],
    houses,
  };
}

function createPersistedHouse(
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
        schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
        objects: [],
      },
      views: {},
    },
    version: 1,
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  };
}
