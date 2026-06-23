import {ArrowLeft} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useConstructionSiteManagementNavigation} from '@/components/construction-site/hooks/useConstructionSiteManagementNavigation.ts';
import {GRIDDED_WORKSPACE_STYLE} from '@/shared/ui/workspace-style.ts';
import type {ConstructionSiteState, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';
import {HEADER_ACTION_BUTTON_CLASS} from '@/components/construction-site/ui/lib/constants.ts';
import {ConstructionFormScreen} from './ConstructionFormScreen.tsx';
import {ConstructionListScreen} from './ConstructionListScreen.tsx';
import {HouseConfigurationScreen} from './HouseConfigurationScreen.tsx';
import {HouseExtraMaterialsScreen} from './HouseExtraMaterialsScreen.tsx';
import {HousesScreen} from './HousesScreen.tsx';
import {MonitorFormScreen} from './MonitorFormScreen.tsx';
import {MonitorsScreen} from './MonitorsScreen.tsx';
import {
  ConstructionStatusDialog,
  HouseStatusDialog,
  MonitorStatusDialog,
  UnsavedChangesDialog,
} from '@/components/construction-site/ui/lib/status-dialogs.tsx';
import {EmptyState, PrimaryButton} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import type {ConstructionSiteManagementActions, ConstructionSiteManagementScreen} from '@/components/construction-site/ui/lib/types.ts';
import {getScreenSubtitle, getScreenTitle} from '@/components/construction-site/ui/lib/view-model.ts';
import {getVisibleTargetRect} from '@/components/guided-tour/lib/guided-tour-targets.ts';
import {
  GUIDED_TOUR_COMPLETED_EVENT,
  isGuidedTourCompleted,
} from '@/components/guided-tour/store/guided-tour-storage.ts';

const CONSTRUCTION_ADD_TOUR_SEGMENT = {
  key: 'construction-add',
  eventName: 'rac:construction-add-tour-ready',
  kind: 'construction-add',
  persistKey: 'guided-tour:rac-construction-add:completed',
  storageRevision: 'construction-add-v1',
  targetIds: ['rac-construction-add'],
} as const;
const CONSTRUCTION_ACTIONS_TOUR_SEGMENT = {
  key: 'construction-actions',
  eventName: 'rac:construction-actions-tour-ready',
  kind: 'construction-actions',
  persistKey: 'guided-tour:rac-construction-actions:completed',
  storageRevision: 'construction-actions-v1',
  targetIds: [
    'rac-construction-monitors',
    'rac-construction-houses',
    'rac-construction-completed',
    'rac-construction-archive',
  ],
} as const;
const CONSTRUCTION_BACK_TO_CANVAS_TOUR_SEGMENT = {
  key: 'construction-back-to-canvas',
  eventName: 'rac:construction-back-to-canvas-tour-ready',
  kind: 'construction-back-to-canvas',
  persistKey: 'guided-tour:rac-construction-back-to-canvas:completed',
  storageRevision: 'construction-back-to-canvas-v1',
  targetIds: ['rac-construction-back-to-canvas'],
} as const;
const HOUSE_ADD_TOUR_SEGMENT = {
  key: 'house-add',
  eventName: 'rac:house-add-tour-ready',
  kind: 'house-add',
  persistKey: 'guided-tour:rac-house-add:completed',
  storageRevision: 'house-add-v1',
  targetIds: ['rac-house-add'],
} as const;
const HOUSE_ACTIONS_TOUR_SEGMENT = {
  key: 'house-actions',
  eventName: 'rac:house-actions-tour-ready',
  kind: 'house-actions',
  persistKey: 'guided-tour:rac-house-actions:completed',
  storageRevision: 'house-actions-v1',
  targetIds: [
    'rac-house-status',
    'rac-house-difficulty',
    'rac-house-extra-materials',
    'rac-house-built',
    'rac-house-archive',
    'rac-house-back',
  ],
} as const;
const CONSTRUCTION_TOUR_SEGMENTS = [
  CONSTRUCTION_ADD_TOUR_SEGMENT,
  CONSTRUCTION_ACTIONS_TOUR_SEGMENT,
  CONSTRUCTION_BACK_TO_CANVAS_TOUR_SEGMENT,
] as const;
const HOUSE_TOUR_SEGMENTS = [
  HOUSE_ADD_TOUR_SEGMENT,
  HOUSE_ACTIONS_TOUR_SEGMENT,
] as const;
type GuidedTourSegment =
  | typeof CONSTRUCTION_TOUR_SEGMENTS[number]
  | typeof HOUSE_TOUR_SEGMENTS[number];
const GUIDED_TOUR_TARGET_COLLECTION_MAX_ATTEMPTS = 12;

export interface ConstructionSiteManagementPanelProps {
  constructionSite: ConstructionSiteState | null;
  summaries: ConstructionSiteSummary[];
  canOpenRacEditor?: boolean;
  onBackToCanvas?: () => void;
  actions: ConstructionSiteManagementActions;
  initialScreen?: ConstructionSiteManagementScreen;
}

type PendingNavigation = () => void | Promise<void>;

export function ConstructionSiteManagementPanel({
  constructionSite,
  summaries,
  canOpenRacEditor = false,
  onBackToCanvas,
  actions,
  initialScreen,
}: ConstructionSiteManagementPanelProps) {

  const navigation = useConstructionSiteManagementNavigation({
    constructionSite,
    summaries,
    canOpenRacEditor,
    onBackToCanvas,
    actions,
    initialScreen,
  });
  const screenTitle = getScreenTitle(navigation.screen, navigation.constructionLabel);
  const isBackToCanvasButton = navigation.screen === 'construction-list'
    && canOpenRacEditor
    && Boolean(onBackToCanvas);
  const backButtonGuidedTourId = getBackButtonGuidedTourId(navigation.screen, isBackToCanvasButton);
  const selectedConstructionStatus = navigation.selectedSummary?.status
    ?? constructionSite?.constructionSite.status;
  const isSelectedConstructionReadOnly =
    selectedConstructionStatus === 'archived' || selectedConstructionStatus === 'completed';
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingUnsavedNavigation, setPendingUnsavedNavigation] = useState<PendingNavigation | null>(null);
  const [guidedTourCompletionVersion, setGuidedTourCompletionVersion] = useState(0);
  const hasUnsavedChangesRef = useRef(false);
  const dispatchedGuidedTourSegmentsRef = useRef<Set<string>>(new Set());

  const updateUnsavedChanges = useCallback((isDirty: boolean) => {
    hasUnsavedChangesRef.current = isDirty;
    setHasUnsavedChanges(isDirty);
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    hasUnsavedChangesRef.current = false;
    setHasUnsavedChanges(false);
    setPendingUnsavedNavigation(null);
  }, []);

  const requestNavigation = useCallback((action: PendingNavigation) => {
    if (hasUnsavedChangesRef.current) {
      setPendingUnsavedNavigation(() => action);
      return;
    }

    void action();
  }, []);

  const finishFormNavigation = useCallback((action: PendingNavigation) => {
    clearUnsavedChanges();
    void action();
  }, [clearUnsavedChanges]);

  const cancelUnsavedNavigation = useCallback(() => {
    setPendingUnsavedNavigation(null);
  }, []);

  const confirmUnsavedNavigation = useCallback(() => {
    const action = pendingUnsavedNavigation;
    clearUnsavedChanges();
    if (action) void action();
  }, [clearUnsavedChanges, pendingUnsavedNavigation]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleGuidedTourCompleted = () => {
      setGuidedTourCompletionVersion((version) => version + 1);
    };

    document.addEventListener(GUIDED_TOUR_COMPLETED_EVENT, handleGuidedTourCompleted);
    return () => document.removeEventListener(GUIDED_TOUR_COMPLETED_EVENT, handleGuidedTourCompleted);
  }, []);

  useEffect(() => {
    if (navigation.screen !== 'construction-list') return;

    return scheduleGuidedTourWhenTargetsReady(() => collectNextGuidedTourSegment([
      {segment: CONSTRUCTION_ADD_TOUR_SEGMENT, enabled: true},
      {segment: CONSTRUCTION_ACTIONS_TOUR_SEGMENT, enabled: summaries.some((summary) => summary.status !== 'archived')},
      {segment: CONSTRUCTION_BACK_TO_CANVAS_TOUR_SEGMENT, enabled: isBackToCanvasButton},
    ], dispatchedGuidedTourSegmentsRef.current), ({segment, targets}) => {
      dispatchedGuidedTourSegmentsRef.current.add(segment.key);
      document.dispatchEvent(new CustomEvent(segment.eventName, {
        detail: {
          kind: segment.kind,
          targets,
        },
      }));
    });
  }, [guidedTourCompletionVersion, isBackToCanvasButton, navigation.screen, summaries]);

  useEffect(() => {
    if (navigation.screen !== 'houses') return;

    return scheduleGuidedTourWhenTargetsReady(() => collectNextGuidedTourSegment([
      {segment: HOUSE_ADD_TOUR_SEGMENT, enabled: true},
      {segment: HOUSE_ACTIONS_TOUR_SEGMENT, enabled: Boolean(constructionSite?.houses.some((house) => house.status !== 'archived'))},
    ], dispatchedGuidedTourSegmentsRef.current), ({segment, targets}) => {
      dispatchedGuidedTourSegmentsRef.current.add(segment.key);
      document.dispatchEvent(new CustomEvent(segment.eventName, {
        detail: {
          kind: segment.kind,
          targets,
        },
      }));
    });
  }, [constructionSite?.houses, guidedTourCompletionVersion, navigation.screen]);

  return (
    <main
      data-testid='construction-management-shell'
      className='h-full overflow-x-hidden overflow-y-auto px-4 py-10 sm:px-6 lg:px-10'
      style={GRIDDED_WORKSPACE_STYLE}
    >
      <div
        data-testid='construction-management-card'
        className='mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-4xl flex-col rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8'
      >
        <header className='mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5'>
          <div
            data-testid='construction-management-header-row'
            className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3'
          >
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              {navigation.canNavigateBack ? (
                <button
                  type='button'
                  onClick={() => requestNavigation(navigation.navigateBack)}
                  aria-label='Voltar'
                  data-guided-tour-id={backButtonGuidedTourId}
                  className='grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  <ArrowLeft className='h-5 w-5'/>
                </button>
              ) : null}
              <div className='min-w-0 flex-1'>
                <h1
                  data-testid='construction-management-title'
                  title={screenTitle}
                  className='truncate text-2xl font-semibold text-slate-950'
                >
                  {screenTitle}
                </h1>
                <p className='mt-1 max-w-2xl text-sm leading-6 text-slate-600'>
                  {getScreenSubtitle(navigation.screen)}
                </p>
              </div>
            </div>
            <HeaderAction
              screen={navigation.screen}
              disabled={isSelectedConstructionReadOnly}
              onAddConstruction={() => navigation.setScreen('construction-create')}
              onAddHouse={navigation.openHouseCreate}
              onAddMonitor={navigation.openMonitorCreate}
            />
          </div>
        </header>

        {navigation.screen === 'construction-list' ? (
          <ConstructionListScreen
            summaries={summaries}
            activeConstructionId={constructionSite?.constructionSite.id}
            onOpenConstruction={navigation.openConstructionDetail}
            onOpenConstructionHouses={navigation.openConstructionHouses}
            onOpenConstructionMonitors={navigation.openConstructionMonitors}
            onRequestStatusChange={navigation.requestConstructionStatusChange}
          />
        ) : null}

        {navigation.screen === 'construction-create' ? (
          <ConstructionFormScreen
            mode='create'
            externalCode=''
            unavailableExternalCodes={summaries.map((summary) => summary.externalCode.trim().toUpperCase())}
            photoDataUrl=''
            constructionDate=''
            communityName=''
            onSubmit={async (input) => {
              await actions.createConstructionSite(input);
              finishFormNavigation(navigation.showConstructionList);
            }}
            onDirtyChange={updateUnsavedChanges}
          />
        ) : null}

        {navigation.screen === 'construction-detail' ? (
          navigation.selectedSummary || constructionSite ? (
            <ConstructionFormScreen
              mode='edit'
              externalCode={navigation.selectedConstructionFields.externalCode}
              photoDataUrl={navigation.selectedConstructionFields.photoDataUrl}
              constructionDate={navigation.selectedConstructionFields.constructionDate}
              communityName={navigation.selectedConstructionFields.communityName}
              onSubmit={(input) => {
                actions.updateActiveConstructionSite(input);
                finishFormNavigation(navigation.showConstructionList);
              }}
              onDirtyChange={updateUnsavedChanges}
              readOnly={isSelectedConstructionReadOnly}
            />
          ) : (
            <EmptyState
              title='Nenhuma construção selecionada'
              description='Selecione uma Construção TETO na listagem para editar.'
            />
          )
        ) : null}

        {navigation.screen === 'monitors' ? (
          constructionSite ? (
            <MonitorsScreen
              constructionSite={constructionSite}
              onEditMonitor={navigation.openMonitorDetail}
              onRequestMonitorStatusChange={navigation.requestMonitorStatusChange}
              readOnly={isSelectedConstructionReadOnly}
            />
          ) : (
            <EmptyState title='Nenhuma construção ativa' description='Crie uma Construção TETO antes de cadastrar monitores.'/>
          )
        ) : null}

        {navigation.screen === 'monitor-create' && constructionSite ? (
          <MonitorFormScreen
            mode='create'
            constructionSite={constructionSite}
            monitor={null}
            onSave={async (input) => {
              await actions.createMonitor(input);
              finishFormNavigation(navigation.showMonitors);
            }}
            onDirtyChange={updateUnsavedChanges}
            readOnly={isSelectedConstructionReadOnly}
          />
        ) : null}

        {navigation.screen === 'monitor-detail' && constructionSite && navigation.selectedMonitor ? (
          <MonitorFormScreen
            mode='edit'
            constructionSite={constructionSite}
            monitor={navigation.selectedMonitor}
            onSave={(input) => {
              if (!navigation.selectedMonitor) return;
              actions.updateMonitor(navigation.selectedMonitor.id, input);
              finishFormNavigation(navigation.showMonitors);
            }}
            onDirtyChange={updateUnsavedChanges}
            readOnly={isSelectedConstructionReadOnly}
          />
        ) : null}

        {navigation.screen === 'houses' ? (
          constructionSite ? (
            <HousesScreen
              constructionSite={constructionSite}
              activeHouse={navigation.activeHouse}
              onEditHouse={navigation.openHouseDetail}
              onOpenHouseExtraMaterials={navigation.openHouseExtraMaterials}
              onRequestHouseStatusChange={navigation.requestHouseStatusChange}
              readOnly={isSelectedConstructionReadOnly}
            />
          ) : (
            <EmptyState title='Nenhuma construção ativa' description='Crie uma Construção TETO antes de cadastrar casas.'/>
          )
        ) : null}

        {navigation.screen === 'house-create' && constructionSite ? (
          <HouseConfigurationScreen
            mode='create'
            constructionSite={constructionSite}
            house={null}
            onSave={async (input) => {
              await actions.createHouse(input);
              finishFormNavigation(navigation.showHouses);
            }}
            onDirtyChange={updateUnsavedChanges}
            readOnly={isSelectedConstructionReadOnly}
          />
        ) : null}

        {navigation.screen === 'house-detail' && constructionSite && navigation.selectedHouse ? (
          <HouseConfigurationScreen
            mode='edit'
            constructionSite={constructionSite}
            house={navigation.selectedHouse}
            onSave={async (input) => {
              await actions.updateActiveHouseConfiguration(input);
              finishFormNavigation(navigation.showHouses);
            }}
            onDirtyChange={updateUnsavedChanges}
            readOnly={isSelectedConstructionReadOnly || navigation.selectedHouse.status === 'built'}
          />
        ) : null}

        {navigation.screen === 'house-extra-materials' && constructionSite && navigation.selectedHouse ? (
          <HouseExtraMaterialsScreen
            constructionSite={constructionSite}
            house={navigation.selectedHouse}
            onSave={(input) => {
              actions.updateActiveHouseExtraMaterials(input);
              finishFormNavigation(navigation.showHouses);
            }}
            onDirtyChange={updateUnsavedChanges}
            readOnly={isSelectedConstructionReadOnly || navigation.selectedHouse.status === 'built'}
          />
        ) : null}

        <UnsavedChangesDialog
          open={hasUnsavedChanges && Boolean(pendingUnsavedNavigation)}
          onCancel={cancelUnsavedNavigation}
          onConfirm={confirmUnsavedNavigation}
        />

        <ConstructionStatusDialog
          open={Boolean(navigation.pendingConstructionStatusChange)}
          constructionCode={navigation.pendingConstructionCode}
          action={navigation.pendingConstructionStatusChange?.action ?? 'archive'}
          onCancel={navigation.cancelConstructionStatusChange}
          onConfirm={() => void navigation.confirmConstructionStatusChange()}
        />

        <HouseStatusDialog
          open={Boolean(navigation.housePendingStatusChange)}
          familyName={navigation.pendingHouseFamilyName}
          action={navigation.pendingHouseStatusChange?.action ?? 'archive'}
          onCancel={navigation.cancelHouseStatusChange}
          onConfirm={() => void navigation.confirmHouseStatusChange()}
        />

        <MonitorStatusDialog
          open={Boolean(navigation.monitorPendingStatusChange)}
          monitorName={navigation.pendingMonitorName}
          action={navigation.pendingMonitorStatusChange?.action ?? 'archive'}
          onCancel={navigation.cancelMonitorStatusChange}
          onConfirm={navigation.confirmMonitorStatusChange}
        />
      </div>
    </main>
  );
}

