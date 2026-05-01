import {act, renderHook, waitFor} from '@testing-library/react';
import {createElement, type ReactNode, type RefObject} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast} from 'sonner';
import {createEditorPorts, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useRacEditorJsonActions} from '@/components/rac-editor/hooks/useRacEditorJsonActions.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';
import type {HouseState} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingCanvasDocument,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createWrapper(overrides: Partial<EditorPorts> = {}) {
  const ports = {
    ...createEditorPorts(),
    ...overrides,
  };

  return function wrapper({children}: { children: ReactNode }) {
    return createElement(RacEditorStoreProvider, {ports, children});
  };
}

function createCanvasRef(documentPort: CanvasDocumentPort) {
  const canvas = {
    createDocumentPort: vi.fn(() => documentPort),
    saveHistory: vi.fn(),
    clearHistory: vi.fn(),
    undo: vi.fn(),
    copy: vi.fn(),
    paste: vi.fn(),
  };

  return {
    canvas,
    ref: {current: canvas} as RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>,
  };
}

function createDocument(): HouseDrawingDocument {
  const house: HouseState = {
    id: 'house-1',
    houseType: null,
    pilotis: {},
    terrainType: 1,
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
  };

  return {
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {
      familyName: 'Família teste',
      selectedPilotiHeights: [1, 1.5, 2],
    },
    house,
    canvas: {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    },
  };
}

function stubFileReaderWithText(content: unknown) {
  class ImmediateFileReader {
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

    readAsText() {
      this.onload?.({target: {result: content}} as unknown as ProgressEvent<FileReader>);
    }
  }

  vi.stubGlobal('FileReader', ImmediateFileReader);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('useRacEditorJsonActions.ts', () => {
  it('exporta documento RAC canônico sem expor Fabric ao hook', () => {
    const canvasDocument: HouseDrawingCanvasDocument = {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    };
    const documentPort: CanvasDocumentPort = {
      exportCanvasDocument: vi.fn(() => canvasDocument),
      loadCanvasDocument: vi.fn(),
      exportImageDataUrl: vi.fn(),
    };
    const {ref} = createCanvasRef(documentPort);
    const setInfoMessage = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:rac-project');
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    const {result} = renderHook(
      () => useRacEditorJsonActions({
        canvasRef: ref,
        setInfoMessage,
        resetContraventamentoFlow: vi.fn(),
        syncContraventamentoElevations: vi.fn(),
      }),
      {wrapper: createWrapper()},
    );

    act(() => {
      result.current.handleExportJSON();
    });

    expect(documentPort.exportCanvasDocument).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:rac-project');
    expect(setInfoMessage).toHaveBeenCalledWith(EDITOR_INFO_MESSAGES.projectSavedAsJson);
    expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.projectExportedSuccessfully);
  });

  it('importa documento RAC e sincroniza fluxos dependentes sem rebuild a partir do canvas', async () => {
    const projectDocument = createDocument();
    const documentPort: CanvasDocumentPort = {
      exportCanvasDocument: vi.fn(),
      loadCanvasDocument: vi.fn().mockResolvedValue(true),
      exportImageDataUrl: vi.fn(),
    };
    const houseDrawingDocumentPort = {
      exportHouseDrawingDocument: vi.fn(),
      importHouseDrawingDocument: vi.fn(),
    };
    const {canvas, ref} = createCanvasRef(documentPort);
    const setInfoMessage = vi.fn();
    const resetContraventamentoFlow = vi.fn();
    const syncContraventamentoElevations = vi.fn();

    stubFileReaderWithText(JSON.stringify(projectDocument));

    const {result} = renderHook(
      () => useRacEditorJsonActions({
        canvasRef: ref,
        setInfoMessage,
        resetContraventamentoFlow,
        syncContraventamentoElevations,
      }),
      {wrapper: createWrapper({houseDrawingDocumentPort})},
    );

    act(() => {
      result.current.handleImportJSON(new File([JSON.stringify(projectDocument)], 'projeto.json', {
        type: 'application/json',
      }));
    });

    await waitFor(() => expect(documentPort.loadCanvasDocument).toHaveBeenCalledWith(projectDocument.canvas));

    expect(resetContraventamentoFlow).toHaveBeenCalled();
    expect(houseDrawingDocumentPort.importHouseDrawingDocument).toHaveBeenCalledWith(projectDocument);
    expect(syncContraventamentoElevations).toHaveBeenCalled();
    expect(canvas.saveHistory).toHaveBeenCalled();
    expect(setInfoMessage).toHaveBeenCalledWith(EDITOR_INFO_MESSAGES.projectLoaded);
    expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.projectLoadedSuccessfully);
  });

  it('rejeita JSON Fabric antigo como formato de projeto', async () => {
    const documentPort: CanvasDocumentPort = {
      exportCanvasDocument: vi.fn(),
      loadCanvasDocument: vi.fn().mockResolvedValue(true),
      exportImageDataUrl: vi.fn(),
    };
    const {ref} = createCanvasRef(documentPort);

    stubFileReaderWithText('{"objects":[]}');

    const {result} = renderHook(
      () => useRacEditorJsonActions({
        canvasRef: ref,
        setInfoMessage: vi.fn(),
        resetContraventamentoFlow: vi.fn(),
        syncContraventamentoElevations: vi.fn(),
      }),
      {wrapper: createWrapper()},
    );

    act(() => {
      result.current.handleImportJSON(new File(['{"objects":[]}'], 'projeto.json', {type: 'application/json'}));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.invalidJsonFile));
    expect(documentPort.loadCanvasDocument).not.toHaveBeenCalled();
  });
});
