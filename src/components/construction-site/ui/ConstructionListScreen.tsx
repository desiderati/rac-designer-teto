import {type KeyboardEvent, type MouseEvent, useEffect, useMemo, useState} from 'react';
import {Download, Home, UsersRound} from 'lucide-react';
import type {ConstructionSiteStatus, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  CONSTRUCTION_SITE_STATUS_LABELS,
  CONSTRUCTION_SORT_OPTIONS,
  CONSTRUCTION_STATUS_FILTER_OPTIONS,
  CONSTRUCTIONS_PER_PAGE,
  LIST_CONTROLS_CLASS,
  LIST_SELECT_CLASS,
  STATUS_BADGE_CLASS_NAMES,
} from '@/components/construction-site/ui/lib/constants.ts';
import type {ConstructionSortKey, ConstructionStatusFilter, StatusChangeAction} from '@/components/construction-site/ui/lib/types.ts';
import {
  compareConstructionSummaries,
  formatDateOnly,
  formatPaginationText,
  getAvatarPalette,
  getConstructionCode,
  getConstructionInitials,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {
  EmptyState,
  MobilePagination,
  PaginationButton,
  RoundIconActionButton,
  StatusActionButton,
  VisualSelect,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';

export function ConstructionListScreen({
  summaries,
  activeConstructionId,
  onOpenConstruction,
  onOpenConstructionHouses,
  onOpenConstructionMonitors,
  onExportConstructionRacsZip,
  exportingRacsZipConstructionId,
  onRequestStatusChange,
}: {
  summaries: ConstructionSiteSummary[];
  activeConstructionId?: string;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionHouses(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionMonitors(summary: ConstructionSiteSummary): Promise<void>;
  onExportConstructionRacsZip(summary: ConstructionSiteSummary): Promise<void>;
  exportingRacsZipConstructionId?: string | null;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {
  const [statusFilter, setStatusFilter] = useState<ConstructionStatusFilter>('all');
  const [sortKey, setSortKey] = useState<ConstructionSortKey>('constructionDate');
  const [page, setPage] = useState(1);

  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((summary) => statusFilter === 'all' || summary.status === statusFilter)
      .sort((a, b) => compareConstructionSummaries(a, b, sortKey));
  }, [sortKey, statusFilter, summaries]);

  const pageCount = Math.max(1, Math.ceil(filteredSummaries.length / CONSTRUCTIONS_PER_PAGE));
  const normalizedPage = Math.min(page, pageCount);
  const firstIndex = filteredSummaries.length ? (normalizedPage - 1) * CONSTRUCTIONS_PER_PAGE : 0;
  const lastIndex = Math.min(firstIndex + CONSTRUCTIONS_PER_PAGE, filteredSummaries.length);
  const pageSummaries = filteredSummaries.slice(firstIndex, lastIndex);
  const guidedTourConstructionId = pageSummaries.find((summary) => summary.status !== 'archived')?.id ?? null;

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
          <VisualSelect<ConstructionStatusFilter>
            label='Filtro'
            ariaLabel='Filtrar por status'
            value={statusFilter}
            options={CONSTRUCTION_STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className={LIST_SELECT_CLASS}
          />
          <VisualSelect<ConstructionSortKey>
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
        <table className='min-w-full table-fixed border-separate border-spacing-y-3'>
          <colgroup>
            <col className='w-[42%]'/>
            <col className='w-[16%]'/>
            <col className='w-[18%]'/>
            <col className='w-[24%]'/>
          </colgroup>
          <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
            <th scope='col' className='px-3 pb-1'>Construções</th>
            <th scope='col' className='px-3 pb-1 text-center'>Status</th>
            <th scope='col' className='px-3 pb-1 text-center'>Data da Construção</th>
            <th scope='col' className='w-[13.5rem] px-3 pb-1 text-center'>
              <span className='sr-only'>Ações</span>
            </th>
          </tr>
          </thead>
          <tbody>
          {pageSummaries.map((summary) => (
            <ConstructionTableRow
              key={summary.id}
              summary={summary}
              active={summary.id === activeConstructionId}
              showGuidedTourTargets={summary.id === guidedTourConstructionId}
              onOpenConstruction={onOpenConstruction}
              onOpenConstructionHouses={onOpenConstructionHouses}
              onOpenConstructionMonitors={onOpenConstructionMonitors}
              onExportConstructionRacsZip={onExportConstructionRacsZip}
              exportingRacsZipConstructionId={exportingRacsZipConstructionId}
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
            showGuidedTourTargets={summary.id === guidedTourConstructionId}
            onOpenConstruction={onOpenConstruction}
            onOpenConstructionHouses={onOpenConstructionHouses}
            onOpenConstructionMonitors={onOpenConstructionMonitors}
            onExportConstructionRacsZip={onExportConstructionRacsZip}
            exportingRacsZipConstructionId={exportingRacsZipConstructionId}
            onRequestStatusChange={onRequestStatusChange}
          />
        ))}
      </div>

      <MobilePagination
        testId='construction-mobile-pagination'
        text={formatPaginationText(firstIndex, lastIndex, filteredSummaries.length)}
        page={normalizedPage}
        pageCount={pageCount}
        entityLabel='construções'
        onPageChange={setPage}
      />

      {!filteredSummaries.length ? (
        <EmptyState
          title={summaries.length ? 'Nenhuma construção encontrada' : 'Nenhuma Construção TETO cadastrada'}
          description={summaries.length ? 'Altere o filtro para ver outras construções.' : 'Adicione uma construção para iniciar o gerenciamento.'}
        />
      ) : null}
    </section>
  );
}

export function ConstructionMobileCard({
  summary,
  active,
  showGuidedTourTargets = false,
  onOpenConstruction,
  onOpenConstructionHouses,
  onOpenConstructionMonitors,
  onExportConstructionRacsZip,
  exportingRacsZipConstructionId,
  onRequestStatusChange,
}: {
  summary: ConstructionSiteSummary;
  active: boolean;
  showGuidedTourTargets?: boolean;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionHouses(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionMonitors(summary: ConstructionSiteSummary): Promise<void>;
  onExportConstructionRacsZip(summary: ConstructionSiteSummary): Promise<void>;
  exportingRacsZipConstructionId?: string | null;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {

  const constructionCode = getConstructionCode(summary);
  const communityLabel = summary.communityName?.trim() || 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(summary.constructionDate);
  const isArchived = summary.status === 'archived';
  const openConstruction = () => {
    if (isArchived) return;
    void onOpenConstruction(summary);
  };

  const completionAction = summary.status === 'completed' ? 'markInProgress' : 'markCompleted';
  const completionLabel = summary.status === 'completed'
    ? `Voltar construção ${constructionCode} para andamento`
    : `Concluir construção ${constructionCode}`;
  const canExportRacsZip = summary.status === 'in_progress'
    && summary.nonArchivedHouseCount > 0;
  const isExportingRacsZip = exportingRacsZipConstructionId === summary.id;
  const exportRacsZipLabel = isExportingRacsZip
    ? `Gerando ZIP das RACs da construção ${constructionCode}`
    : `Exportar RACs ZIP da construção ${constructionCode}`;

  const requestArchiveStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, summary.status === 'archived' ? 'unarchive' : 'archive');
  };

  const requestCompletionStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, completionAction);
  };

  const openMonitors = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenConstructionMonitors(summary);
  };

  const openHouses = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenConstructionHouses(summary);
  };

  const exportRacsZip = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canExportRacsZip || isExportingRacsZip) return;
    void onExportConstructionRacsZip(summary);
  };

  return (
    <article
      data-testid='construction-mobile-card'
      role={isArchived ? undefined : 'button'}
      tabIndex={isArchived ? undefined : 0}
      aria-label={isArchived ? undefined : `Abrir construção ${constructionCode} ${CONSTRUCTION_SITE_STATUS_LABELS[summary.status]}`}
      onClick={isArchived ? undefined : openConstruction}
      onKeyDown={isArchived ? undefined : (event: KeyboardEvent<HTMLElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          openConstruction();
        }}
      className={cn(
        'rounded-2xl bg-slate-50 p-4 text-sm shadow-sm shadow-slate-200/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        !isArchived ? 'cursor-pointer' : 'cursor-default opacity-60 grayscale',
        !isArchived && active ? 'bg-blue-50/90 shadow-blue-100' : null,
        !isArchived && !active ? 'hover:bg-slate-100' : null,
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
        <div className='flex shrink-0 items-center gap-1'>
          {!isArchived ? (
            <>
              <RoundIconActionButton
                label={`Gerenciar monitores da construção ${constructionCode}`}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-monitors' : undefined}
                onClick={openMonitors}
              >
                <UsersRound className='h-4 w-4'/>
              </RoundIconActionButton>
              <RoundIconActionButton
                label={`Gerenciar casas da construção ${constructionCode}`}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-houses' : undefined}
                onClick={openHouses}
              >
                <Home className='h-4 w-4'/>
              </RoundIconActionButton>
              <RoundIconActionButton
                label={exportRacsZipLabel}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-export-racs' : undefined}
                onClick={exportRacsZip}
                disabled={!canExportRacsZip || isExportingRacsZip}
              >
                <Download className='h-4 w-4'/>
              </RoundIconActionButton>
              <StatusActionButton
                action={completionAction}
                label={completionLabel}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-completed' : undefined}
                onClick={requestCompletionStatusChange}
              />
            </>
          ) : null}
          <StatusActionButton
            action={summary.status === 'archived' ? 'unarchive' : 'archive'}
            label={summary.status === 'archived'
              ? `Desarquivar construção ${constructionCode}`
              : `Arquivar construção ${constructionCode}`}
            guidedTourId={showGuidedTourTargets ? 'rac-construction-archive' : undefined}
            onClick={requestArchiveStatusChange}
          />
        </div>
      </div>
    </article>
  );
}

export function ConstructionTableRow({
  summary,
  active,
  showGuidedTourTargets = false,
  onOpenConstruction,
  onOpenConstructionHouses,
  onOpenConstructionMonitors,
  onExportConstructionRacsZip,
  exportingRacsZipConstructionId,
  onRequestStatusChange,
}: {
  summary: ConstructionSiteSummary;
  active: boolean;
  showGuidedTourTargets?: boolean;
  onOpenConstruction(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionHouses(summary: ConstructionSiteSummary): Promise<void>;
  onOpenConstructionMonitors(summary: ConstructionSiteSummary): Promise<void>;
  onExportConstructionRacsZip(summary: ConstructionSiteSummary): Promise<void>;
  exportingRacsZipConstructionId?: string | null;
  onRequestStatusChange(summary: ConstructionSiteSummary, action: StatusChangeAction): void;
}) {

  const constructionCode = getConstructionCode(summary);
  const communityLabel = summary.communityName?.trim() || 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(summary.constructionDate);
  const isArchived = summary.status === 'archived';
  const openConstruction = () => {
    if (isArchived) return;
    void onOpenConstruction(summary);
  };

  const completionAction = summary.status === 'completed' ? 'markInProgress' : 'markCompleted';
  const completionLabel = summary.status === 'completed'
    ? `Voltar construção ${constructionCode} para andamento`
    : `Concluir construção ${constructionCode}`;
  const canExportRacsZip = summary.status === 'in_progress'
    && summary.nonArchivedHouseCount > 0;
  const isExportingRacsZip = exportingRacsZipConstructionId === summary.id;
  const exportRacsZipLabel = isExportingRacsZip
    ? `Gerando ZIP das RACs da construção ${constructionCode}`
    : `Exportar RACs ZIP da construção ${constructionCode}`;

  const requestArchiveStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, summary.status === 'archived' ? 'unarchive' : 'archive');
  };

  const requestCompletionStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestStatusChange(summary, completionAction);
  };

  const openMonitors = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenConstructionMonitors(summary);
  };

  const openHouses = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenConstructionHouses(summary);
  };

  const exportRacsZip = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canExportRacsZip || isExportingRacsZip) return;
    void onExportConstructionRacsZip(summary);
  };

  return (
    <tr
      tabIndex={isArchived ? undefined : 0}
      aria-label={`${isArchived ? '' : 'Abrir construção '}${constructionCode} ${CONSTRUCTION_SITE_STATUS_LABELS[summary.status]}`}
      onClick={isArchived ? undefined : openConstruction}
      onKeyDown={isArchived ? undefined : (event: KeyboardEvent<HTMLTableRowElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          openConstruction();
        }}
      className={cn(
        'rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        !isArchived ? 'cursor-pointer' : 'cursor-default opacity-60',
        !isArchived && active ? 'bg-blue-50/90' : null,
        !isArchived && !active ? 'bg-transparent hover:bg-slate-50' : null,
      )}
    >
      <td className='max-w-0 rounded-l-lg px-3 py-3'>
        <div className='flex min-h-14 min-w-0 w-full items-center gap-3 rounded-lg text-left'>
          <ConstructionAvatar label={constructionCode} photoDataUrl={summary.photoDataUrl}/>
          <span data-testid='construction-table-identity' className='min-w-0 flex-1'>
            <span
              data-testid='construction-table-code'
              title={constructionCode}
              className='block truncate font-semibold text-slate-950'
            >
              {constructionCode}
            </span>
            <span
              data-testid='construction-table-community'
              title={communityLabel}
              className='mt-0.5 block truncate text-xs font-medium text-slate-500'
            >
              {communityLabel}
            </span>
          </span>
        </div>
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <StatusBadge status={summary.status}/>
      </td>
      <td className='px-3 py-3 text-center align-middle text-xs font-medium text-slate-700'>
        {summary.constructionDate ? (
          <time dateTime={summary.constructionDate} className='block'>{constructionDateLabel}</time>
        ) : (
          <span className='block'>{constructionDateLabel}</span>
        )}
      </td>
      <td className='w-[13.5rem] rounded-r-lg px-3 py-3 align-middle'>
        <div className='flex items-center justify-end gap-2'>
          {!isArchived ? (
            <>
              <RoundIconActionButton
                label={`Gerenciar monitores da construção ${constructionCode}`}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-monitors' : undefined}
                onClick={openMonitors}
              >
                <UsersRound className='h-4 w-4'/>
              </RoundIconActionButton>
              <RoundIconActionButton
                label={`Gerenciar casas da construção ${constructionCode}`}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-houses' : undefined}
                onClick={openHouses}
              >
                <Home className='h-4 w-4'/>
              </RoundIconActionButton>
              <RoundIconActionButton
                label={exportRacsZipLabel}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-export-racs' : undefined}
                onClick={exportRacsZip}
                disabled={!canExportRacsZip || isExportingRacsZip}
              >
                <Download className='h-4 w-4'/>
              </RoundIconActionButton>
              <StatusActionButton
                action={completionAction}
                label={completionLabel}
                guidedTourId={showGuidedTourTargets ? 'rac-construction-completed' : undefined}
                onClick={requestCompletionStatusChange}
              />
            </>
          ) : null}
          <StatusActionButton
            action={summary.status === 'archived' ? 'unarchive' : 'archive'}
            label={summary.status === 'archived'
              ? `Desarquivar construção ${constructionCode}`
              : `Arquivar construção ${constructionCode}`}
            guidedTourId={showGuidedTourTargets ? 'rac-construction-archive' : undefined}
            onClick={requestArchiveStatusChange}
          />
        </div>
      </td>
    </tr>
  );
}

export function ConstructionAvatar({label, photoDataUrl}: { label: string; photoDataUrl?: string }) {
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

export function StatusBadge({status}: { status: ConstructionSiteStatus }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ring-1',
      STATUS_BADGE_CLASS_NAMES[status],
    )}>
      {CONSTRUCTION_SITE_STATUS_LABELS[status]}
    </span>
  );
}
