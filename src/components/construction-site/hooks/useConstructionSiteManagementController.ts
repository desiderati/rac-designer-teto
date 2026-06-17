import {type RefObject, useCallback, useEffect, useRef, useState} from 'react';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';
import type {
  CreateHouseInput,
  CreateConstructionSiteInput,
  CreateMonitorInput,
  UpdateFamilyInput,
  UpdateHouseExtraMaterialsInput,
  UpdateHouseConfigurationInput,
  UpdateConstructionSiteInput,
  UpdateMonitorInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import type {ConstructionSiteState, SiteAssessment} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';

interface UseConstructionSiteManagementControllerArgs {
  canvasRef?: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
}

const DOCUMENT_SAVE_DEBOUNCE_MS = 400;
const DOCUMENT_SAVE_SPINNER_MIN_MS = 300;

interface PendingDocumentSaveWaiter {
  resolve(): void;
  reject(error: unknown): void;
}

export function useConstructionSiteManagementController({
  canvasRef,
}: UseConstructionSiteManagementControllerArgs) {

  const {
    houseDrawingDocumentPort,
    constructionSiteManagementPort,
  } = useEditorPorts();

  const emitHouseStoreChange = useHouseStoreEmitter();
  const [version, setVersion] = useState(0);
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

  useEffect(() => constructionSiteManagementPort.subscribe(() => {
    setVersion((current) => current + 1);
  }), [constructionSiteManagementPort]);

  const setTrackedDocumentSaveStatus = useCallback((status: HouseDocumentSaveStatus) => {
    documentSaveStatusRef.current = status;
    setDocumentSaveStatus(status);
  }, []);

  const loadHouseDocument = useCallback(async (document = constructionSiteManagementPort.getActiveHouseDrawingDocument()) => {
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
    emitHouseStoreChange,
    houseDrawingDocumentPort,
    constructionSiteManagementPort,
    setTrackedDocumentSaveStatus,
  ]);

  const cancelScheduledHydration = useCallback(() => {
    hydrationRunIdRef.current += 1;
    if (hydrationFrameRef.current === null) return;
    window.cancelAnimationFrame(hydrationFrameRef.current);
    hydrationFrameRef.current = null;
  }, []);

  const scheduleHouseDocumentHydration = useCallback((document?: HouseDrawingDocument | null) => {
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
      scheduleHouseDocumentHydration(document);
    }
    return loaded;
  }, [cancelScheduledHydration, loadHouseDocument, scheduleHouseDocumentHydration]);

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
  }, [cancelScheduledHydration, canvasRef, houseDrawingDocumentPort, constructionSiteManagementPort]);

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

  useEffect(() => () => {
    if (documentSaveTimerRef.current !== null) {
      window.clearTimeout(documentSaveTimerRef.current);
      documentSaveTimerRef.current = null;
    }
    pendingDocumentSaveWaitersRef.current.forEach((waiter) => waiter.resolve());
    pendingDocumentSaveWaitersRef.current = [];
  }, []);

  useEffect(() => {
    scheduleHouseDocumentHydration();
    return () => {
      cancelScheduledHydration();
    };
  }, [cancelScheduledHydration, scheduleHouseDocumentHydration]);

  const activateHouse = useCallback(async (constructionSiteId: string, houseId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      const document = constructionSiteManagementPort.activateHouse(constructionSiteId, houseId);
      await loadOrQueueHouseDocument(document);
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const createHouse = useCallback(async (input: CreateHouseInput) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.createHouse(input);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const updateActiveHouseConfiguration = useCallback(async (input: UpdateHouseConfigurationInput) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.updateActiveHouseConfiguration(input);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [
    constructionSiteManagementPort,
    flushActiveHouseDocumentSave,
    loadOrQueueHouseDocument,
    runDocumentTransition,
  ]);

  const duplicateActiveHouse = useCallback(async () => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.duplicateActiveHouse();
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const archiveActiveHouse = useCallback(async () => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.archiveActiveHouse();
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const archiveHouse = useCallback(async (houseId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.archiveHouse(houseId);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const unarchiveHouse = useCallback(async (houseId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.unarchiveHouse(houseId);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const createConstructionSite = useCallback(async (input: CreateConstructionSiteInput) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.createConstructionSite(input);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const archiveConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.archiveConstructionSite(constructionSiteId);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const unarchiveConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      constructionSiteManagementPort.unarchiveConstructionSite(constructionSiteId);
      await loadOrQueueHouseDocument(constructionSiteManagementPort.getActiveHouseDrawingDocument());
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  const activateConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentTransition(async () => {
      await flushActiveHouseDocumentSave({force: true});
      const document = constructionSiteManagementPort.activateConstructionSite(constructionSiteId);
      await loadOrQueueHouseDocument(document);
    });
  }, [loadOrQueueHouseDocument, constructionSiteManagementPort, runDocumentTransition, flushActiveHouseDocumentSave]);

  void version;
  const constructionSite = constructionSiteManagementPort.getConstructionSiteSnapshot();
  const constructionSiteSnapshots = constructionSiteManagementPort.getConstructionSiteSnapshots();

  return {
    constructionSite,
    summaries: constructionSiteManagementPort.getConstructionSiteSummaries(),
    canOpenRacEditor: constructionSiteManagementPort.canOpenRacEditor(),
    constructionGroups: getConstructionGroups(constructionSiteSnapshots, constructionSite),
    documentSaveStatus,
    isDocumentTransitioning,
    saveActiveHouseDocument,
    notifyActiveHouseDocumentChanged,
    flushActiveHouseDocumentSave,
    loadHouseDocument,
    hydrateActiveHouseDocument: scheduleHouseDocumentHydration,
    actions: {
      createConstructionSite,
      updateActiveConstructionSite: (input: UpdateConstructionSiteInput) => constructionSiteManagementPort.updateActiveConstructionSite(input),
      archiveActiveConstructionSite: () => constructionSiteManagementPort.archiveActiveConstructionSite(),
      archiveConstructionSite,
      unarchiveConstructionSite,
      activateConstructionSite,
      createMonitor: (input: CreateMonitorInput) => constructionSiteManagementPort.createMonitor(input),
      updateMonitor: (monitorId: string, input: UpdateMonitorInput) =>
        constructionSiteManagementPort.updateMonitor(monitorId, input),
      inactivateMonitor: (monitorId: string) => constructionSiteManagementPort.inactivateMonitor(monitorId),
      reactivateMonitor: (monitorId: string) => constructionSiteManagementPort.reactivateMonitor(monitorId),
      createHouse,
      duplicateActiveHouse,
      archiveActiveHouse,
      archiveHouse,
      unarchiveHouse,
      activateHouse,
      updateActiveFamily: (input: UpdateFamilyInput) => constructionSiteManagementPort.updateActiveFamily(input),
      updateActiveHouseSiteAssessment: (input: Partial<SiteAssessment>) =>
        constructionSiteManagementPort.updateActiveHouseSiteAssessment(input),
      updateActiveHouseConfiguration,
      updateActiveHouseExtraMaterials: (input: UpdateHouseExtraMaterialsInput) =>
        constructionSiteManagementPort.updateActiveHouseExtraMaterials(input),
    },
  };
}

function getConstructionGroups(constructionSites: ConstructionSiteState[], activeConstructionSite: ConstructionSiteState | null) {
  const activeConstructionSiteId = activeConstructionSite?.constructionSite.id;

  return constructionSites
    .filter((constructionSite) => constructionSite.constructionSite.status !== 'archived')
    .sort((a, b) => getConstructionCode(a).localeCompare(getConstructionCode(b), 'pt-BR'))
    .map((constructionSite) => ({
      id: constructionSite.constructionSite.id,
      code: getConstructionCode(constructionSite),
      communityName: getConstructionSiteCommunityName(constructionSite),
      active: constructionSite.constructionSite.id === activeConstructionSiteId,
      houses: constructionSite.houses
        .filter((house) => house.status !== 'archived')
        .map((house) => ({
          id: house.id,
          label: constructionSite.families.find((family) => family.id === house.familyId)?.name ?? 'Família sem nome',
          active: constructionSite.constructionSite.id === activeConstructionSiteId && house.id === constructionSite.constructionSite.activeHouseId,
        })),
    }));
}

function getConstructionCode(constructionSite: ConstructionSiteState): string {
  return constructionSite.constructionSite.externalCode?.trim() || 'Construção sem código';
}
