import {act, renderHook, waitFor} from '@testing-library/react';
import {createElement, type ReactNode, type RefObject} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast} from 'sonner';
import {createEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useRacEditorJsonActions} from '@/components/rac-editor/hooks/useRacEditorJsonActions.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createWrapper() {
  const ports = createEditorPorts();

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
  it('exporta o JSON atual por CanvasDocumentPort sem expor Fabric ao hook', () => {
    const documentPort: CanvasDocumentPort = {
      exportProjectJson: vi.fn(() => '{"objects":[]}'),
      loadProjectJson: vi.fn(),
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
        houseWritePort: {rebuildHouseFromCanvas: vi.fn()},
      }),
      {wrapper: createWrapper()},
    );

    act(() => {
      result.current.handleExportJSON();
    });

    expect(documentPort.exportProjectJson).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:rac-project');
    expect(setInfoMessage).toHaveBeenCalledWith(EDITOR_INFO_MESSAGES.projectSavedAsJson);
    expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.projectExportedSuccessfully);
  });

  it('importa JSON, reconstrói a casa e sincroniza fluxos dependentes', async () => {
    const documentPort: CanvasDocumentPort = {
      exportProjectJson: vi.fn(),
      loadProjectJson: vi.fn().mockResolvedValue(true),
      exportImageDataUrl: vi.fn(),
    };
    const {canvas, ref} = createCanvasRef(documentPort);
    const setInfoMessage = vi.fn();
    const resetContraventamentoFlow = vi.fn();
    const syncContraventamentoElevations = vi.fn();
    const rebuildHouseFromCanvas = vi.fn();

    stubFileReaderWithText('{"objects":[]}');

    const {result} = renderHook(
      () => useRacEditorJsonActions({
        canvasRef: ref,
        setInfoMessage,
        resetContraventamentoFlow,
        syncContraventamentoElevations,
        houseWritePort: {rebuildHouseFromCanvas},
      }),
      {wrapper: createWrapper()},
    );

    act(() => {
      result.current.handleImportJSON(new File(['{"objects":[]}'], 'projeto.json', {type: 'application/json'}));
    });

    await waitFor(() => expect(documentPort.loadProjectJson).toHaveBeenCalledWith('{"objects":[]}'));

    expect(resetContraventamentoFlow).toHaveBeenCalled();
    expect(rebuildHouseFromCanvas).toHaveBeenCalled();
    expect(syncContraventamentoElevations).toHaveBeenCalled();
    expect(canvas.saveHistory).toHaveBeenCalled();
    expect(setInfoMessage).toHaveBeenCalledWith(EDITOR_INFO_MESSAGES.projectLoaded);
    expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.projectLoadedSuccessfully);
  });
});
