import {
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Droplets,
  MapPin,
  Mountain,
  Waves,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import type {
  CreateHouseInput,
  CreateConstructionSiteInput,
  UpdateHouseConfigurationInput,
  UpdateConstructionSiteInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseType} from '@/shared/types/house.ts';
import type {
  FamilyRecord,
  PersistedHouseStatus,
  PersistedHouseRecord,
  ConstructionSiteState,
  ConstructionSiteStatus,
  ConstructionSiteSummary,
  SiteAssessment,
  SoilProfile,
  TerrainComplexity,
} from '@/shared/types/construction-site.ts';
import {formatConstructionLabel, getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {GRIDDED_WORKSPACE_STYLE} from '@/shared/ui/workspace-style.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {Button} from '@/components/ui/button.tsx';
import {Calendar} from '@/components/ui/calendar.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {getPhotoOrientation, type PhotoOrientation} from '@/components/construction-site/lib/photo-orientation.ts';
import {
  constructionFormSchema,
  CONSTRUCTION_COMMUNITY_MAX_LENGTH,
  formatPhoneInput,
  HOUSE_FAMILY_NAME_MAX_LENGTH,
  HOUSE_NOTES_MAX_LENGTH,
  HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH,
  houseConfigurationFormSchema,
  normalizeConstructionCodeDraft,
  parseMapCoordinates,
  PHONE_MASK_MAX_LENGTH,
  type ConstructionFormValues,
  type HouseConfigurationFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';

type ConstructionSiteManagementScreen =
  | 'construction-list'
  | 'construction-create'
  | 'construction-detail'
  | 'houses'
  | 'house-create'
  | 'house-detail';

type ConstructionStatusFilter = 'all' | ConstructionSiteStatus;
type ConstructionSortKey = 'constructionDate' | 'externalCode' | 'status';
type HouseStatusFilter = 'all' | PersistedHouseStatus;
type HouseSortKey = 'updatedAt' | 'familyName' | 'status' | 'houseType';
type StatusChangeAction = 'archive' | 'unarchive';
type VisualSelectOption<T extends string> = {
  value: T;
  label: string;
};

const CONSTRUCTIONS_PER_PAGE = 10;
const HOUSES_PER_PAGE = 10;
const HEADER_ACTION_BUTTON_CLASS = 'w-full whitespace-nowrap sm:w-48 sm:shrink-0';
const FORM_ACTION_BUTTON_CLASS = 'w-full whitespace-nowrap sm:w-48';
const LIST_CONTROLS_CLASS = 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap';
const LIST_SELECT_CLASS = 'w-full min-w-0 sm:w-[11.25rem] sm:shrink-0';

const CONSTRUCTION_SITE_STATUS_LABELS: Record<ConstructionSiteStatus, string> = {
  in_progress: 'Em andamento',
  completed: 'Concluída',
  archived: 'Arquivada',
};

const STATUS_BADGE_CLASS_NAMES: Record<ConstructionSiteStatus, string> = {
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const HOUSE_STATUS_LABELS: Record<PersistedHouseStatus, string> = {
  draft: 'Rascunho',
  rac_printed: 'RAC Impressa',
  built: 'Construída',
  archived: 'Arquivada',
};

const HOUSE_STATUS_BADGE_CLASS_NAMES: Record<PersistedHouseStatus, string> = {
  draft: 'bg-blue-50 text-blue-700 ring-blue-100',
  rac_printed: 'bg-violet-50 text-violet-700 ring-violet-100',
  built: 'bg-slate-900 text-white ring-slate-900',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const CONSTRUCTION_STATUS_FILTER_OPTIONS: VisualSelectOption<ConstructionStatusFilter>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'archived', label: 'Arquivada'},
  {value: 'in_progress', label: 'Em andamento'},
  {value: 'completed', label: 'Concluída'},
];

const CONSTRUCTION_SORT_OPTIONS: VisualSelectOption<ConstructionSortKey>[] = [
  {value: 'constructionDate', label: 'Data da Construção'},
  {value: 'externalCode', label: 'Código da CC'},
  {value: 'status', label: 'Status'},
];

const HOUSE_STATUS_FILTER_OPTIONS: VisualSelectOption<HouseStatusFilter>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'archived', label: 'Arquivada'},
  {value: 'draft', label: 'Rascunho'},
  {value: 'rac_printed', label: 'RAC Impressa'},
  {value: 'built', label: 'Construída'},
];

const HOUSE_SORT_OPTIONS: VisualSelectOption<HouseSortKey>[] = [
  {value: 'updatedAt', label: 'Última modificação'},
  {value: 'familyName', label: 'Família'},
  {value: 'status', label: 'Status'},
  {value: 'houseType', label: 'Tipo da casa'},
];

const TERRAIN_COMPLEXITY_LABELS: Record<TerrainComplexity, string> = {
  flat: 'Plano',
  moderate: 'Moderado',
  steep: 'Íngreme',
  very_steep: 'Muito íngreme',
  extreme: 'Extremo',
};

const TERRAIN_COMPLEXITY_OPTIONS: VisualSelectOption<TerrainComplexity>[] = [
  {value: 'flat', label: TERRAIN_COMPLEXITY_LABELS.flat},
  {value: 'moderate', label: TERRAIN_COMPLEXITY_LABELS.moderate},
  {value: 'steep', label: TERRAIN_COMPLEXITY_LABELS.steep},
  {value: 'very_steep', label: TERRAIN_COMPLEXITY_LABELS.very_steep},
  {value: 'extreme', label: TERRAIN_COMPLEXITY_LABELS.extreme},
];

export interface ConstructionSiteManagementPanelProps {
  constructionSite: ConstructionSiteState | null;
  summaries: ConstructionSiteSummary[];
  canOpenRacEditor?: boolean;
  onBackToCanvas?: () => void;
  actions: {
    createConstructionSite(input: CreateConstructionSiteInput): Promise<void>;
    updateActiveConstructionSite(input: UpdateConstructionSiteInput): void;
    archiveActiveConstructionSite(): void;
    archiveConstructionSite(constructionSiteId: string): Promise<void>;
    unarchiveConstructionSite(constructionSiteId: string): Promise<void>;
    activateConstructionSite(constructionSiteId: string): Promise<void>;
    createHouse(input: CreateHouseInput): Promise<void>;
    duplicateActiveHouse(): Promise<void>;
    archiveActiveHouse(): Promise<void>;
    archiveHouse(houseId: string): Promise<void>;
    unarchiveHouse(houseId: string): Promise<void>;
    activateHouse(constructionSiteId: string, houseId: string): Promise<void>;
    updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void;
    updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void;
  };
}

export function ConstructionSiteManagementPanel({
  constructionSite,
  summaries,
  canOpenRacEditor = false,
  onBackToCanvas,
  actions,
}: ConstructionSiteManagementPanelProps) {
  const [screen, setScreen] = useState<ConstructionSiteManagementScreen>('construction-list');
  const [selectedConstructionId, setSelectedConstructionId] = useState<string | null>(constructionSite?.constructionSite.id ?? null);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [pendingHouseStatusChange, setPendingHouseStatusChange] = useState<{
    houseId: string;
    action: StatusChangeAction;
  } | null>(null);
  const [pendingConstructionStatusChange, setPendingConstructionStatusChange] = useState<{
    summary: ConstructionSiteSummary;
    action: StatusChangeAction;
  } | null>(null);
  const activeHouse = useMemo(() => constructionSite ? getActiveHouse(constructionSite) : null, [constructionSite]);
  const selectedHouse = useMemo(() => {
    if (!constructionSite) return null;
    return constructionSite.houses.find((house) => house.id === selectedHouseId) ?? activeHouse;
  }, [activeHouse, constructionSite, selectedHouseId]);
  const activeCommunityName = constructionSite ? getConstructionSiteCommunityName(constructionSite) : undefined;
  const constructionLabel = constructionSite
    ? formatConstructionLabel(constructionSite.constructionSite.externalCode, activeCommunityName)
    : 'Nova Construção TETO';
  const selectedSummary = summaries.find((summary) => summary.id === selectedConstructionId)
    ?? summaries.find((summary) => summary.id === constructionSite?.constructionSite.id)
    ?? null;
  const selectedConstructionFields = getSelectedConstructionFields(constructionSite, selectedSummary);
  const housePendingStatusChange = constructionSite?.houses.find((house) => house.id === pendingHouseStatusChange?.houseId)
    ?? null;
  const canNavigateBack = screen !== 'construction-list' || Boolean(canOpenRacEditor && onBackToCanvas);

  const openConstructionDetail = async (summary: ConstructionSiteSummary) => {
    setSelectedConstructionId(summary.id);
    await actions.activateConstructionSite(summary.id);
    setScreen('construction-detail');
  };

  const openHouses = async () => {
    const constructionSiteId = selectedConstructionId ?? selectedSummary?.id ?? constructionSite?.constructionSite.id;
    if (constructionSiteId) {
      await actions.activateConstructionSite(constructionSiteId);
      setSelectedConstructionId(constructionSiteId);
    }
    setSelectedHouseId(null);
    setScreen('houses');
  };

  const showConstructionList = () => {
    setSelectedConstructionId(constructionSite?.constructionSite.id ?? null);
    setScreen('construction-list');
  };

  const navigateBack = () => {
    if (screen === 'construction-list') {
      if (canOpenRacEditor) onBackToCanvas?.();
      return;
    }

    if (screen === 'construction-create' || screen === 'construction-detail') {
      showConstructionList();
      return;
    }

    if (screen === 'houses') {
      setScreen(selectedConstructionId ? 'construction-detail' : 'construction-list');
      return;
    }

    setScreen('houses');
  };

  const confirmHouseStatusChange = async () => {
    if (!housePendingStatusChange || !pendingHouseStatusChange) return;
    if (pendingHouseStatusChange.action === 'archive') {
      await actions.archiveHouse(housePendingStatusChange.id);
    } else {
      await actions.unarchiveHouse(housePendingStatusChange.id);
    }
    if (selectedHouseId === housePendingStatusChange.id) {
      setSelectedHouseId(null);
    }
    setPendingHouseStatusChange(null);
  };

  const confirmConstructionStatusChange = async () => {
    if (!pendingConstructionStatusChange) return;
    if (pendingConstructionStatusChange.action === 'archive') {
      await actions.archiveConstructionSite(pendingConstructionStatusChange.summary.id);
    } else {
      await actions.unarchiveConstructionSite(pendingConstructionStatusChange.summary.id);
    }
    if (selectedConstructionId === pendingConstructionStatusChange.summary.id) {
      setSelectedConstructionId(constructionSite?.constructionSite.id ?? null);
    }
    setPendingConstructionStatusChange(null);
  };

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
              {canNavigateBack ? (
                <button
                  type='button'
                  onClick={navigateBack}
                  aria-label='Voltar'
                  className='grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  <ArrowLeft className='h-5 w-5'/>
                </button>
              ) : null}
              <div className='min-w-0'>
                <h1 className='text-2xl font-semibold text-slate-950'>
                  {getScreenTitle(screen, constructionLabel)}
                </h1>
                <p className='mt-1 max-w-2xl text-sm leading-6 text-slate-600'>
                  {getScreenSubtitle(screen)}
                </p>
              </div>
            </div>
            <HeaderAction
              screen={screen}
              onAddConstruction={() => setScreen('construction-create')}
              onManageHouses={openHouses}
              onAddHouse={() => setScreen('house-create')}
            />
          </div>
        </header>

        {screen === 'construction-list' ? (
          <ConstructionListScreen
            summaries={summaries}
            activeConstructionId={constructionSite?.constructionSite.id}
            onOpenConstruction={openConstructionDetail}
            onRequestStatusChange={(summary, action) => setPendingConstructionStatusChange({summary, action})}
          />
        ) : null}

        {screen === 'construction-create' ? (
            <ConstructionFormScreen
              mode='create'
              externalCode=''
              photoDataUrl=''
              constructionDate=''
              communityName=''
              onSubmit={async (input) => {
                await actions.createConstructionSite(input);
                showConstructionList();
            }}
          />
        ) : null}

        {screen === 'construction-detail' ? (
          selectedSummary || constructionSite ? (
            <ConstructionFormScreen
              mode='edit'
              externalCode={selectedConstructionFields.externalCode}
              photoDataUrl={selectedConstructionFields.photoDataUrl}
              constructionDate={selectedConstructionFields.constructionDate}
              communityName={selectedConstructionFields.communityName}
              onSubmit={(input) => {
                actions.updateActiveConstructionSite(input);
                showConstructionList();
              }}
            />
          ) : (
            <EmptyState
              title='Nenhuma construção selecionada'
              description='Selecione uma Construção TETO na listagem para editar.'
            />
          )
        ) : null}

        {screen === 'houses' ? (
          constructionSite ? (
            <HousesScreen
              constructionSite={constructionSite}
              activeHouse={activeHouse}
              onEditHouse={async (houseId) => {
                const house = constructionSite.houses.find((entry) => entry.id === houseId);
                if (house?.status !== 'archived') {
                  await actions.activateHouse(constructionSite.constructionSite.id, houseId);
                }
                setSelectedHouseId(houseId);
                setScreen('house-detail');
              }}
              onRequestHouseStatusChange={(houseId, action) => setPendingHouseStatusChange({houseId, action})}
            />
          ) : (
            <EmptyState title='Nenhuma construção ativa' description='Crie uma Construção TETO antes de cadastrar casas.'/>
          )
        ) : null}

        {screen === 'house-create' && constructionSite ? (
          <HouseConfigurationScreen
            mode='create'
            constructionSite={constructionSite}
            house={null}
            onSave={async (input) => {
              await actions.createHouse(input);
              setSelectedHouseId(null);
              setScreen('houses');
            }}
          />
        ) : null}

        {screen === 'house-detail' && constructionSite && selectedHouse ? (
          <HouseConfigurationScreen
            mode='edit'
            constructionSite={constructionSite}
            house={selectedHouse}
            onSave={(input) => {
              actions.updateActiveHouseConfiguration(input);
              setScreen('houses');
            }}
          />
        ) : null}

        <ConstructionStatusDialog
          open={Boolean(pendingConstructionStatusChange)}
          constructionCode={pendingConstructionStatusChange
            ? getConstructionCode(pendingConstructionStatusChange.summary)
            : ''}
          action={pendingConstructionStatusChange?.action ?? 'archive'}
          onCancel={() => setPendingConstructionStatusChange(null)}
          onConfirm={() => void confirmConstructionStatusChange()}
        />
        <HouseStatusDialog
          open={Boolean(housePendingStatusChange)}
          familyName={housePendingStatusChange ? getHouseFamilyName(constructionSite, housePendingStatusChange) : ''}
          action={pendingHouseStatusChange?.action ?? 'archive'}
          onCancel={() => setPendingHouseStatusChange(null)}
          onConfirm={() => void confirmHouseStatusChange()}
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

function ConstructionListScreen({
  summaries,
  activeConstructionId,
  onOpenConstruction,
  onRequestStatusChange,
}: {
  summaries: ConstructionSiteSummary[];
  activeConstructionId?: string;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {
  const [statusFilter, setStatusFilter] = useState<ConstructionStatusFilter>('all');
  const [sortKey, setSortKey] = useState<ConstructionSortKey>('constructionDate');
  const [page, setPage] = useState(1);

  const filteredSummaries = useMemo(() => {
    const visibleSummaries = summaries
      .filter((summary) => statusFilter === 'all' || summary.status === statusFilter)
      .sort((a, b) => compareConstructionSummaries(a, b, sortKey));
    return visibleSummaries;
  }, [sortKey, statusFilter, summaries]);

  const pageCount = Math.max(1, Math.ceil(filteredSummaries.length / CONSTRUCTIONS_PER_PAGE));
  const normalizedPage = Math.min(page, pageCount);
  const firstIndex = filteredSummaries.length ? (normalizedPage - 1) * CONSTRUCTIONS_PER_PAGE : 0;
  const lastIndex = Math.min(firstIndex + CONSTRUCTIONS_PER_PAGE, filteredSummaries.length);
  const pageSummaries = filteredSummaries.slice(firstIndex, lastIndex);

  useEffect(() => {
    setPage(1);
  }, [sortKey, statusFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    <section aria-label='Listagem de Construções TETO' className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div data-testid='construction-list-controls' className={LIST_CONTROLS_CLASS}>
          <VisualSelect
            label='Filtro'
            ariaLabel='Filtrar por status'
            value={statusFilter}
            options={CONSTRUCTION_STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className={LIST_SELECT_CLASS}
          />
          <VisualSelect
            label='Ordenação'
            ariaLabel='Ordenar por'
            value={sortKey}
            options={CONSTRUCTION_SORT_OPTIONS}
            onChange={setSortKey}
            className={LIST_SELECT_CLASS}
          />
        </div>
        <div
          data-testid='construction-desktop-pagination'
          className='hidden items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:flex sm:justify-start'
        >
          <span>{formatPaginationText(firstIndex, lastIndex, filteredSummaries.length)}</span>
          <div className='flex items-center gap-1'>
            <PaginationButton
              aria-label='Página anterior'
              disabled={normalizedPage <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              ‹
            </PaginationButton>
            <PaginationButton
              aria-label='Próxima página'
              disabled={normalizedPage >= pageCount}
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            >
              ›
            </PaginationButton>
          </div>
        </div>
      </div>

      <div data-testid='construction-desktop-table' className='hidden overflow-x-auto sm:block'>
        <table className='min-w-full border-separate border-spacing-y-3'>
          <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
            <th scope='col' className='px-3 pb-1'>Construções</th>
            <th scope='col' className='px-3 pb-1 text-center'>Status</th>
            <th scope='col' className='px-3 pb-1 text-center'>Data da Construção</th>
          </tr>
          </thead>
          <tbody>
          {pageSummaries.map((summary) => (
            <ConstructionTableRow
              key={summary.id}
              summary={summary}
              active={summary.id === activeConstructionId}
              onOpenConstruction={onOpenConstruction}
              onRequestStatusChange={onRequestStatusChange}
            />
          ))}
          </tbody>
        </table>
      </div>

      <div data-testid='construction-mobile-list' className='space-y-3 sm:hidden'>
        {pageSummaries.map((summary) => (
          <ConstructionMobileCard
            key={summary.id}
            summary={summary}
            active={summary.id === activeConstructionId}
            onOpenConstruction={onOpenConstruction}
            onRequestStatusChange={onRequestStatusChange}
          />
        ))}
      </div>

      <div
        data-testid='construction-mobile-pagination'
        className='flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:hidden'
      >
        <span>{formatPaginationText(firstIndex, lastIndex, filteredSummaries.length)}</span>
        <div className='flex items-center gap-1'>
          <PaginationButton
            aria-label='Página anterior'
            disabled={normalizedPage <= 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            ‹
          </PaginationButton>
          <PaginationButton
            aria-label='Próxima página'
            disabled={normalizedPage >= pageCount}
            onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
          >
            ›
          </PaginationButton>
        </div>
      </div>

      {!filteredSummaries.length ? (
        <EmptyState
          title={summaries.length ? 'Nenhuma construção encontrada' : 'Nenhuma Construção TETO cadastrada'}
          description={summaries.length ? 'Altere o filtro para ver outras construções.' : 'Adicione uma construção para iniciar o gerenciamento.'}
        />
      ) : null}
    </section>
  );
}

function ConstructionMobileCard({
  summary,
  active,
  onOpenConstruction,
  onRequestStatusChange,
}: {
  summary: ConstructionSiteSummary;
  active: boolean;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {
  const constructionCode = getConstructionCode(summary);
  const communityLabel = summary.communityName?.trim() || 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(summary.constructionDate);
  const openConstruction = () => {
    void onOpenConstruction(summary);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, summary.status === 'archived' ? 'unarchive' : 'archive');
  };

  return (
    <article
      data-testid='construction-mobile-card'
      role='button'
      tabIndex={0}
      aria-label={`Abrir construção ${constructionCode} ${CONSTRUCTION_SITE_STATUS_LABELS[summary.status]}`}
      onClick={openConstruction}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openConstruction();
      }}
      className={cn(
        'cursor-pointer rounded-2xl bg-slate-50 p-4 text-sm shadow-sm shadow-slate-200/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        active ? 'bg-blue-50/90 shadow-blue-100' : 'hover:bg-slate-100',
        summary.status === 'archived' ? 'opacity-60 grayscale' : null,
      )}
    >
      <div className='flex items-start gap-3'>
        <ConstructionAvatar label={constructionCode} photoDataUrl={summary.photoDataUrl}/>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 className='truncate text-base font-semibold text-slate-950'>{constructionCode}</h2>
              <p className='mt-1 truncate text-xs font-medium text-slate-500'>{communityLabel}</p>
            </div>
            <StatusBadge status={summary.status}/>
          </div>
        </div>
      </div>
      <div className='mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2'>
        <div className='min-w-0 text-xs font-medium text-slate-600'>
          <span className='block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
            Data da Construção
          </span>
          {summary.constructionDate ? (
            <time dateTime={summary.constructionDate} className='mt-0.5 block'>{constructionDateLabel}</time>
          ) : (
            <span className='mt-0.5 block'>{constructionDateLabel}</span>
          )}
        </div>
        <StatusActionButton
          action={summary.status === 'archived' ? 'unarchive' : 'archive'}
          label={summary.status === 'archived'
            ? `Desarquivar construção ${constructionCode}`
            : `Arquivar construção ${constructionCode}`}
          onClick={requestStatusChange}
        />
      </div>
    </article>
  );
}

function ConstructionTableRow({
  summary,
  active,
  onOpenConstruction,
  onRequestStatusChange,
}: {
  summary: ConstructionSiteSummary;
  active: boolean;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {
  const constructionCode = getConstructionCode(summary);
  const communityLabel = summary.communityName?.trim() || 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(summary.constructionDate);
  const openConstruction = () => {
    void onOpenConstruction(summary);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, summary.status === 'archived' ? 'unarchive' : 'archive');
  };

  return (
    <tr
      tabIndex={0}
      aria-label={`Abrir construção ${constructionCode} ${CONSTRUCTION_SITE_STATUS_LABELS[summary.status]}`}
      onClick={openConstruction}
      onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openConstruction();
      }}
      className={cn(
        'cursor-pointer rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        active ? 'bg-blue-50/90' : 'bg-transparent hover:bg-slate-50',
        summary.status === 'archived' ? 'opacity-60' : null,
      )}
    >
      <td className='rounded-l-lg px-3 py-3'>
        <div className='flex min-h-14 w-full items-center gap-3 rounded-lg text-left'>
          <ConstructionAvatar label={constructionCode} photoDataUrl={summary.photoDataUrl}/>
          <span className='min-w-0'>
            <span className='block truncate font-semibold text-slate-950'>{constructionCode}</span>
            <span className='mt-0.5 block truncate text-xs font-medium text-slate-500'>{communityLabel}</span>
          </span>
        </div>
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <StatusBadge status={summary.status}/>
      </td>
      <td className='rounded-r-lg px-3 py-3 text-center align-middle text-xs font-medium text-slate-700'>
        <div className='grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-3'>
          <span aria-hidden='true'/>
          <span className='text-center'>
            {summary.constructionDate ? (
              <time dateTime={summary.constructionDate} className='block'>{constructionDateLabel}</time>
            ) : (
              <span className='block'>{constructionDateLabel}</span>
            )}
          </span>
          <StatusActionButton
            action={summary.status === 'archived' ? 'unarchive' : 'archive'}
            label={summary.status === 'archived'
              ? `Desarquivar construção ${constructionCode}`
              : `Arquivar construção ${constructionCode}`}
            onClick={requestStatusChange}
          />
        </div>
      </td>
    </tr>
  );
}

function ConstructionAvatar({label, photoDataUrl}: { label: string; photoDataUrl?: string }) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt={`Foto da construção ${label}`}
        className='h-11 w-11 shrink-0 rounded-full object-cover object-center ring-2 ring-white'
      />
    );
  }

  const palette = getAvatarPalette(label);

  return (
    <span
      role='img'
      aria-label={`Avatar da construção ${label}`}
      className='grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-white'
      style={{backgroundColor: palette.background, color: palette.foreground}}
    >
      {getConstructionInitials(label)}
    </span>
  );
}

function StatusBadge({status}: { status: ConstructionSiteStatus }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ring-1',
      STATUS_BADGE_CLASS_NAMES[status],
    )}>
      {CONSTRUCTION_SITE_STATUS_LABELS[status]}
    </span>
  );
}

