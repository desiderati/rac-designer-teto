import {type RefObject, useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';
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

interface UseConstructionSiteManagementControllerArgs {
  canvasRef?: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
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
  const {
    documentSaveStatus,
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

  const exportConstructionRacsZip = useCallback(async (constructionSiteId?: string) => {
    try {
      await flushActiveHouseDocumentSave({force: true});

      const snapshots = constructionSiteManagementPort.getConstructionSiteSnapshots();
      const targetConstructionSite = snapshots.find((snapshot) => snapshot.constructionSite.id === constructionSiteId)
        ?? constructionSiteManagementPort.getConstructionSiteSnapshot();

      if (!targetConstructionSite) {
        toast.error('Nenhuma construção ativa para exportar RACs.');
        return;
      }

      if (targetConstructionSite.constructionSite.status !== 'in_progress') {
        toast.error('A exportação em ZIP só está disponível para construções em andamento.');
        return;
      }

      const [
        {default: JSZip},
        {jsPDF},
        {buildRacPdfZipExport, downloadBlob},
        {renderHouseDrawingCanvasImageDataUrl},
      ] = await Promise.all([
        import('jszip'),
        import('jspdf'),
        import('@/components/rac-editor/lib/rac-pdf-zip-export.ts'),
        import('@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts'),
      ]);

      const result = await buildRacPdfZipExport({
        constructionSite: targetConstructionSite,
        JSZip,
        jsPDF,
        renderCanvasImageDataUrl: renderHouseDrawingCanvasImageDataUrl,
      });

      downloadBlob(result.blob, result.fileName);
      result.exportedHouseIds.forEach((houseId) => {
        constructionSiteManagementPort.markHouseRacPrinted(houseId);
      });

      const failureMessage = result.failures.length > 0
        ? ` ${result.failures.length} falha(s) foram relatadas no ZIP.`
        : '';
      toast.success(`ZIP de RACs gerado com ${result.exportedHouseIds.length} PDF(s).${failureMessage}`);
    } catch (error) {
      console.error('[useConstructionSiteManagementController] Failed to export RAC ZIP:', error);
      toast.error(error instanceof Error && error.message.trim()
        ? error.message
        : 'Falha ao exportar RACs em ZIP.');
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
      createConstructionSite,
      updateActiveConstructionSite: (input: UpdateConstructionSiteInput) => constructionSiteManagementPort.updateActiveConstructionSite(input),
      archiveActiveConstructionSite: () => constructionSiteManagementPort.archiveActiveConstructionSite(),
      archiveConstructionSite,
      unarchiveConstructionSite,
      markConstructionSiteCompleted,
      markConstructionSiteInProgress,
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
      exportConstructionRacsZip,
      markHouseBuilt,
      markHouseDraft,
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
