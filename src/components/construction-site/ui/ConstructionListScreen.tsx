import {type KeyboardEvent, type MouseEvent, useEffect, useMemo, useState} from 'react';
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
import {EmptyState, PaginationButton, StatusActionButton, VisualSelect} from '@/components/construction-site/ui/lib/shared-controls.tsx';

export function ConstructionListScreen({
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
    return summaries
      .filter((summary) => statusFilter === 'all' || summary.status === statusFilter)
      .sort((a, b) => compareConstructionSummaries(a, b, sortKey));
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

export function ConstructionMobileCard({
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

export function ConstructionTableRow({
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
