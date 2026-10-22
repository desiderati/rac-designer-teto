import {definedPilotis} from '@/test/defined-pilotis.ts';
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
  renderHouse3D: vi.fn(),
  JSZip: vi.fn(),
  jsPDF: vi.fn(),
  toast: {
    dismiss: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner.tsx', () => ({
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

vi.mock('@/components/rac-editor/@viewer-3d/lib/render-house-3d-pdf-snapshot.tsx', () => ({renderHouse3DPdfSnapshotImageDataUrl: controllerMocks.renderHouse3D}));

type CanvasHandle = CanvasDocumentHandle & CanvasHistoryHandle;
type ConstructionSiteManagementPortMock = EditorPorts['constructionSiteManagementPort'] & {
  [Key in keyof EditorPorts['constructionSiteManagementPort']]: ReturnType<typeof vi.fn>;
};

describe('useConstructionSiteManagementController.ts', () => {
  it.each(['house', 'zip'] as const)('cancela %s imediatamente, ignora resultado tardio e permite nova tentativa', async (kind) => {
    const constructionSite = createConstructionSiteSnapshot();
    makeHousePrintable(constructionSite, 'house_draft');
    const port = createConstructionSiteManagementPort({
      getConstructionSiteSnapshots: vi.fn(() => [constructionSite]),
    });
    const exporter = kind === 'house' ? controllerMocks.buildRacPdfHouseExport : controllerMocks.buildRacPdfZipExport;
    let finish!: (value: unknown) => void;
    exporter.mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
    const onPrepared = vi.fn();
    const {result} = renderHook(() => useConstructionSiteManagementController({}),
      {wrapper: createWrapper(createEditorPorts({constructionSiteManagementPort: port}))});
    let pending!: Promise<void>;
    await act(async () => {
      pending = kind === 'house' ? result.current.actions.exportHouseRacPdf('construction_site_1', 'house_draft', onPrepared)
        : result.current.actions.exportConstructionRacsZip('construction_site_1');
    });
    await waitFor(() => expect(exporter).toHaveBeenCalled());
    const call = exporter.mock.calls.at(-1)![0];
    const progress = controllerMocks.toast.loading.mock.calls.at(-1)![0]();
    await act(async () => {progress.props.onCancel(); await pending;});
    expect(call.signal.aborted).toBe(true);
    const exported = kind === 'house'
      ? {fileName: 'rac.pdf', blob: new Blob(['pdf']), exportedHouseId: 'house_draft'}
      : {fileName: 'racs.zip', blob: new Blob(['zip']), exportedHouseIds: ['house_draft'], failures: []};
    await act(async () => {finish(exported); await Promise.resolve();});
    expect(controllerMocks.downloadBlob).not.toHaveBeenCalled();
    expect(onPrepared).not.toHaveBeenCalled();
    expect(port.markHouseRacPrinted).not.toHaveBeenCalled();
    expect(controllerMocks.toast.error).not.toHaveBeenCalled();
    exporter.mockResolvedValueOnce(exported);
    await act(async () => {
      if (kind === 'house') await result.current.actions.exportHouseRacPdf('construction_site_1', 'house_draft');
      else await result.current.actions.exportConstructionRacsZip('construction_site_1');
    });
    expect(controllerMocks.downloadBlob).toHaveBeenCalledOnce();
    expect(port.markHouseRacPrinted).toHaveBeenCalledWith('house_draft');
  });
  it('conclui autosave pendente, suspende sobrescrita e reidrata após a análise de outra casa', async () => {
    const document = createDrawingDocument('house_a', 'Família A', {schemaVersion: 1, objects: []});
    const loadCanvasDocument = vi.fn(async () => true);
    const handle = {createDocumentPort: () => ({exportCanvasDocument: () => document.canvas, loadCanvasDocument}), saveHistory: vi.fn()} as unknown as CanvasHandle;
    const getHouseFieldAnalysis = vi.fn(() => ({house: {...document.house, id: 'house_b'}, selectedPilotiHeights: [], contraventamentos: []}));
    const port = createConstructionSiteManagementPort({getActiveHouseDrawingDocument: vi.fn(() => document), getHouseFieldAnalysis, saveHouseFieldAnalysis: vi.fn()});
    const ports = createEditorPorts({constructionSiteManagementPort: port, houseDrawingDocumentPort: {
      exportHouseDrawingDocument: vi.fn(() => document), importHouseDrawingDocument: vi.fn(),
    }});
    const {result} = renderHook(() => useConstructionSiteManagementController({canvasRef: {current: handle}}), {wrapper: createWrapper(ports)});
    await act(async () => { await result.current.loadHouseDocument(document); });
    let pending: Promise<void>;
    act(() => { pending = result.current.notifyActiveHouseDocumentChanged(); });
    await act(async () => { await result.current.actions.openHouseFieldAnalysis('site_b', 'house_b'); await pending; });
    expect(port.saveActiveHouseDrawingDocument).toHaveBeenCalledTimes(1);
    expect(port.saveActiveHouseDrawingDocument.mock.invocationCallOrder[0]).toBeLessThan(getHouseFieldAnalysis.mock.invocationCallOrder[0]);
    await act(async () => {
      await result.current.actions.saveHouseFieldAnalysis('site_b', 'house_b', getHouseFieldAnalysis());
      await result.current.notifyActiveHouseDocumentChanged();
      result.current.saveActiveHouseDocument();
    });
    expect(port.saveActiveHouseDrawingDocument).toHaveBeenCalledTimes(1);
    expect(port.activateHouse).not.toHaveBeenCalled();
    await act(async () => { await result.current.actions.closeHouseFieldAnalysis(); });
    expect(loadCanvasDocument).toHaveBeenLastCalledWith(document.canvas);
  });

  it('remove inserção parcial quando a gravação da transação falha', async () => {
    const previous = createDrawingDocument('house_a', 'Família A', {schemaVersion: 1, objects: []});
    const loadCanvasDocument = vi.fn(async () => true);
    const handle = {createDocumentPort: () => ({exportCanvasDocument: () => previous.canvas, loadCanvasDocument}), saveHistory: vi.fn()} as unknown as CanvasHandle;
    const port = createConstructionSiteManagementPort({getActiveHouseDrawingDocument: vi.fn(() => previous), saveActiveHouseDrawingDocument: vi.fn(() => {throw new Error('falha');})});
    const ports = createEditorPorts({constructionSiteManagementPort: port, houseDrawingDocumentPort: {
      exportHouseDrawingDocument: vi.fn(() => previous), importHouseDrawingDocument: vi.fn(),
    }});
    const {result} = renderHook(() => useConstructionSiteManagementController({canvasRef: {current: handle}}), {wrapper: createWrapper(ports)});
    const insert = vi.fn();
    await act(async () => {await expect(result.current.runCanvasDocumentTransaction(insert)).rejects.toThrow('falha');});
    expect(insert).toHaveBeenCalledOnce();
    expect(loadCanvasDocument).toHaveBeenCalledWith(previous.canvas);
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(previous);
  });

  it('aguarda a hidratação Fabric pendente antes de inserir uma casa preparada', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    const document = createDrawingDocument('house_prepared', 'Patrícia', {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    });
    let resolveLoad!: (loaded: boolean) => void;
    const loadCanvasDocument = vi.fn(() => new Promise<boolean>((resolve) => {
      resolveLoad = resolve;
    }));
    const handle = {
      createDocumentPort: () => ({
        exportCanvasDocument: vi.fn(() => document.canvas),
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const managementPort = createConstructionSiteManagementPort({
      getActiveHouseDrawingDocument: vi.fn(() => document),
    });
    const ports = createEditorPorts({
      constructionSiteManagementPort: managementPort,
      houseDrawingDocumentPort: {
        exportHouseDrawingDocument: vi.fn(() => document),
        importHouseDrawingDocument: vi.fn(),
      },
    });
    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef: {current: handle}}),
      {wrapper: createWrapper(ports)},
    );

    let loading!: Promise<boolean>;
    act(() => {
      loading = result.current.loadHouseDocument(document);
    });
    await waitFor(() => expect(loadCanvasDocument).toHaveBeenCalledOnce());

    const insert = vi.fn();
    let transaction!: Promise<void>;
    act(() => {
      transaction = result.current.runCanvasDocumentTransaction(insert);
    });
    await Promise.resolve();
    expect(insert).not.toHaveBeenCalled();

    resolveLoad(true);
    await act(async () => {
      await Promise.all([loading, transaction]);
    });

    expect(insert).toHaveBeenCalledOnce();
    expect(managementPort.saveActiveHouseDrawingDocument).toHaveBeenCalled();
  });

  it('não altera nem salva a casa quando a hidratação preparada retorna false, e permite retry', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    const document = createDrawingDocument('house_prepared', 'Família', {schemaVersion: 1, objects: []});
    const loadCanvasDocument = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const handle = {
      createDocumentPort: () => ({exportCanvasDocument: vi.fn(() => document.canvas), loadCanvasDocument}),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const managementPort = createConstructionSiteManagementPort({getActiveHouseDrawingDocument: vi.fn(() => document)});
    const ports = createEditorPorts({
      constructionSiteManagementPort: managementPort,
      houseDrawingDocumentPort: {exportHouseDrawingDocument: vi.fn(() => document), importHouseDrawingDocument: vi.fn()},
    });
    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef: {current: handle}}),
      {wrapper: createWrapper(ports)},
    );
    const insert = vi.fn();

    await act(async () => {
      await expect(result.current.runCanvasDocumentTransaction(insert)).rejects.toThrow('Não foi possível carregar');
    });
    expect(insert).not.toHaveBeenCalled();
    expect(managementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();
    expect(loadCanvasDocument).toHaveBeenCalledTimes(1);

    await act(async () => {await result.current.runCanvasDocumentTransaction(insert);});
    expect(insert).toHaveBeenCalledOnce();
    expect(loadCanvasDocument).toHaveBeenCalledTimes(2);
    expect(managementPort.saveActiveHouseDrawingDocument).toHaveBeenCalledOnce();
  });

  it('aborta a transação quando uma hidratação Fabric já em andamento falha', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    const document = createDrawingDocument('house_prepared', 'Família', {schemaVersion: 1, objects: []});
    let resolveLoad!: (loaded: boolean) => void;
    const loadCanvasDocument = vi.fn(() => new Promise<boolean>((resolve) => {resolveLoad = resolve;}));
    const handle = {
      createDocumentPort: () => ({exportCanvasDocument: vi.fn(() => document.canvas), loadCanvasDocument}),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const managementPort = createConstructionSiteManagementPort({getActiveHouseDrawingDocument: vi.fn(() => document)});
    const ports = createEditorPorts({
      constructionSiteManagementPort: managementPort,
      houseDrawingDocumentPort: {exportHouseDrawingDocument: vi.fn(() => document), importHouseDrawingDocument: vi.fn()},
    });
    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef: {current: handle}}),
      {wrapper: createWrapper(ports)},
    );
    let loading!: Promise<boolean>;
    act(() => {loading = result.current.loadHouseDocument(document);});
    await waitFor(() => expect(loadCanvasDocument).toHaveBeenCalledOnce());
    const insert = vi.fn();
    let transaction!: Promise<void>;
    act(() => {transaction = result.current.runCanvasDocumentTransaction(insert);});
    resolveLoad(false);
    await act(async () => {
      await expect(transaction).rejects.toThrow('Não foi possível carregar');
      await loading;
    });
    expect(loadCanvasDocument).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalled();
    expect(managementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();
  });

  it('não sobrescreve o documento persistido quando a exportação visual da edição falha', async () => {
    const document = createDrawingDocument('house_a', 'Família', {schemaVersion: 1, objects: []});
    const exportCanvasDocument = vi.fn(() => {throw new Error('desenho restaurado parcialmente');});
    const handle = {
      createDocumentPort: () => ({exportCanvasDocument, loadCanvasDocument: vi.fn(async () => true)}),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const managementPort = createConstructionSiteManagementPort({getActiveHouseDrawingDocument: vi.fn(() => document)});
    const ports = createEditorPorts({
      constructionSiteManagementPort: managementPort,
      houseDrawingDocumentPort: {exportHouseDrawingDocument: vi.fn(() => document), importHouseDrawingDocument: vi.fn()},
    });
    const {result} = renderHook(
      () => useConstructionSiteManagementController({canvasRef: {current: handle}}),
      {wrapper: createWrapper(ports)},
    );

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.notifyActiveHouseDocumentChanged();
      await expect(result.current.flushActiveHouseDocumentSave()).rejects.toThrow('restaurado parcialmente');
      await expect(pending).rejects.toThrow('restaurado parcialmente');
    });
    expect(result.current.documentSaveStatus).toBe('error');
    expect(managementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    controllerMocks.buildRacPdfHouseExport.mockReset();
    controllerMocks.buildRacPdfZipExport.mockReset();
    controllerMocks.downloadBlob.mockReset();
    controllerMocks.renderHouseDrawingCanvasImageDataUrl.mockReset();
    controllerMocks.renderHouse3D.mockReset();
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

  it('abre metadados de outra casa sem hidratar Fabric e suspende autosave do Canvas antigo', async () => {
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
      await result.current.actions.activateHouseForManagement('construction_site_b', 'house_b');
    });

    expect(constructionSiteManagementPort.activateHouse).toHaveBeenCalledWith('construction_site_b', 'house_b');
    expect(constructionSiteManagementPort.saveActiveHouseDrawingDocument).not.toHaveBeenCalled();
    expect(loadCanvasDocument).not.toHaveBeenCalled();
    expect(ports.houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(targetDocument);
    await act(async () => {await result.current.notifyActiveHouseDocumentChanged();});
    expect(exportCanvasDocument).not.toHaveBeenCalled();
    act(() => result.current.hydrateActiveHouseDocument(targetDocument));
    await act(async () => {await result.current.actions.activateHouse('construction_site_b', 'house_b');});
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

  it.each(['house', 'zip'] as const)('exporta %s com captura 3D local quando a porta de ilustração está ausente', async (kind) => {
    const site = createConstructionSiteSnapshot();
    makeHousePrintable(site, 'house_draft');
    const house = site.houses.find(house => house.id === 'house_draft')!;
    const screenshot = 'data:image/png;base64,local-3d';
    controllerMocks.renderHouse3D.mockResolvedValue(screenshot);
    const port = createConstructionSiteManagementPort({getConstructionSiteSnapshots: vi.fn(() => [site])});
    const ports = createEditorPorts({constructionSiteManagementPort: port});
    const exporter = kind === 'house' ? controllerMocks.buildRacPdfHouseExport : controllerMocks.buildRacPdfZipExport;
    const exported = kind === 'house'
      ? {fileName: 'rac.pdf', blob: new Blob(['pdf']), exportedHouseId: house.id}
      : {fileName: 'racs.zip', blob: new Blob(['zip']), exportedHouseIds: [house.id], failures: []};
    exporter.mockImplementation(async args => {
      expect(await args.renderHouse3DImageDataUrl(house, args.signal)).toBe(screenshot);
      return exported;
    });
    const onPrepared = vi.fn();
    const {result} = renderHook(() => useConstructionSiteManagementController({}), {wrapper: createWrapper(ports)});
    await act(async () => {
      if (kind === 'house') await result.current.actions.exportHouseRacPdf(site.constructionSite.id, house.id, onPrepared);
      else await result.current.actions.exportConstructionRacsZip(site.constructionSite.id);
    });
    expect(controllerMocks.renderHouse3D).toHaveBeenCalledOnce();
    expect(controllerMocks.toast.error).not.toHaveBeenCalled();
    if (kind === 'house') expect(onPrepared).toHaveBeenCalledWith(exported, expect.any(AbortSignal));
    else expect(controllerMocks.downloadBlob).toHaveBeenCalledWith(exported.blob, exported.fileName);
    expect(port.activateHouse).not.toHaveBeenCalled();
  });

  it.each(['house', 'zip'] as const)('mantém o erro da ilustração conectada na exportação %s', async (kind) => {
    const site = createConstructionSiteSnapshot();
    makeHousePrintable(site, 'house_draft');
    const house = site.houses.find(house => house.id === 'house_draft')!;
    controllerMocks.renderHouse3D.mockResolvedValue('data:image/png;base64,scene');
    const generate = vi.fn().mockResolvedValue(null);
    const port = createConstructionSiteManagementPort({getConstructionSiteSnapshots: vi.fn(() => [site])});
    const ports = createEditorPorts({constructionSiteManagementPort: port, houseIllustrationPort: {generateFromDataUrl: generate}});
    const exporter = kind === 'house' ? controllerMocks.buildRacPdfHouseExport : controllerMocks.buildRacPdfZipExport;
    exporter.mockImplementation(async args => {
      await args.renderHouse3DImageDataUrl(house, args.signal);
    });
    const onPrepared = vi.fn();
    const {result} = renderHook(() => useConstructionSiteManagementController({}), {wrapper: createWrapper(ports)});
    await act(async () => {
      if (kind === 'house') await result.current.actions.exportHouseRacPdf(site.constructionSite.id, house.id, onPrepared);
      else await result.current.actions.exportConstructionRacsZip(site.constructionSite.id);
    });
    expect(generate).toHaveBeenCalledOnce();
    expect(controllerMocks.toast.error).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));
    expect(controllerMocks.toast.error.mock.calls.at(-1)![0]().props.resultMessage).toContain('Não foi possível gerar a ilustração');
    expect(onPrepared).not.toHaveBeenCalled();
    expect(controllerMocks.downloadBlob).not.toHaveBeenCalled();
    expect(port.markHouseRacPrinted).not.toHaveBeenCalled();
  });

  it('gera a ilustração de cada casa do ZIP com seu próprio 3D e sua cor', async () => {
    const site = createConstructionSiteSnapshot();
    const houses = site.houses.filter(house => house.status !== 'archived');
    for (const [index, house] of houses.entries()) {
      makeHousePrintable(site, house.id);
      house.drawingDocument.viewer3D = {wallColor: index ? '#aabbcc' : '#112233', hideBelowTerrain: true, cameraPose: null};
    }
    controllerMocks.renderHouse3D.mockImplementation(async document => 'data:image/png;base64,scene-' + document.house.id);
    const generate = vi.fn(async (dataUrl: string) => ({dataUrl: dataUrl.replace('scene-', 'illustration-'), storageUrl: null}));
    const port = createConstructionSiteManagementPort({getConstructionSiteSnapshots: vi.fn(() => [site])});
    const ports = createEditorPorts({constructionSiteManagementPort: port, houseIllustrationPort: {generateFromDataUrl: generate}});
    controllerMocks.buildRacPdfZipExport.mockImplementation(async args => {
      for (const house of houses) expect(await args.renderHouse3DImageDataUrl(house)).toBe('data:image/png;base64,illustration-' + house.id);
      return {fileName: 'test.zip', blob: new Blob(), exportedHouseIds: houses.map(house => house.id), failures: []};
    });
    const {result} = renderHook(() => useConstructionSiteManagementController({}), {wrapper: createWrapper(ports)});
    await act(async () => {await result.current.actions.exportConstructionRacsZip(site.constructionSite.id);});
    expect(generate.mock.calls).toEqual(houses.map(house => ['data:image/png;base64,scene-' + house.id, {wallColor: house.drawingDocument.viewer3D!.wallColor}]));
    expect(port.activateHouse).not.toHaveBeenCalled();
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
      signal: expect.any(AbortSignal),
      onProgress: expect.any(Function),
      constructionSite,
      JSZip: controllerMocks.JSZip,
      jsPDF: controllerMocks.jsPDF,
      renderCanvasImageDataUrl: controllerMocks.renderHouseDrawingCanvasImageDataUrl,
      renderHouse3DImageDataUrl: expect.any(Function),
    });
    expect(controllerMocks.downloadBlob).toHaveBeenCalledWith(blob, 'RACS-CC2603.zip');
    expect(constructionSiteManagementPort.markHouseRacPrinted.mock.calls).toEqual([
      ['house_draft'],
      ['house_built'],
    ]);
    expect(controllerMocks.toast.success).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({id: expect.any(String)}));
    expect(controllerMocks.toast.success.mock.calls[0][0]().props.resultMessage).toBe('ZIP de RACs gerado com 2 PDF(s).');
    expect(controllerMocks.toast.loading.mock.invocationCallOrder[0]).toBeLessThan(controllerMocks.buildRacPdfZipExport.mock.invocationCallOrder[0]);
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
      signal: expect.any(AbortSignal),
      onProgress: expect.any(Function),
      constructionSite,
      houseId: 'house_draft',
      jsPDF: controllerMocks.jsPDF,
      renderCanvasImageDataUrl: controllerMocks.renderHouseDrawingCanvasImageDataUrl,
      renderHouse3DImageDataUrl: expect.any(Function),
    });
    expect(controllerMocks.downloadBlob).toHaveBeenCalledWith(blob, 'RAC-CC2603-FAMILIA-RASCUNHO.pdf');
    expect(constructionSiteManagementPort.markHouseRacPrinted).toHaveBeenCalledWith('house_draft');
    expect(controllerMocks.toast.warning).not.toHaveBeenCalled();
    expect(controllerMocks.toast.loading).toHaveBeenCalled();
    expect(controllerMocks.toast.success.mock.calls[0][0]().props.resultMessage).toBe('PDF da RAC gerado.');
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
      .toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({id: expect.any(String)}));
    expect(controllerMocks.toast.error.mock.calls[0][0]().props.resultMessage).toBe('A exportação em ZIP só está disponível para construções em andamento.');
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
    getHouseFieldAnalysis: vi.fn(),
    saveHouseFieldAnalysis: vi.fn(),
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
      pilotis: definedPilotis(),
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
      pilotis: definedPilotis(),
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
