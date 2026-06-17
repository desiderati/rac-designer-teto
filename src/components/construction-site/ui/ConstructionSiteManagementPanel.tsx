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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingUnsavedNavigation, setPendingUnsavedNavigation] = useState<PendingNavigation | null>(null);
  const hasUnsavedChangesRef = useRef(false);

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
                  data-guided-tour-id={isBackToCanvasButton ? 'rac-construction-back-to-canvas' : undefined}
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
  onAddConstruction,
  onAddHouse,
  onAddMonitor,
}: {
  screen: ConstructionSiteManagementScreen;
  onAddConstruction(): void;
  onAddHouse(): void;
  onAddMonitor(): void;
}) {
  if (screen === 'construction-list') {
    return (
      <PrimaryButton type='button' className={HEADER_ACTION_BUTTON_CLASS} onClick={onAddConstruction}>
        + Adicionar Construção
      </PrimaryButton>
    );
  }

  if (screen === 'monitors') {
    return (
      <PrimaryButton type='button' className={HEADER_ACTION_BUTTON_CLASS} onClick={onAddMonitor}>
        + Adicionar Monitor
      </PrimaryButton>
    );
  }

  if (screen === 'houses') {
    return (
      <PrimaryButton type='button' className={HEADER_ACTION_BUTTON_CLASS} onClick={onAddHouse}>
        + Adicionar Casa
      </PrimaryButton>
    );
  }

  return null;
}