function StatusActionButton({
  action,
  label,
  onClick,
}: {
  action: StatusChangeAction;
  label: string;
  onClick(event: MouseEvent<HTMLButtonElement>): void;
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors focus:outline-none focus:ring-2',
        action === 'unarchive'
          ? 'hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-100'
          : 'hover:bg-red-50 hover:text-red-600 focus:ring-red-100',
      )}
    >
      {action === 'unarchive' ? <ArchiveRestore className='h-4 w-4'/> : <Archive className='h-4 w-4'/>}
    </button>
  );
}

function ConstructionFormScreen({
  mode,
  externalCode,
  photoDataUrl,
  constructionDate,
  communityName,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  externalCode: string;
  photoDataUrl: string;
  constructionDate: string;
  communityName: string;
  onSubmit(input: CreateConstructionSiteInput & UpdateConstructionSiteInput): void | Promise<void>;
}) {
  const form = useForm<ConstructionFormValues>({
    resolver: zodResolver(constructionFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      externalCode,
      photoDataUrl: photoDataUrl || '',
      constructionDate,
      communityName,
    },
  });

  useEffect(() => {
    form.reset({
      externalCode,
      photoDataUrl: photoDataUrl || '',
      constructionDate,
      communityName,
    });
  }, [communityName, constructionDate, externalCode, form, photoDataUrl]);

  const submitForm = form.handleSubmit(async (values) => {
    const input: CreateConstructionSiteInput & UpdateConstructionSiteInput = {
      externalCode: values.externalCode.trim().toUpperCase(),
      photoDataUrl: values.photoDataUrl || undefined,
      constructionDate: values.constructionDate,
      communityName: values.communityName.trim(),
    };
    await onSubmit(input);
  });

  return (
    <form className='w-full space-y-6' onSubmit={submitForm} noValidate>
      <div data-testid='construction-form-grid' className='grid gap-5 md:grid-cols-2 md:items-stretch'>
        <Controller
          control={form.control}
          name='photoDataUrl'
          render={({field}) => (
            <PhotoUploadField
              label='Foto da Construção'
              testId='construction-photo-field'
              value={field.value ?? ''}
              onChange={field.onChange}
              dropZoneClassName='h-56'
            />
          )}
        />
        <div className='grid gap-4'>
          <Controller
            control={form.control}
            name='externalCode'
            render={({field, fieldState}) => (
              <TextField
                label='Código da CC'
                placeholder='ex: CC2603'
                value={field.value}
                onChange={(value) => field.onChange(normalizeConstructionCodeDraft(value))}
                onBlur={field.onBlur}
                required
                maxLength={6}
                pattern='CC[0-9]{4}'
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name='constructionDate'
            render={({field, fieldState}) => (
              <ConstructionDatePicker
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name='communityName'
            render={({field, fieldState}) => (
              <CommunityField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>
      <div className='flex justify-end'>
        <PrimaryButton type='submit' className={FORM_ACTION_BUTTON_CLASS}>
          {mode === 'create' ? 'Criar Construção' : 'Salvar Construção'}
        </PrimaryButton>
      </div>
    </form>
  );
}

function CommunityField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor='construction-communities'>
        Comunidade
      </label>
      <input
        id='construction-communities'
        type='text'
        placeholder='ex: Tiradentes'
        value={value}
        required
        maxLength={CONSTRUCTION_COMMUNITY_MAX_LENGTH}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'construction-communities-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className='min-h-10 rounded-lg border border-transparent bg-blue-50/80 px-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
      />
      {error ? (
        <span id='construction-communities-error' className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function ConstructionDatePicker({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateOnly(value);
  const label = formatDateOnly(value);

  const selectDate = (date?: Date) => {
    onChange(date ? toDateOnly(date) : '');
    onBlur?.();
    setOpen(false);
  };

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <span id='construction-date-label'>Data da Construção</span>
      <div className='flex gap-2'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              aria-label='Data da Construção'
              aria-labelledby='construction-date-label'
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'construction-date-error' : undefined}
              className={cn(
                inputClassName,
                'w-full cursor-pointer justify-between border-transparent bg-blue-50/80 px-3 text-left normal-case tracking-normal hover:bg-white',
              )}
            >
              <span className={cn('min-w-0 flex-1 truncate', selectedDate ? 'text-slate-800' : 'text-slate-400')}>
                {selectedDate ? label : 'Selecionar data'}
              </span>
              <CalendarDays className='h-4 w-4 shrink-0 text-slate-400'/>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            sideOffset={8}
            data-testid='construction-date-picker-calendar'
            className='w-auto rounded-xl border border-slate-200 bg-white/95 p-0 text-slate-700 shadow-xl backdrop-blur-xl'
          >
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={selectDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {selectedDate ? (
          <button
            type='button'
            aria-label='Limpar Data da Construção'
            onClick={() => {
              onChange('');
              onBlur?.();
            }}
            onBlur={onBlur}
            className='grid min-h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100'
          >
            <X className='h-4 w-4'/>
          </button>
        ) : null}
      </div>
      {error ? (
        <span id='construction-date-error' className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function HousesScreen({
  constructionSite,
  activeHouse,
  onEditHouse,
  onRequestHouseStatusChange,
}: {
  constructionSite: ConstructionSiteState;
  activeHouse: PersistedHouseRecord | null;
  onEditHouse(houseId: string): Promise<void>;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
}) {
  const [statusFilter, setStatusFilter] = useState<HouseStatusFilter>('all');
  const [sortKey, setSortKey] = useState<HouseSortKey>('updatedAt');
  const [page, setPage] = useState(1);

  const filteredHouses = useMemo(() => {
    return [...constructionSite.houses]
      .filter((house) => statusFilter === 'all' || house.status === statusFilter)
      .sort((a, b) => compareHouses(constructionSite, a, b, sortKey));
  }, [constructionSite, sortKey, statusFilter]);

  const metrics = useMemo(() => ({
    total: constructionSite.houses.length,
    tipo6: constructionSite.houses.filter((house) => house.houseType === 'tipo6').length,
    tipo3: constructionSite.houses.filter((house) => house.houseType === 'tipo3').length,
  }), [constructionSite.houses]);
  const pageCount = Math.max(1, Math.ceil(filteredHouses.length / HOUSES_PER_PAGE));
  const normalizedPage = Math.min(page, pageCount);
  const firstIndex = filteredHouses.length ? (normalizedPage - 1) * HOUSES_PER_PAGE : 0;
  const lastIndex = Math.min(firstIndex + HOUSES_PER_PAGE, filteredHouses.length);
  const pageHouses = filteredHouses.slice(firstIndex, lastIndex);

  useEffect(() => {
    setPage(1);
  }, [sortKey, statusFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    <section aria-label='Listagem de casas' className='space-y-6'>
      <div className='grid grid-cols-3 gap-2 sm:gap-3'>
        <MetricCard label='No. Casas' value={metrics.total}/>
        <MetricCard label='No. Tipo 6' value={metrics.tipo6}/>
        <MetricCard label='No. Tipo 3' value={metrics.tipo3}/>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div data-testid='house-list-controls' className={LIST_CONTROLS_CLASS}>
          <VisualSelect
            label='Filtro'
            ariaLabel='Filtrar casas por status'
            value={statusFilter}
            options={HOUSE_STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className={LIST_SELECT_CLASS}
          />
          <VisualSelect
            label='Ordenação'
            ariaLabel='Ordenar casas por'
            value={sortKey}
            options={HOUSE_SORT_OPTIONS}
            onChange={setSortKey}
            className={LIST_SELECT_CLASS}
          />
        </div>
        <div
          data-testid='house-desktop-pagination'
          className='hidden items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:flex sm:justify-start'
        >
          <span>{formatPaginationText(firstIndex, lastIndex, filteredHouses.length, 'casas')}</span>
          <div className='flex items-center gap-1'>
            <PaginationButton
              aria-label='Página anterior de casas'
              disabled={normalizedPage <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              ‹
            </PaginationButton>
            <PaginationButton
              aria-label='Próxima página de casas'
              disabled={normalizedPage >= pageCount}
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            >
              ›
            </PaginationButton>
          </div>
        </div>
      </div>

      <div data-testid='house-desktop-table' className='hidden overflow-x-auto sm:block'>
        <table className='min-w-full border-separate border-spacing-y-3'>
          <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
            <th scope='col' className='px-3 pb-1'>Casas</th>
            <th scope='col' className='px-3 pb-1 text-center'>Status</th>
            <th scope='col' className='px-3 pb-1 text-center'>Última Modificação</th>
          </tr>
          </thead>
          <tbody>
          {pageHouses.map((house) => (
            <HouseTableRow
              key={house.id}
              constructionSite={constructionSite}
              house={house}
              active={activeHouse?.id === house.id}
              onOpenHouse={onEditHouse}
              onRequestHouseStatusChange={onRequestHouseStatusChange}
            />
          ))}
          </tbody>
        </table>
      </div>

      <div data-testid='house-mobile-list' className='space-y-3 sm:hidden'>
        {pageHouses.map((house) => (
          <HouseMobileCard
            key={house.id}
            constructionSite={constructionSite}
            house={house}
            active={activeHouse?.id === house.id}
            onOpenHouse={onEditHouse}
            onRequestHouseStatusChange={onRequestHouseStatusChange}
          />
        ))}
      </div>

      <div
        data-testid='house-mobile-pagination'
        className='flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:hidden'
      >
        <span>{formatPaginationText(firstIndex, lastIndex, filteredHouses.length, 'casas')}</span>
        <div className='flex items-center gap-1'>
          <PaginationButton
            aria-label='Página anterior de casas'
            disabled={normalizedPage <= 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            ‹
          </PaginationButton>
          <PaginationButton
            aria-label='Próxima página de casas'
            disabled={normalizedPage >= pageCount}
            onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
          >
            ›
          </PaginationButton>
        </div>
      </div>

      {!filteredHouses.length ? (
        <EmptyState
          title={constructionSite.houses.length ? 'Nenhuma casa encontrada' : 'Nenhuma casa cadastrada'}
          description={constructionSite.houses.length ? 'Altere o filtro para ver outras casas.' : 'Adicione uma casa para configurar a família e o local.'}
        />
      ) : null}
    </section>
  );
}

function HouseMobileCard({
  constructionSite,
  house,
  active,
  onOpenHouse,
  onRequestHouseStatusChange,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  active: boolean;
  onOpenHouse(houseId: string): Promise<void>;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
}) {
  const family = getHouseFamily(constructionSite, house);
  const familyName = family?.name ?? getHouseFamilyName(constructionSite, house);
  const houseTypeLabel = formatHouseType(house.houseType);
  const statusLabel = HOUSE_STATUS_LABELS[house.status];
  const formattedDate = formatTimestampDate(house.updatedAt);
  const openHouse = () => {
    void onOpenHouse(house.id);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'archived' ? 'unarchive' : 'archive');
  };

  return (
    <article
      data-testid='house-mobile-card'
      role='button'
      tabIndex={0}
      aria-label={`Abrir casa ${familyName} ${houseTypeLabel} ${statusLabel}`}
      onClick={openHouse}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openHouse();
      }}
      className={cn(
        'cursor-pointer rounded-2xl bg-slate-50 p-4 text-sm shadow-sm shadow-slate-200/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        active ? 'bg-blue-50/90 shadow-blue-100' : 'hover:bg-slate-100',
        house.status === 'archived' ? 'opacity-55 grayscale' : null,
      )}
    >
      <div className='flex items-start gap-3'>
        <HouseThumbnail familyName={familyName} photoDataUrl={family?.photoDataUrl}/>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 className='truncate text-base font-semibold text-slate-950'>{familyName}</h2>
              <p className='mt-1 truncate text-xs font-medium text-slate-500'>{houseTypeLabel}</p>
            </div>
            <HouseStatusBadge status={house.status}/>
          </div>
        </div>
      </div>
      <div className='mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2'>
        <div className='min-w-0 text-xs font-medium text-slate-600'>
          <span className='block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
            Última Modificação
          </span>
          <time dateTime={house.updatedAt} className='mt-0.5 block'>{formattedDate.date}</time>
          <span className='block text-[11px] text-slate-400'>{formattedDate.time}</span>
        </div>
        <StatusActionButton
          action={house.status === 'archived' ? 'unarchive' : 'archive'}
          label={house.status === 'archived' ? `Desarquivar casa ${familyName}` : `Arquivar casa ${familyName}`}
          onClick={requestStatusChange}
        />
      </div>
    </article>
  );
}

function HouseTableRow({
  constructionSite,
  house,
  active,
  onOpenHouse,
  onRequestHouseStatusChange,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  active: boolean;
  onOpenHouse(houseId: string): Promise<void>;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
}) {
  const family = getHouseFamily(constructionSite, house);
  const familyName = family?.name ?? getHouseFamilyName(constructionSite, house);
  const houseTypeLabel = formatHouseType(house.houseType);
  const statusLabel = HOUSE_STATUS_LABELS[house.status];
  const formattedDate = formatTimestampDate(house.updatedAt);
  const openHouse = () => {
    void onOpenHouse(house.id);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'archived' ? 'unarchive' : 'archive');
  };

  return (
    <tr
      tabIndex={0}
      aria-label={`${familyName} ${houseTypeLabel} ${statusLabel}`}
      onClick={openHouse}
      onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openHouse();
      }}
      className={cn(
        'cursor-pointer rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        active ? 'bg-blue-50/90' : 'bg-transparent hover:bg-slate-50',
        house.status === 'archived' ? 'opacity-55' : null,
      )}
    >
      <td className='rounded-l-lg px-3 py-3'>
        <div className='flex min-h-14 w-full items-center gap-3 rounded-lg text-left'>
          <HouseThumbnail familyName={familyName} photoDataUrl={family?.photoDataUrl}/>
          <span className='min-w-0'>
            <span className='block truncate font-semibold text-slate-950'>{familyName}</span>
            <span className='mt-0.5 block truncate text-xs font-medium text-slate-500'>{houseTypeLabel}</span>
          </span>
        </div>
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <HouseStatusBadge status={house.status}/>
      </td>
      <td className='rounded-r-lg px-3 py-3 text-center align-middle text-xs font-medium text-slate-700'>
        <div className='grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-3'>
          <span aria-hidden='true'/>
          <span className='text-center'>
            <time dateTime={house.updatedAt} className='block'>{formattedDate.date}</time>
            <span className='mt-0.5 block text-[11px] text-slate-400'>{formattedDate.time}</span>
          </span>
          <StatusActionButton
            action={house.status === 'archived' ? 'unarchive' : 'archive'}
            label={house.status === 'archived' ? `Desarquivar casa ${familyName}` : `Arquivar casa ${familyName}`}
            onClick={requestStatusChange}
          />
        </div>
      </td>
    </tr>
  );
}

function HouseConfigurationScreen({
  constructionSite,
  house,
  onSave,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord | null;
  onSave(input: CreateHouseInput): void | Promise<void>;
}) {
  const form = useForm<HouseConfigurationFormValues>({
    resolver: zodResolver(houseConfigurationFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getHouseConfigurationInitialState(constructionSite, house),
  });
  const locationQuery = form.watch('locationQuery');

  useEffect(() => {
    form.reset(getHouseConfigurationInitialState(constructionSite, house));
  }, [house, constructionSite, form]);

  const submitForm = form.handleSubmit(async (values) => {
    await onSave(toHouseConfigurationInput(values));
  });

  return (
    <form
      data-testid='house-configuration-form'
      className='grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='space-y-6'>
        <HouseFormSection number='01' title='Detalhes da Família'>
          <div className='space-y-5'>
            <Controller
              control={form.control}
              name='familyPhotoDataUrl'
              render={({field}) => (
                <PhotoUploadField
                  label='Foto da Família'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  loadedDropZoneClassName='h-72'
                />
              )}
            />
            <div data-testid='family-identity-grid' className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-4'>
                <Controller
                  control={form.control}
                  name='familyName'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Nome da Família'
                      placeholder='ex: Tadeu e Odete'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                      maxLength={HOUSE_FAMILY_NAME_MAX_LENGTH}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='primaryContactPhone'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Telefone'
                      placeholder='(41) 00000-0000'
                      value={field.value}
                      onChange={(primaryContactPhone) => field.onChange(formatPhoneInput(primaryContactPhone))}
                      onBlur={field.onBlur}
                      maxLength={PHONE_MASK_MAX_LENGTH}
                      inputMode='numeric'
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div className='space-y-4'>
                <Controller
                  control={form.control}
                  name='primaryContactName'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Contato Principal'
                      placeholder='Nome completo'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                      maxLength={HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='primaryContactEmail'
                  render={({field, fieldState}) => (
                    <TextField
                      label='E-mail'
                      type='email'
                      placeholder='contato@dominio.com'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </div>
            <Controller
              control={form.control}
              name='notes'
              render={({field, fieldState}) => (
                <TextArea
                  label='Notas'
                  placeholder='Requisitos específicos de estilo de vida, necessidades de acessibilidade ou mudanças estruturais no projeto...'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={HOUSE_NOTES_MAX_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </HouseFormSection>

        <HouseFormSection number='02' title='Restrições Locais'>
          <div data-testid='local-restrictions-grid' className='grid gap-6 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='soilProfile'
              render={({field}) => (
                <fieldset className='space-y-3'>
                  <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Perfil do Solo</legend>
                  <div className='space-y-3'>
                    <RadioField
                      icon={<Mountain className='h-5 w-5'/>}
                      label='Terreno Estável / Firme'
                      name='soilProfile'
                      value='stable'
                      checked={field.value === 'stable'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                    <RadioField
                      icon={<Waves className='h-5 w-5'/>}
                      label='Solo Aluvial Solto / Argila'
                      name='soilProfile'
                      value='loose_clay'
                      checked={field.value === 'loose_clay'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                    <RadioField
                      icon={<Droplets className='h-5 w-5'/>}
                      label='Lençol Freático / Água no Fundo'
                      name='soilProfile'
                      value='water_table'
                      checked={field.value === 'water_table'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                  </div>
                </fieldset>
              )}
            />

            <fieldset className='space-y-3'>
              <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Obstáculos no Local</legend>
              <div className='space-y-3'>
                <Controller
                  control={form.control}
                  name='hasUndergroundObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Subterrâneos'
                      description='Canos, raízes ou caliças (entulhos e concretos)'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasElevatedObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Elevados'
                      description='Árvores ou fios de tensão'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasNeighborSetbacks'
                  render={({field}) => (
                    <CheckboxField
                      label='Servidões Vizinhas'
                      description='Recuos rígidos de limites'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </fieldset>
          </div>
        </HouseFormSection>

        <HouseFormSection number='03' title='Características do Local'>
          <div data-testid='site-characteristics-grid' className='grid gap-4 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='locationQuery'
              render={({field, fieldState}) => (
                <TextField
                  label='Localização Geográfica'
                  placeholder='Carregar a partir de coordenadas'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name='terrainComplexity'
              render={({field, fieldState}) => (
                <VisualSelectField
                  label='Complexidade do Terreno'
                  ariaLabel='Complexidade do Terreno'
                  value={field.value}
                  options={TERRAIN_COMPLEXITY_OPTIONS}
                  onChange={(terrainComplexity) => field.onChange(terrainComplexity)}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div data-testid='static-map-wrapper' className='md:col-span-2'>
              <StaticMapPreview locationQuery={locationQuery}/>
            </div>
          </div>
        </HouseFormSection>

        <div className='grid gap-4 md:grid-cols-2'>
          <PrimaryButton type='submit' className='w-full md:col-start-2'>Salvar Configurações</PrimaryButton>
        </div>
      </div>
    </form>
  );
}

function ConstructionStatusDialog({
  open,
  constructionCode,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  constructionCode: string;
  action: StatusChangeAction;
  onCancel(): void;
  onConfirm(): void;
}) {
  const isUnarchive = action === 'unarchive';
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUnarchive ? 'Desarquivar construção?' : 'Arquivar construção?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isUnarchive
              ? `A construção ${constructionCode || 'sem código'} voltará a ficar disponível para gestão e seleção.`
              : `A construção ${constructionCode || 'sem código'} será arquivada e deixará de abrir no Canvas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isUnarchive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {isUnarchive ? 'Desarquivar construção' : 'Arquivar construção'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function HouseStatusDialog({
  open,
  familyName,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  familyName: string;
  action: StatusChangeAction;
  onCancel(): void;
  onConfirm(): void;
}) {
  const isUnarchive = action === 'unarchive';
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}>
      <AlertDialogContent className='bg-white'>
        <AlertDialogHeader>
          <AlertDialogTitle>{isUnarchive ? 'Desarquivar casa?' : 'Arquivar casa?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isUnarchive
              ? `A casa de ${familyName || 'família sem nome'} voltará a ficar disponível no gerenciamento.`
              : `A casa de ${familyName || 'família sem nome'} será arquivada e deixará de aparecer no Canvas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isUnarchive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {isUnarchive ? 'Desarquivar casa' : 'Arquivar casa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MetricCard({label, value}: { label: string; value: number }) {
  return (
    <article className='rounded-2xl bg-slate-50 px-3 py-3 text-center sm:px-5 sm:py-4'>
      <p className='text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[11px] sm:tracking-[0.14em]'>{label}</p>
      <p className='mt-2 text-xl font-semibold text-slate-950 sm:text-2xl'>{value}</p>
    </article>
  );
}

function HouseThumbnail({
  familyName,
  photoDataUrl,
}: {
  familyName: string;
  photoDataUrl?: string;
}) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt={`Foto da casa ${familyName}`}
        className='h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white'
      />
    );
  }

  const palette = getAvatarPalette(familyName);
  return (
    <span
      role='img'
      aria-label={`Foto gerada da casa ${familyName}`}
      className='grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-white'
      style={{backgroundColor: palette.background, color: palette.foreground}}
    >
      {getHouseInitials(familyName)}
    </span>
  );
}

function HouseStatusBadge({status}: { status: PersistedHouseStatus }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ring-1',
      HOUSE_STATUS_BADGE_CLASS_NAMES[status],
    )}>
      {HOUSE_STATUS_LABELS[status]}
    </span>
  );
}

function HouseConfigurationSidebar({constructionSite}: { constructionSite: ConstructionSiteState }) {
  const code = constructionSite.constructionSite.externalCode?.trim() || 'Sem código';
  const communityLabel = getConstructionSiteCommunityName(constructionSite) ?? 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(constructionSite.constructionSite.constructionDate);

  return (
    <aside className='h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-4'>
      {constructionSite.constructionSite.photoDataUrl ? (
        <img
          src={constructionSite.constructionSite.photoDataUrl}
          alt={`Foto da construção ${code}`}
          className='h-28 w-full rounded-xl object-cover'
        />
      ) : (
        <span
          role='img'
          aria-label={`Foto da construção ${code}`}
          className='grid h-28 w-full place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white'
        >
          {getConstructionInitials(code)}
        </span>
      )}
      <dl className='mt-4 space-y-3'>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Código da CC</dt>
          <dd className='mt-1 text-sm font-semibold text-slate-950'>{code}</dd>
        </div>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Comunidade</dt>
          <dd className='mt-1 text-sm font-medium leading-5 text-slate-600'>{communityLabel}</dd>
        </div>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Data da Construção</dt>
          <dd className='mt-1 text-sm font-medium leading-5 text-slate-600'>{constructionDateLabel}</dd>
        </div>
      </dl>
    </aside>
  );
}

function HouseFormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className='space-y-4 py-2'>
      <div className='mb-4 flex items-center gap-3'>
        <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white'>
          {number}
        </span>
        <h2 className='text-base font-semibold text-slate-950'>{title}</h2>
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

function PhotoUploadField({
  label,
  value,
  onChange,
  testId = 'family-photo-field',
  className,
  dropZoneClassName,
  loadedDropZoneClassName,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  testId?: string;
  className?: string;
  dropZoneClassName?: string;
  loadedDropZoneClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoOrientation, setPhotoOrientation] = useState<PhotoOrientation | undefined>();

  useEffect(() => {
    if (!value) setPhotoOrientation(undefined);
  }, [value]);

  const updatePhoto = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      onChange(typeof reader.result === 'string' ? reader.result : '');
    });
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updatePhoto(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    updatePhoto(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openFilePicker();
  };

  const clearPhoto = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange('');
  };

  return (
    <div data-testid={testId} className={cn('flex w-full flex-col gap-2', className)}>
      <span className='block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>{label}</span>
      <div
        role='button'
        tabIndex={0}
        aria-label={label}
        data-photo-orientation={photoOrientation}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-blue-200 bg-blue-50/80 px-3 py-4 text-center text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200',
          dropZoneClassName,
          value ? cn('p-0', loadedDropZoneClassName) : null,
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              onLoad={(event) => {
                setPhotoOrientation(getPhotoOrientation(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight));
              }}
              className='absolute inset-0 h-full w-full rounded-xl object-cover object-center'
            />
            <button
              type='button'
              aria-label={`Remover ${label}`}
              onClick={clearPhoto}
              className='absolute right-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/75 text-slate-700/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <X className='h-4 w-4'/>
            </button>
            <span className='absolute bottom-4 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-white/75 px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700/90 shadow-sm backdrop-blur-sm'>
              Clique para fazer upload ou arraste uma foto
            </span>
          </>
        ) : (
          <>
            <Camera className='h-6 w-6 text-slate-500'/>
            <span>Clique para fazer upload ou arraste uma foto</span>
          </>
        )}
        <input
          ref={inputRef}
          aria-label={`${label} arquivo`}
          type='file'
          accept='image/*'
          className='sr-only'
          onClick={(event) => event.stopPropagation()}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

function RadioField({
  icon,
  label,
  name,
  value,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange(value: string): void;
}) {
  return (
    <label
      className={cn(
        'flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-blue-200',
        checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent bg-slate-50 text-slate-950 hover:bg-slate-100',
      )}
    >
      <input
        type='radio'
        aria-label={label}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.value)}
        className='sr-only'
      />
      <span className={cn('shrink-0', checked ? 'text-blue-600' : 'text-slate-500')}>{icon}</span>
      <span className='min-w-0 flex-1'>{label}</span>
      <span
        aria-hidden='true'
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
          checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent',
        )}
      >
        {checked ? <Check className='h-3.5 w-3.5'/> : null}
      </span>
    </label>
  );
}

function StaticMapPreview({locationQuery}: { locationQuery: string }) {
  const coordinates = parseMapCoordinates(locationQuery);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;
  const googleMapsUrl = coordinates && googleMapsApiKey
    ? buildGoogleMapsEmbedUrl(coordinates, googleMapsApiKey)
    : null;

  if (googleMapsUrl) {
    return (
      <div
        data-testid='static-map-preview'
        aria-label='Mapa do local informado'
        className='relative min-h-40 overflow-hidden rounded-[28px] bg-blue-50'
      >
        <iframe
          title='Mapa do local informado'
          data-testid='google-maps-embed'
          src={googleMapsUrl}
          className='absolute inset-0 h-full w-full border-0'
          loading='lazy'
          allowFullScreen
          referrerPolicy='no-referrer-when-downgrade'
        />
      </div>
    );
  }

  const fallbackLabel = locationQuery.trim()
    ? coordinates ? 'Configure a chave do Google Maps' : 'Coordenadas inválidas'
    : 'Localização a definir';

  return (
    <div
      data-testid='static-map-preview'
      aria-label='Mapa visual estático do local'
      className='relative min-h-40 overflow-hidden rounded-[28px] bg-blue-50'
    >
      <div className='absolute inset-0 opacity-40' style={GRIDDED_WORKSPACE_STYLE}/>
      <div className='absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/50 p-2'>
        <div className='h-full w-full rounded-full bg-blue-600 shadow-sm'/>
      </div>
      <div className='absolute bottom-4 left-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm'>
        <MapPin className='h-3.5 w-3.5 shrink-0 text-blue-600'/>
        {fallbackLabel}
      </div>
    </div>
  );
}

function PaginationButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type='button'
      className={cn(
        'grid h-8 w-8 cursor-pointer place-items-center rounded-full text-base font-bold text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200',
        props.disabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : null,
        props.className,
      )}
    />
  );
}

function EmptyState({title, description}: { title: string; description: string }) {
  return (
    <section className='mt-4 rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center'>
      <h2 className='text-base font-semibold text-slate-900'>{title}</h2>
      <p className='mt-2 text-sm text-slate-600'>{description}</p>
    </section>
  );
}

function TextField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  required,
  maxLength,
  pattern,
  inputMode,
  error,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  error?: string;
}) {
  const inputId = `text-field-${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={inputClassName}
      />
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function VisualSelect<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex min-h-10 min-w-0 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 sm:min-h-9',
      className,
    )}>
      <span className='min-w-0 shrink truncate'>{label}</span>
      <VisualSelectMenu
        ariaLabel={ariaLabel}
        value={value}
        options={options}
        onChange={onChange}
        triggerClassName='min-h-7 min-w-0 flex-1 bg-transparent px-0 py-0 text-xs font-semibold text-slate-700'
      />
    </div>
  );
}

function VisualSelectField<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  error?: string;
}) {
  const errorId = `${ariaLabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <span>{label}</span>
      <VisualSelectMenu
        ariaLabel={ariaLabel}
        value={value}
        options={options}
        onChange={onChange}
        triggerClassName={cn(inputClassName, 'justify-between text-left')}
        ariaInvalid={Boolean(error)}
        ariaDescribedBy={error ? errorId : undefined}
      />
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function VisualSelectMenu<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  triggerClassName,
  ariaInvalid,
  ariaDescribedBy,
}: {
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  triggerClassName: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const selectOption = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-100',
            triggerClassName,
          )}
        >
          <span className='min-w-0 flex-1 truncate text-left normal-case tracking-normal'>
            {selectedOption?.label ?? 'Selecionar'}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open ? 'rotate-180' : null)}/>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={8}
        data-testid={`${ariaLabel}-menu`}
        className='w-56 rounded-xl border border-slate-200 bg-white/95 p-1 text-slate-700 shadow-xl backdrop-blur-xl'
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type='button'
              role='menuitemradio'
              aria-checked={selected}
              onClick={() => selectOption(option.value)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                selected ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Check className={cn('h-4 w-4 shrink-0', selected ? 'text-blue-600 opacity-100' : 'opacity-0')}/>
              <span className='min-w-0 flex-1 truncate text-left'>{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function TextArea({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  maxLength,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  maxLength?: number;
  error?: string;
}) {
  const inputId = `textarea-${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor={inputId}>{label}</label>
      <textarea
        id={inputId}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        rows={4}
        className={cn(inputClassName, 'resize-y py-3')}
      />
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <label className='flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-slate-50 px-4 text-sm transition-colors hover:bg-slate-100 focus-within:ring-2 focus-within:ring-blue-200'>
      <input
        type='checkbox'
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className='sr-only'
      />
      <span
        aria-hidden='true'
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded-[3px]',
          checked ? 'bg-blue-600 text-white' : 'bg-blue-100 text-transparent',
        )}
      >
        {checked ? <Check className='h-3 w-3'/> : null}
      </span>
      <span className='min-w-0'>
        <span className='block font-semibold text-slate-950'>{label}</span>
        <span className='mt-0.5 block text-[11px] font-medium text-slate-500'>{description}</span>
      </span>
    </label>
  );
}

const inputClassName = 'min-h-10 rounded-lg border border-transparent bg-blue-50/80 px-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100';

function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn(buttonClassName, 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700', props.className)}/>;
}

const buttonClassName = 'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50';

function getScreenTitle(screen: ConstructionSiteManagementScreen, constructionLabel: string): string {
  if (screen === 'construction-list') return 'Construções TETO';
  if (screen === 'construction-create') return 'Adicionar Construção TETO';
  if (screen === 'construction-detail') return 'Editar Construção TETO';
  if (screen === 'houses') return 'Casas da Construção';
  if (screen === 'house-create' || screen === 'house-detail') return 'Configuração da Casa';
  return constructionLabel;
}

function getScreenSubtitle(screen: ConstructionSiteManagementScreen): string {
  if (screen === 'construction-list') return 'Criar, arquivar, listar e trocar construções.';
  if (screen === 'construction-create') return 'Cadastrar código da CC, data e comunidade associada.';
  if (screen === 'construction-detail') return 'Atualizar os dados da construção selecionada.';
  if (screen === 'houses') return 'Casas vinculadas à construção ativa.';
  return 'Família, restrições e características do local da casa.';
}

function getSelectedConstructionFields(constructionSite: ConstructionSiteState | null, summary: ConstructionSiteSummary | null) {
  if (summary) {
    return {
      externalCode: summary.externalCode ?? '',
      photoDataUrl: summary.photoDataUrl ?? '',
      constructionDate: summary.constructionDate ?? '',
      communityName: summary.communityName ?? '',
    };
  }

  return {
    externalCode: constructionSite?.constructionSite.externalCode ?? '',
    photoDataUrl: constructionSite?.constructionSite.photoDataUrl ?? '',
    constructionDate: constructionSite?.constructionSite.constructionDate ?? '',
    communityName: constructionSite ? (getConstructionSiteCommunityName(constructionSite) ?? '') : '',
  };
}

function compareConstructionSummaries(a: ConstructionSiteSummary, b: ConstructionSiteSummary, sortKey: ConstructionSortKey): number {
  if (sortKey === 'constructionDate') return compareOptionalDateDesc(a.constructionDate, b.constructionDate, a.updatedAt, b.updatedAt);
  if (sortKey === 'externalCode') return getConstructionCode(a).localeCompare(getConstructionCode(b), 'pt-BR');
  return CONSTRUCTION_SITE_STATUS_LABELS[a.status].localeCompare(CONSTRUCTION_SITE_STATUS_LABELS[b.status], 'pt-BR');
}

function compareOptionalDateDesc(
  aDate: string | undefined,
  bDate: string | undefined,
  aFallback: string,
  bFallback: string,
): number {
  if (aDate && bDate) return bDate.localeCompare(aDate);
  if (aDate) return -1;
  if (bDate) return 1;
  return bFallback.localeCompare(aFallback);
}

function formatPaginationText(
  firstIndex: number,
  lastIndex: number,
  total: number,
  entityLabel = 'construções',
): string {
  if (!total) return `Mostrando 0-0 de 0 ${entityLabel}`;
  return `Mostrando ${firstIndex + 1}-${lastIndex} de ${total} ${entityLabel}`;
}

function formatTimestampDate(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return {date: 'Data inválida', time: ''};

  return {
    date: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date),
    time: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(date),
  };
}

function formatDateOnly(value?: string): string {
  const parsed = parseDateOnlyParts(value);
  if (!parsed) return 'Sem data';
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${parsed.year}`;
}

function parseDateOnly(value?: string): Date | undefined {
  const parsed = parseDateOnlyParts(value);
  if (!parsed) return undefined;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

function parseDateOnlyParts(value?: string): { year: number; month: number; day: number } | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null;
  }
  return {year, month, day};
}

function toDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildGoogleMapsEmbedUrl(
  coordinates: { latitude: number; longitude: number },
  apiKey: string,
): string {
  const query = encodeURIComponent(`${coordinates.latitude},${coordinates.longitude}`);
  const key = encodeURIComponent(apiKey);
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}&zoom=17`;
}

function getConstructionCode(summary: ConstructionSiteSummary): string {
  return summary.externalCode?.trim() || 'Construção sem código';
}

function getConstructionInitials(label: string): string {
  const alphanumeric = label.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (alphanumeric.length >= 2) return alphanumeric.slice(0, 2);
  return alphanumeric || 'CT';
}

function getAvatarPalette(label: string): { background: string; foreground: string } {
  const palettes = [
    {background: '#dbeafe', foreground: '#1d4ed8'},
    {background: '#dcfce7', foreground: '#15803d'},
    {background: '#ffedd5', foreground: '#c2410c'},
    {background: '#fce7f3', foreground: '#be185d'},
    {background: '#e0f2fe', foreground: '#0369a1'},
  ];
  const hash = label.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

interface HouseConfigurationFormState {
  familyName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  familyPhotoDataUrl: string;
  notes: string;
  soilProfile: SoilProfile | '';
  hasUndergroundObstacles: boolean;
  hasElevatedObstacles: boolean;
  hasNeighborSetbacks: boolean;
  locationQuery: string;
  terrainComplexity: TerrainComplexity;
}

function getHouseConfigurationInitialState(
  constructionSite: ConstructionSiteState,
  house: PersistedHouseRecord | null,
): HouseConfigurationFormState {
  const family = house ? getHouseFamily(constructionSite, house) : null;
  const assessment = house?.siteAssessment;

  return {
    familyName: family?.name ?? '',
    primaryContactName: family?.primaryContactName ?? '',
    primaryContactPhone: family?.primaryContactPhone ?? '',
    primaryContactEmail: family?.primaryContactEmail ?? '',
    familyPhotoDataUrl: family?.photoDataUrl ?? '',
    notes: family?.notes ?? '',
    soilProfile: assessment?.soilProfile ?? '',
    hasUndergroundObstacles: assessment?.hasUndergroundObstacles ?? false,
    hasElevatedObstacles: assessment?.hasElevatedObstacles ?? false,
    hasNeighborSetbacks: assessment?.hasNeighborSetbacks ?? false,
    locationQuery: assessment?.locationQuery ?? '',
    terrainComplexity: assessment?.terrainComplexity ?? 'flat',
  };
}

function toHouseConfigurationInput(form: HouseConfigurationFormState): CreateHouseInput {
  return {
    familyName: form.familyName.trim() || 'Família sem nome',
    primaryContactName: form.primaryContactName.trim() || undefined,
    primaryContactPhone: form.primaryContactPhone.trim() || undefined,
    primaryContactEmail: form.primaryContactEmail.trim() || undefined,
    familyPhotoDataUrl: form.familyPhotoDataUrl || undefined,
    notes: form.notes,
    siteAssessment: {
      soilProfile: form.soilProfile || undefined,
      hasUndergroundObstacles: form.hasUndergroundObstacles,
      hasElevatedObstacles: form.hasElevatedObstacles,
      hasNeighborSetbacks: form.hasNeighborSetbacks,
      locationQuery: form.locationQuery.trim() || undefined,
      terrainComplexity: form.terrainComplexity,
    },
  };
}

function compareHouses(
  constructionSite: ConstructionSiteState,
  a: PersistedHouseRecord,
  b: PersistedHouseRecord,
  sortKey: HouseSortKey,
): number {
  if (sortKey === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
  if (sortKey === 'familyName') {
    return getHouseFamilyName(constructionSite, a).localeCompare(getHouseFamilyName(constructionSite, b), 'pt-BR');
  }
  if (sortKey === 'houseType') return formatHouseType(a.houseType).localeCompare(formatHouseType(b.houseType), 'pt-BR');
  return HOUSE_STATUS_LABELS[a.status].localeCompare(HOUSE_STATUS_LABELS[b.status], 'pt-BR');
}

function formatHouseType(type: HouseType): string {
  if (type === 'tipo6') return 'Tipo 6';
  if (type === 'tipo3') return 'Tipo 3';
  return 'Sem tipo';
}

function getHouseInitials(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'CA';
}

function getActiveHouse(constructionSite: ConstructionSiteState): PersistedHouseRecord | null {
  return constructionSite.houses.find((house) => house.id === constructionSite.constructionSite.activeHouseId)
    ?? constructionSite.houses.find((house) => house.status !== 'archived')
    ?? null;
}

function getHouseFamily(constructionSite: ConstructionSiteState, house: PersistedHouseRecord): FamilyRecord | null {
  return constructionSite.families.find((family) => family.id === house.familyId) ?? null;
}

function getHouseFamilyName(constructionSite: ConstructionSiteState, house: PersistedHouseRecord): string {
  return getHouseFamily(constructionSite, house)?.name ?? 'Família sem nome';
}
