import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import type {ReactNode, RefObject} from 'react';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {
  useConstructionSiteManagementController,
} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {HouseState} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingCanvasDocument,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

type CanvasHandle = CanvasDocumentHandle & CanvasHistoryHandle;

describe('useConstructionSiteManagementController.ts', () => {
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
      objects: [{id: 'object_a'}],
    };
    const savedDocument = createDrawingDocument('house_a', 'Família A', savedCanvas);
    const restoredCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_b'}],
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
    const canvasRef: RefObject<CanvasHandle | null> = {current: canvasHandle};
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
      objects: [{id: 'object_a'}],
    };
    const switchedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_b'}],
    };
    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_current'}],
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
    const canvasRef: RefObject<CanvasHandle | null> = {current: canvasHandle};
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

  it('serializa trocas rápidas de casa para não salvar canvas antigo com estado lógico novo', async () => {
    const savedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_current'}],
    };
    const firstTargetCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_b'}],
    };
    const secondTargetCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_c'}],
    };
    const savedDocument = createDrawingDocument('house_a', 'Família A', savedCanvas);
    const firstTargetDocument = createDrawingDocument('house_b', 'Família B', firstTargetCanvas);
    const secondTargetDocument = createDrawingDocument('house_c', 'Família C', secondTargetCanvas);
    const loadResolvers: Array<(loaded: boolean) => void> = [];

    const exportCanvasDocument = vi.fn(() => savedCanvas);
    const loadCanvasDocument = vi.fn(() => new Promise<boolean>((resolve) => {
      loadResolvers.push(resolve);
    }));
    const canvasHandle = {
      createDocumentPort: () => ({
        exportCanvasDocument,
        loadCanvasDocument,
      }),
      saveHistory: vi.fn(),
    } as unknown as CanvasHandle;
    const canvasRef: RefObject<CanvasHandle | null> = {current: canvasHandle};
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

  it('salva a casa ativa quando o Canvas notifica mudança documental real', async () => {
    vi.useFakeTimers();

    const changedCanvas: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{id: 'object_changed'}],
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
    const canvasRef: RefObject<CanvasHandle | null> = {current: canvasHandle};
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

function createConstructionSiteManagementPort(overrides: Partial<EditorPorts['constructionSiteManagementPort']> = {}) {
  return {
    subscribe: vi.fn(() => () => {}),
    getConstructionSiteSummaries: vi.fn(() => []),
    getConstructionSiteSnapshots: vi.fn(() => []),
    getConstructionSiteSnapshot: vi.fn(() => null),
    canOpenRacEditor: vi.fn(() => true),
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
    activateHouse: vi.fn(() => null),
    updateActiveFamily: vi.fn(),
    updateActiveHouseSiteAssessment: vi.fn(),
    updateActiveHouseConfiguration: vi.fn(),
    saveActiveHouseDrawingDocument: vi.fn(),
    getActiveHouseDrawingDocument: vi.fn(() => null),
    ...overrides,
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