function HeaderAction({
  screen,
  disabled = false,
  onAddConstruction,
  onAddHouse,
  onAddMonitor,
}: {
  screen: ConstructionSiteManagementScreen;
  disabled?: boolean;
  onAddConstruction(): void;
  onAddHouse(): void;
  onAddMonitor(): void;
}) {
  if (screen === 'construction-list') {
    return (
      <PrimaryButton
        type='button'
        data-guided-tour-id='rac-construction-add'
        className={HEADER_ACTION_BUTTON_CLASS}
        onClick={onAddConstruction}
      >
        + Adicionar Construção
      </PrimaryButton>
    );
  }

  if (screen === 'monitors') {
    return (
      <PrimaryButton type='button' className={HEADER_ACTION_BUTTON_CLASS} onClick={onAddMonitor} disabled={disabled}>
        + Adicionar Monitor
      </PrimaryButton>
    );
  }

  if (screen === 'houses') {
    return (
      <PrimaryButton
        type='button'
        data-guided-tour-id='rac-house-add'
        className={HEADER_ACTION_BUTTON_CLASS}
        onClick={onAddHouse}
        disabled={disabled}
      >
        + Adicionar Casa
      </PrimaryButton>
    );
  }

  return null;
}

function scheduleGuidedTourWhenTargetsReady(
  collectTargets: () => Record<string, GuidedTourEventRect> | null,
  dispatchTour: (targets: Record<string, GuidedTourEventRect>) => void,
): () => void {
  let frame: number | null = null;
  let attempt = 0;
  let cancelled = false;

  const tryDispatch = () => {
    if (cancelled) return;

    const targets = collectTargets();
    if (targets) {
      dispatchTour(targets);
      return;
    }

    attempt += 1;
    if (attempt >= GUIDED_TOUR_TARGET_COLLECTION_MAX_ATTEMPTS) return;

    frame = window.requestAnimationFrame(tryDispatch);
  };

  frame = window.requestAnimationFrame(tryDispatch);

  return () => {
    cancelled = true;
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
    }
  };
}

