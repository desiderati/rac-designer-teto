import {withPreparedHouseRacView} from '@/components/rac-editor/lib/prepared-house-rac.ts';
import {createElement, type RefObject, useCallback, useEffect, useRef, useState} from 'react';
import {RacPdfExportProgress, RAC_PDF_EXPORT_STEPS, createInitialRacPdfExportStatuses, type RacPdfExportStepId} from '@/components/rac-editor/@modals/ui/RacPdfExportProgress.tsx';
import {toast} from '@/components/ui/sonner.tsx';
import {jsPDF} from 'jspdf';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
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
import type {ConstructionSiteState, SiteAssessment} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {useHouseDocumentLifecycle} from '@/components/construction-site/hooks/useHouseDocumentLifecycle.ts';
import {
  buildRacPdfExportChecklist,
  formatRacPdfExportChecklistSummary,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';
import {
  buildRacPdfHouseExport,
  buildRacPdfZipExport,
  downloadBlob,
  type RacPdfHouseExportResult,
} from '@/components/rac-editor/lib/rac-pdf-zip-export.ts';
import {renderHouseDrawingCanvasImageDataUrl} from '@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts';
import {renderHouse3DPdfSnapshotImageDataUrl} from '@/components/rac-editor/@viewer-3d/lib/render-house-3d-pdf-snapshot.tsx';
import {HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION, HOUSE_DRAWING_DOCUMENT_TYPE} from '@/shared/types/house-drawing-document.ts';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {requestChunkRecovery} from '@/shared/lib/runtime-resilience.ts';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';

interface UseConstructionSiteManagementControllerArgs {
  canvasRef?: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
}

function renderPersistedHouse3D(persisted: PersistedHouseRecord) {
  const house = withPreparedHouseRacView(persisted);
  if (!house.drawingDocument.house) return Promise.resolve(null);
  return renderHouse3DPdfSnapshotImageDataUrl({
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {familyName: '', selectedPilotiHeights: [...house.designSettings.selectedPilotiHeights]},
    house: {...house.drawingDocument.house, id: house.id, houseType: house.houseType, terrainType: house.terrainType},
    canvas: house.drawingDocument.canvas,
    viewer3D: house.drawingDocument.viewer3D,
  });
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
  const zipExportInFlight = useRef(false);
  const {
    documentSaveStatus,
    runCanvasDocumentTransaction,
    suspendForFieldAnalysis,
    suspendForManagement,
    resumeAfterFieldAnalysis,
    isDocumentTransitioning,
    saveActiveHouseDocument,
    notifyActiveHouseDocumentChanged,
    flushActiveHouseDocumentSave,
    acknowledgeActiveHouseDocumentSaved,
    loadHouseDocument,
    hydrateActiveHouseDocument,
    runDocumentMutation,
    runDocumentSelection,
  } = useHouseDocumentLifecycle({
    canvasRef,
    houseDrawingDocumentPort,
    constructionSiteManagementPort,
    emitHouseStoreChange,
  });

  useEffect(() => constructionSiteManagementPort.subscribe(() => {
    setVersion((current) => current + 1);
  }), [constructionSiteManagementPort]);

  const activateHouse = useCallback(async (constructionSiteId: string, houseId: string) => {
    await runDocumentSelection(() => constructionSiteManagementPort.activateHouse(constructionSiteId, houseId));
  }, [constructionSiteManagementPort, runDocumentSelection]);

  const activateHouseForManagement = useCallback(async (siteId: string, houseId: string) => {
    await suspendForManagement();
    const document = constructionSiteManagementPort.activateHouse(siteId, houseId);
    if (document) houseDrawingDocumentPort.importHouseDrawingDocument(document);
    setVersion(current => current + 1);
  }, [constructionSiteManagementPort, houseDrawingDocumentPort, suspendForManagement]);

  const openHouseFieldAnalysis = useCallback(async (siteId: string, houseId: string) => {
    await suspendForFieldAnalysis();
    try {
      return constructionSiteManagementPort.getHouseFieldAnalysis(siteId, houseId);
    } catch (error) {
      await resumeAfterFieldAnalysis();
      throw error;
    }
  }, [constructionSiteManagementPort, resumeAfterFieldAnalysis, suspendForFieldAnalysis]);

  const saveHouseFieldAnalysis = useCallback(async (siteId: string, houseId: string, draft: HouseFieldAnalysisDraft) => {
    constructionSiteManagementPort.saveHouseFieldAnalysis(siteId, houseId, draft);
  }, [constructionSiteManagementPort]);

  const createHouse = useCallback(async (input: CreateHouseInput) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.createHouse(input);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const updateActiveHouseConfiguration = useCallback(async (input: UpdateHouseConfigurationInput) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.updateActiveHouseConfiguration(input);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const duplicateActiveHouse = useCallback(async () => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.duplicateActiveHouse();
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const archiveActiveHouse = useCallback(async () => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.archiveActiveHouse();
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const archiveHouse = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.archiveHouse(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const unarchiveHouse = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.unarchiveHouse(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const deleteArchivedHouse = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.deleteArchivedHouse(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const markHouseBuilt = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.markHouseBuilt(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const markHouseDraft = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.markHouseDraft(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const markHouseRacPrinted = useCallback(async (houseId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.markHouseRacPrinted(houseId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const exportHouseRacPdf = useCallback(async (
    constructionSiteId: string,
    houseId: string,
    onPrepared?: (result: RacPdfHouseExportResult) => void | Promise<void>,
  ) => {
    try {
      await flushActiveHouseDocumentSave({force: true});

      const snapshots = constructionSiteManagementPort.getConstructionSiteSnapshots();
      const targetConstructionSite = snapshots.find((snapshot) => snapshot.constructionSite.id === constructionSiteId)
        ?? null;

      if (!targetConstructionSite) {
        toast.error('Nenhuma construção encontrada para imprimir a RAC.');
        return;
      }

      if (targetConstructionSite.constructionSite.status !== 'in_progress') {
        toast.error('A impressão de RAC só está disponível para construções em andamento.');
        return;
      }

      const targetHouse = targetConstructionSite.houses
        .find((house) => house.id === houseId && house.status !== 'archived');
      if (!targetHouse) {
        toast.error('A impressão de RAC só está disponível para casas não arquivadas.');
        return;
      }

      const checklist = buildRacPdfExportChecklist(targetConstructionSite, houseId);
      if (checklist.hasBlockingItems) {
        toast.error(`Checklist da RAC possui pendências obrigatórias: ${formatRacPdfExportChecklistSummary(checklist)}.`);
        return;
      }

      const checklistSummary = formatRacPdfExportChecklistSummary(checklist);
      if (checklistSummary !== 'Checklist sem pendências.') {
        toast.warning(`Checklist da RAC: ${checklistSummary}`);
      }

      const result = await buildRacPdfHouseExport({
        constructionSite: targetConstructionSite,
        houseId,
        jsPDF,
        renderCanvasImageDataUrl: renderHouseDrawingCanvasImageDataUrl,
        renderHouse3DImageDataUrl: renderPersistedHouse3D,
      });

      if (onPrepared) {
        await onPrepared(result);
        return;
      }

      downloadBlob(result.blob, result.fileName);
      constructionSiteManagementPort.markHouseRacPrinted(result.exportedHouseId);
      toast.success('PDF da RAC gerado.');
    } catch (error) {
      console.error('[useConstructionSiteManagementController] Failed to export house RAC PDF:', error);
      requestChunkRecovery(error);
      toast.error(error instanceof Error && error.message.trim()
        ? error.message
        : 'Falha ao imprimir RAC.');
    }
  }, [constructionSiteManagementPort, flushActiveHouseDocumentSave]);

  const exportConstructionRacsZip = useCallback(async (constructionSiteId?: string) => {
    if (zipExportInFlight.current) return;
    zipExportInFlight.current = true;
    const id = `construction-racs-${Date.now()}`;
    let statuses = createInitialRacPdfExportStatuses();
    let phase: RacPdfExportStepId = 'capture-canvas';
    let dismissed = false;
    const options = {id, onDismiss: () => {dismissed = true;}};
    const updateProgress = (step: RacPdfExportStepId, _houseId = '', index = 0, total = 0) => {
      phase = step;
      const active = RAC_PDF_EXPORT_STEPS.findIndex(entry => entry.id === step);
      statuses = Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}, position) => [id, position < active ? 'success' : position === active ? 'active' : 'pending'])) as typeof statuses;
      if (!dismissed) toast.loading(() => createElement(RacPdfExportProgress, {statuses, archive: true, houseLabel: total ? `Casa ${index} de ${total}` : undefined}), options);
    };
    updateProgress('capture-canvas');
    try {
      await flushActiveHouseDocumentSave({force: true});

      const snapshots = constructionSiteManagementPort.getConstructionSiteSnapshots();
      const targetConstructionSite = snapshots.find((snapshot) => snapshot.constructionSite.id === constructionSiteId)
        ?? constructionSiteManagementPort.getConstructionSiteSnapshot();

      if (!targetConstructionSite) {
        throw new Error('Nenhuma construção ativa para exportar RACs.');
      }

      if (targetConstructionSite.constructionSite.status !== 'in_progress') {
        throw new Error('A exportação em ZIP só está disponível para construções em andamento.');
      }

      const {default: JSZip} = await import('jszip');

      const result = await buildRacPdfZipExport({
        onProgress: updateProgress,
        constructionSite: targetConstructionSite,
        JSZip,
        jsPDF,
        renderCanvasImageDataUrl: renderHouseDrawingCanvasImageDataUrl,
        renderHouse3DImageDataUrl: renderPersistedHouse3D,
      });

      downloadBlob(result.blob, result.fileName);
      result.exportedHouseIds.forEach((houseId) => {
        constructionSiteManagementPort.markHouseRacPrinted(houseId);
      });

      const failureMessage = result.failures.length > 0
        ? ` ${result.failures.length} falha(s) foram relatadas no ZIP.`
        : '';
      statuses = Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}) => [id, 'success'])) as typeof statuses;
      if (!dismissed) {
        const content = () => createElement(RacPdfExportProgress, {statuses, archive: true, resultMessage: `ZIP de RACs gerado com ${result.exportedHouseIds.length} PDF(s).${failureMessage}`});
        if (result.failures.length) toast.warning(content, options);
        else toast.success(content, options);
      }
    } catch (error) {
      console.error('[useConstructionSiteManagementController] Failed to export RAC ZIP:', error);
      requestChunkRecovery(error);
      statuses = {...statuses, [phase]: 'error'};
      const resultMessage = error instanceof Error && error.message.trim() ? error.message : 'Falha ao exportar RACs em ZIP.';
      if (!dismissed) toast.error(() => createElement(RacPdfExportProgress, {statuses, archive: true, resultMessage}), options);
    } finally {
      zipExportInFlight.current = false;
    }
  }, [constructionSiteManagementPort, flushActiveHouseDocumentSave]);

  const createConstructionSite = useCallback(async (input: CreateConstructionSiteInput) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.createConstructionSite(input);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const archiveConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.archiveConstructionSite(constructionSiteId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const unarchiveConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.unarchiveConstructionSite(constructionSiteId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const deleteArchivedConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.deleteArchivedConstructionSite(constructionSiteId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const markConstructionSiteCompleted = useCallback(async (constructionSiteId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.markConstructionSiteCompleted(constructionSiteId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const markConstructionSiteInProgress = useCallback(async (constructionSiteId: string) => {
    await runDocumentMutation(() => {
      constructionSiteManagementPort.markConstructionSiteInProgress(constructionSiteId);
    });
  }, [constructionSiteManagementPort, runDocumentMutation]);

  const activateConstructionSite = useCallback(async (constructionSiteId: string) => {
    await runDocumentSelection(() => constructionSiteManagementPort.activateConstructionSite(constructionSiteId));
  }, [constructionSiteManagementPort, runDocumentSelection]);

  const prepareRacEditorOpening = useCallback(() => (
    constructionSiteManagementPort.prepareRacEditorOpening()
  ), [constructionSiteManagementPort]);

  void version;
  const constructionSite = constructionSiteManagementPort.getConstructionSiteSnapshot();
  const constructionSiteSnapshots = constructionSiteManagementPort.getConstructionSiteSnapshots();

  return {
    runCanvasDocumentTransaction,
    constructionSite,
    summaries: constructionSiteManagementPort.getConstructionSiteSummaries(),
    canOpenRacEditor: constructionSiteManagementPort.canOpenRacEditor(),
    constructionGroups: getConstructionGroups(constructionSiteSnapshots, constructionSite),
    documentSaveStatus,
    isDocumentTransitioning,
    saveActiveHouseDocument,
    notifyActiveHouseDocumentChanged,
    flushActiveHouseDocumentSave,
    acknowledgeActiveHouseDocumentSaved,
    loadHouseDocument,
    hydrateActiveHouseDocument,
    prepareRacEditorOpening,
    actions: {
      resetHouseDefinition: (houseId: string) => runDocumentMutation(() => constructionSiteManagementPort.resetHouseDefinition(houseId)),
      openHouseFieldAnalysis,
      saveHouseFieldAnalysis,
      closeHouseFieldAnalysis: resumeAfterFieldAnalysis,
      createConstructionSite,
      updateActiveConstructionSite: (input: UpdateConstructionSiteInput) => constructionSiteManagementPort.updateActiveConstructionSite(input),
      archiveActiveConstructionSite: () => constructionSiteManagementPort.archiveActiveConstructionSite(),
      archiveConstructionSite,
      unarchiveConstructionSite,
      deleteArchivedConstructionSite,
      markConstructionSiteCompleted,
      markConstructionSiteInProgress,
      activateConstructionSite,
      createMonitor: (input: CreateMonitorInput) => constructionSiteManagementPort.createMonitor(input),
      updateMonitor: (monitorId: string, input: UpdateMonitorInput) =>
        constructionSiteManagementPort.updateMonitor(monitorId, input),
      inactivateMonitor: (monitorId: string) => constructionSiteManagementPort.inactivateMonitor(monitorId),
      reactivateMonitor: (monitorId: string) => constructionSiteManagementPort.reactivateMonitor(monitorId),
      deleteInactiveMonitor: (monitorId: string) => constructionSiteManagementPort.deleteInactiveMonitor(monitorId),
      createHouse,
      duplicateActiveHouse,
      archiveActiveHouse,
      archiveHouse,
      unarchiveHouse,
      deleteArchivedHouse,
      exportHouseRacPdf,
      exportConstructionRacsZip,
      markHouseRacPrinted,
      markHouseBuilt,
      markHouseDraft,
      activateHouse,
      activateHouseForManagement,
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
      documentVersion: constructionSite.constructionSite.documentVersion,
      canAddHouse: constructionSite.constructionSite.status === 'in_progress',
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
