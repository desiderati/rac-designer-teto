import {ArrowLeft} from 'lucide-react';
import {useConstructionSiteManagementNavigation} from '@/components/construction-site/hooks/useConstructionSiteManagementNavigation.ts';
import {GRIDDED_WORKSPACE_STYLE} from '@/shared/ui/workspace-style.ts';
import type {ConstructionSiteState, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';
import {HEADER_ACTION_BUTTON_CLASS} from '@/components/construction-site/ui/lib/constants.ts';
import {ConstructionFormScreen} from './ConstructionFormScreen.tsx';
import {ConstructionListScreen} from './ConstructionListScreen.tsx';
import {HouseConfigurationScreen} from './HouseConfigurationScreen.tsx';
import {HousesScreen} from './HousesScreen.tsx';
import {ConstructionStatusDialog, HouseStatusDialog} from '@/components/construction-site/ui/lib/status-dialogs.tsx';
import {EmptyState, PrimaryButton} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import type {ConstructionSiteManagementActions, ConstructionSiteManagementScreen} from '@/components/construction-site/ui/lib/types.ts';
import {getScreenSubtitle, getScreenTitle} from '@/components/construction-site/ui/lib/view-model.ts';

export interface ConstructionSiteManagementPanelProps {
  constructionSite: ConstructionSiteState | null;
  summaries: ConstructionSiteSummary[];
  canOpenRacEditor?: boolean;
  onBackToCanvas?: () => void;
  actions: ConstructionSiteManagementActions;
}

export function ConstructionSiteManagementPanel({
  constructionSite,
  summaries,
  canOpenRacEditor = false,
  onBackToCanvas,
  actions,
}: ConstructionSiteManagementPanelProps) {

  const navigation = useConstructionSiteManagementNavigation({
    constructionSite,
    summaries,
    canOpenRacEditor,
    onBackToCanvas,
    actions,
  });

  return (
    <main
      data-testid='construction-management-shell'
      className='h-full overflow-y-auto px-4 py-10 sm:px-6 lg:px-10'
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
                  onClick={navigation.navigateBack}
                  aria-label='Voltar'
                  className='grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  <ArrowLeft className='h-5 w-5'/>
                </button>
              ) : null}
              <div className='min-w-0'>
                <h1 className='text-2xl font-semibold text-slate-950'>
                  {getScreenTitle(navigation.screen, navigation.constructionLabel)}
                </h1>
                <p className='mt-1 max-w-2xl text-sm leading-6 text-slate-600'>
                  {getScreenSubtitle(navigation.screen)}
                </p>
              </div>
            </div>
            <HeaderAction
              screen={navigation.screen}
              onAddConstruction={() => navigation.setScreen('construction-create')}
              onManageHouses={navigation.openHouses}
              onAddHouse={navigation.openHouseCreate}
            />
          </div>
        </header>

        {navigation.screen === 'construction-list' ? (
          <ConstructionListScreen
            summaries={summaries}
            activeConstructionId={constructionSite?.constructionSite.id}
            onOpenConstruction={navigation.openConstructionDetail}
            onRequestStatusChange={navigation.requestConstructionStatusChange}
          />
        ) : null}

        {navigation.screen === 'construction-create' ? (
          <ConstructionFormScreen
            mode='create'
            externalCode=''
            photoDataUrl=''
            constructionDate=''
            communityName=''
            onSubmit={async (input) => {
              await actions.createConstructionSite(input);
              navigation.showConstructionList();
            }}
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
                navigation.showConstructionList();
              }}
            />
          ) : (
            <EmptyState
              title='Nenhuma construção selecionada'
              description='Selecione uma Construção TETO na listagem para editar.'
            />
          )
        ) : null}

        {navigation.screen === 'houses' ? (
          constructionSite ? (
            <HousesScreen
              constructionSite={constructionSite}
              activeHouse={navigation.activeHouse}
              onEditHouse={navigation.openHouseDetail}
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
              navigation.showHouses();
            }}
          />
        ) : null}

        {navigation.screen === 'house-detail' && constructionSite && navigation.selectedHouse ? (
          <HouseConfigurationScreen
            mode='edit'
            constructionSite={constructionSite}
            house={navigation.selectedHouse}
            onSave={(input) => {
              actions.updateActiveHouseConfiguration(input);
              navigation.showHouses();
            }}
          />
        ) : null}

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
      </div>
    </main>
  );
}

function HeaderAction({
  screen,
  onAddConstruction,
  onManageHouses,
  onAddHouse,
}: {
  screen: ConstructionSiteManagementScreen;
  onAddConstruction(): void;
  onManageHouses(): void | Promise<void>;
  onAddHouse(): void;
}) {
  if (screen === 'construction-list') {
    return (
      <PrimaryButton type='button' className={HEADER_ACTION_BUTTON_CLASS} onClick={onAddConstruction}>
        + Adicionar Construção
      </PrimaryButton>
    );
  }

  if (screen === 'construction-detail') {
    return (
      <PrimaryButton
        type='button'
        className={HEADER_ACTION_BUTTON_CLASS}
        onClick={() => void onManageHouses()}
      >
        Gerenciar Casas
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