function collectGuidedTourTargets(targetIds: readonly string[]): Record<string, GuidedTourEventRect> | null {
  const entries = targetIds.map((targetId) => {
    const rect = getVisibleTargetRect(targetId);
    if (!rect) return null;
    return [targetId, toGuidedTourEventRect(rect)] as const;
  });

  if (entries.some((entry) => entry === null)) return null;
  return Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null));
}

function collectNextGuidedTourSegment(
  candidates: ReadonlyArray<{segment: GuidedTourSegment; enabled: boolean}>,
  dispatchedSegments: ReadonlySet<string>,
): GuidedTourSegmentTargets | null {
  for (const candidate of candidates) {
    if (!candidate.enabled) continue;
    if (dispatchedSegments.has(candidate.segment.key)) continue;
    if (isGuidedTourCompleted(candidate.segment)) continue;

    const targets = collectGuidedTourTargets(candidate.segment.targetIds);
    if (targets) return {segment: candidate.segment, targets};
  }

  return null;
}

function getBackButtonGuidedTourId(
  screen: ConstructionSiteManagementScreen,
  isBackToCanvasButton: boolean,
): string | undefined {
  if (isBackToCanvasButton) return 'rac-construction-back-to-canvas';
  if (screen === 'houses') return 'rac-house-back';
  return undefined;
}

interface GuidedTourEventRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface GuidedTourSegmentTargets {
  segment: GuidedTourSegment;
  targets: Record<string, GuidedTourEventRect>;
}

function toGuidedTourEventRect(rect: DOMRect): GuidedTourEventRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
