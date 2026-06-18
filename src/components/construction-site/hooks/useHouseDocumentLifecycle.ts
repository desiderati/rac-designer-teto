import {type RefObject, useCallback, useEffect, useRef, useState} from 'react';
import type {EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';

const DOCUMENT_SAVE_DEBOUNCE_MS = 400;
const DOCUMENT_SAVE_SPINNER_MIN_MS = 300;

interface PendingDocumentSaveWaiter {
  resolve(): void;
  reject(error: unknown): void;
}

interface UseHouseDocumentLifecycleArgs {
  canvasRef?: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  houseDrawingDocumentPort: EditorPorts['houseDrawingDocumentPort'];
  constructionSiteManagementPort: EditorPorts['constructionSiteManagementPort'];
  emitHouseStoreChange: () => void;
}

export function useHouseDocumentLifecycle({
  canvasRef,
  houseDrawingDocumentPort,
  constructionSiteManagementPort,
  emitHouseStoreChange,
}: UseHouseDocumentLifecycleArgs) {
  const [documentSaveStatus, setDocumentSaveStatus] = useState<HouseDocumentSaveStatus>('saved');
  const [isDocumentTransitioning, setIsDocumentTransitioning] = useState(false);
  const pendingHouseDocumentRef = useRef<HouseDrawingDocument | null>(null);
  const hydrationFrameRef = useRef<number | null>(null);
  const hydrationRunIdRef = useRef(0);
  const documentTransitionRef = useRef<Promise<void>>(Promise.resolve());
  const documentTransitionDepthRef = useRef(0);
  const documentSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const documentRevisionRef = useRef(0);
  const savedDocumentRevisionRef = useRef(0);
  const documentSaveStatusRef = useRef<HouseDocumentSaveStatus>('saved');
  const documentSaveTimerRef = useRef<number | null>(null);
  const pendingDocumentSaveWaitersRef = useRef<PendingDocumentSaveWaiter[]>([]);

  const setTrackedDocumentSaveStatus = useCallback((status: HouseDocumentSaveStatus) => {
    documentSaveStatusRef.current = status;
    setDocumentSaveStatus(status);
  }, []);

  const loadHouseDocument = useCallback(async (
    document = constructionSiteManagementPort.getActiveHouseDrawingDocument(),
  ) => {
    if (!document || !canvasRef) return false;
    const documentPort = canvasRef.current?.createDocumentPort();
    if (!documentPort) return false;

    const loaded = await documentPort.loadCanvasDocument(document.canvas);
    if (!loaded) return false;

    houseDrawingDocumentPort.importHouseDrawingDocument(document);
    emitHouseStoreChange();
    canvasRef.current?.saveHistory({notifyDocumentChange: false});
    documentRevisionRef.current = 0;
    savedDocumentRevisionRef.current = 0;
    setTrackedDocumentSaveStatus('saved');
    return true;
  }, [
    canvasRef,
    constructionSiteManagementPort,
    emitHouseStoreChange,
    houseDrawingDocumentPort,
    setTrackedDocumentSaveStatus,
  ]);

  const cancelScheduledHydration = useCallback(() => {
    hydrationRunIdRef.current += 1;
    if (hydrationFrameRef.current === null) return;
    window.cancelAnimationFrame(hydrationFrameRef.current);
    hydrationFrameRef.current = null;
  }, []);

  const hydrateActiveHouseDocument = useCallback((document?: HouseDrawingDocument | null) => {
    if (!canvasRef) return;
    const nextDocument = document ?? pendingHouseDocumentRef.current
      ?? constructionSiteManagementPort.getActiveHouseDrawingDocument();
    if (!nextDocument) return;

    pendingHouseDocumentRef.current = nextDocument;
    cancelScheduledHydration();

    const hydrationRunId = hydrationRunIdRef.current + 1;
    hydrationRunIdRef.current = hydrationRunId;
    let attempts = 0;
    const hydrate = () => {
      if (hydrationRunIdRef.current !== hydrationRunId) return;
      hydrationFrameRef.current = null;
      const pendingDocument = pendingHouseDocumentRef.current;
      if (!pendingDocument) return;

      void loadHouseDocument(pendingDocument).then((loaded) => {
        if (hydrationRunIdRef.current !== hydrationRunId) return;
        if (loaded) {
          pendingHouseDocumentRef.current = null;
          return;
        }

        attempts += 1;
        if (attempts <= 60) {
          hydrationFrameRef.current = window.requestAnimationFrame(hydrate);
        }
      });
    };

    hydrationFrameRef.current = window.requestAnimationFrame(hydrate);
  }, [cancelScheduledHydration, canvasRef, constructionSiteManagementPort, loadHouseDocument]);

  const loadOrQueueHouseDocument = useCallback(async (document: HouseDrawingDocument | null) => {
    cancelScheduledHydration();

    if (!document) {
      pendingHouseDocumentRef.current = null;
      return false;
    }

    pendingHouseDocumentRef.current = document;
    const loaded = await loadHouseDocument(document);
    if (loaded) {
      pendingHouseDocumentRef.current = null;
    } else {
      hydrateActiveHouseDocument(document);
    }
    return loaded;
  }, [cancelScheduledHydration, hydrateActiveHouseDocument, loadHouseDocument]);

  const runDocumentTransition = useCallback((transition: () => Promise<void>) => {
    const nextTransition = documentTransitionRef.current
      .catch(() => undefined)
      .then(async () => {
        documentTransitionDepthRef.current += 1;
        setIsDocumentTransitioning(true);

        try {
          await transition();
        } finally {
          documentTransitionDepthRef.current -= 1;
          if (documentTransitionDepthRef.current <= 0) {
            documentTransitionDepthRef.current = 0;
            setIsDocumentTransitioning(false);
          }
        }
      });
    documentTransitionRef.current = nextTransition.catch(() => undefined);
    return nextTransition;
  }, []);

  const saveActiveHouseDocument = useCallback(() => {
    cancelScheduledHydration();

    const canvasDocument = canvasRef?.current?.createDocumentPort()?.exportCanvasDocument();
    if (!canvasDocument) return null;

    const activeHouseDocument = houseDrawingDocumentPort.exportHouseDrawingDocument(canvasDocument);
    if (!activeHouseDocument) return null;

    constructionSiteManagementPort.saveActiveHouseDrawingDocument(activeHouseDocument);
    return activeHouseDocument;
  }, [cancelScheduledHydration, canvasRef, constructionSiteManagementPort, houseDrawingDocumentPort]);

  const saveActiveHouseDocumentRevision = useCallback(async (revision: number) => {
    setTrackedDocumentSaveStatus('saving');

    try {
      const savedDocument = saveActiveHouseDocument();
      if (!savedDocument) {
        setTrackedDocumentSaveStatus(
          documentRevisionRef.current > savedDocumentRevisionRef.current ? 'dirty' : 'saved',
        );
        return null;
      }

      savedDocumentRevisionRef.current = Math.max(savedDocumentRevisionRef.current, revision);
      await new Promise((resolve) => window.setTimeout(resolve, DOCUMENT_SAVE_SPINNER_MIN_MS));
      setTrackedDocumentSaveStatus(documentRevisionRef.current === revision ? 'saved' : 'saving');
      return savedDocument;
    } catch (error) {
      setTrackedDocumentSaveStatus('error');
      throw error;
    }
  }, [saveActiveHouseDocument, setTrackedDocumentSaveStatus]);

  const runPendingDocumentSave = useCallback(() => {
    if (documentSaveTimerRef.current !== null) {
      window.clearTimeout(documentSaveTimerRef.current);
      documentSaveTimerRef.current = null;
    }

    const waiters = pendingDocumentSaveWaitersRef.current;
    pendingDocumentSaveWaitersRef.current = [];
    const revision = documentRevisionRef.current;
    const queuedSave = documentSaveQueueRef.current
      .catch(() => undefined)
      .then(() => saveActiveHouseDocumentRevision(revision));

    documentSaveQueueRef.current = queuedSave.then(() => undefined).catch(() => undefined);
    void queuedSave.then(
      () => {
        waiters.forEach((waiter) => waiter.resolve());
      },
      (error) => {
        waiters.forEach((waiter) => waiter.reject(error));
      },
    );

    return queuedSave;
  }, [saveActiveHouseDocumentRevision]);

  const scheduleActiveHouseDocumentSave = useCallback(() => {
    const queuedSave = new Promise<void>((resolve, reject) => {
      pendingDocumentSaveWaitersRef.current.push({resolve, reject});
    });

    if (documentSaveTimerRef.current !== null) {
      window.clearTimeout(documentSaveTimerRef.current);
    }

    documentSaveTimerRef.current = window.setTimeout(() => {
      void runPendingDocumentSave();
    }, DOCUMENT_SAVE_DEBOUNCE_MS);

    return queuedSave;
  }, [runPendingDocumentSave]);

  const notifyActiveHouseDocumentChanged = useCallback(() => {
    documentRevisionRef.current += 1;
    setTrackedDocumentSaveStatus('saving');

    return scheduleActiveHouseDocumentSave();
  }, [scheduleActiveHouseDocumentSave, setTrackedDocumentSaveStatus]);

  const flushActiveHouseDocumentSave = useCallback(async (options: { force?: boolean } = {}) => {
    let pendingSaveResult: HouseDrawingDocument | null = null;
    if (documentSaveTimerRef.current !== null) {
      pendingSaveResult = await runPendingDocumentSave().catch(() => null);
    }

    await documentSaveQueueRef.current.catch(() => undefined);

    const currentRevision = documentRevisionRef.current;
    const mustSave = (options.force && pendingSaveResult === null)
      || currentRevision > savedDocumentRevisionRef.current
      || documentSaveStatusRef.current === 'dirty'
      || documentSaveStatusRef.current === 'error';

    if (!mustSave) return pendingSaveResult;

    return saveActiveHouseDocumentRevision(currentRevision);
  }, [runPendingDocumentSave, saveActiveHouseDocumentRevision]);

  const runDocumentMutation = useCallback(async (
    mutate: () => HouseDrawingDocument | null | void,
  ) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      const mutationDocument = mutate();
      const document = mutationDocument === undefined
        ? constructionSiteManagementPort.getActiveHouseDrawingDocument()
        : mutationDocument;
      await loadOrQueueHouseDocument(document);
    });
  }, [
    constructionSiteManagementPort,
    flushActiveHouseDocumentSave,
    loadOrQueueHouseDocument,
    runDocumentTransition,
  ]);

  useEffect(() => () => {
    if (documentSaveTimerRef.current !== null) {
      window.clearTimeout(documentSaveTimerRef.current);
      documentSaveTimerRef.current = null;
    }
    pendingDocumentSaveWaitersRef.current.forEach((waiter) => waiter.resolve());
    pendingDocumentSaveWaitersRef.current = [];
  }, []);

  useEffect(() => {
    hydrateActiveHouseDocument();
    return () => {
      cancelScheduledHydration();
    };
  }, [cancelScheduledHydration, hydrateActiveHouseDocument]);

  return {
    documentSaveStatus,
    isDocumentTransitioning,
    saveActiveHouseDocument,
    notifyActiveHouseDocumentChanged,
    flushActiveHouseDocumentSave,
    loadHouseDocument,
    hydrateActiveHouseDocument,
    runDocumentMutation,
  };
}
