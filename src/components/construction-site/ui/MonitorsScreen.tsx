import {type KeyboardEvent, type MouseEvent, useEffect, useMemo, useState} from 'react';
import type {
  ConstructionSiteState,
  MonitorRecord,
  MonitorStatus,
} from '@/shared/types/construction-site.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  LIST_CONTROLS_CLASS,
  LIST_SELECT_CLASS,
  MONITOR_SORT_OPTIONS,
  MONITOR_STATUS_BADGE_CLASS_NAMES,
  MONITOR_STATUS_FILTER_OPTIONS,
  MONITOR_STATUS_LABELS,
  MONITORS_PER_PAGE,
} from '@/components/construction-site/ui/lib/constants.ts';
import type {
  MonitorSortKey,
  MonitorStatusFilter,
  StatusChangeAction,
} from '@/components/construction-site/ui/lib/types.ts';
import {
  compareMonitors,
  formatPaginationText,
  getAvatarPalette,
  getMonitorInitials,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {
  EmptyState,
  MobilePagination,
  PaginationButton,
  StatusActionButton,
  VisualSelect,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';

export function MonitorsScreen({
  constructionSite,
  onEditMonitor,
  onRequestMonitorStatusChange,
}: {
  constructionSite: ConstructionSiteState;
  onEditMonitor(monitorId: string): void;
  onRequestMonitorStatusChange(monitorId: string, action: StatusChangeAction): void;
}) {
  const [statusFilter, setStatusFilter] = useState<MonitorStatusFilter>('active');
  const [sortKey, setSortKey] = useState<MonitorSortKey>('name');
  const [page, setPage] = useState(1);

  const filteredMonitors = useMemo(() => {
    return [...constructionSite.monitors]
      .filter((monitor) => statusFilter === 'all' || monitor.status === statusFilter)
      .sort((a, b) => compareMonitors(a, b, sortKey));
  }, [constructionSite.monitors, sortKey, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredMonitors.length / MONITORS_PER_PAGE));
  const normalizedPage = Math.min(page, pageCount);
  const firstIndex = filteredMonitors.length ? (normalizedPage - 1) * MONITORS_PER_PAGE : 0;
  const lastIndex = Math.min(firstIndex + MONITORS_PER_PAGE, filteredMonitors.length);
  const pageMonitors = filteredMonitors.slice(firstIndex, lastIndex);

  useEffect(() => {
    setPage(1);
  }, [sortKey, statusFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  return (
    <section aria-label='Listagem de monitores' className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div data-testid='monitor-list-controls' className={LIST_CONTROLS_CLASS}>
          <VisualSelect<MonitorStatusFilter>
            label='Filtro'
            ariaLabel='Filtrar monitores por status'
            value={statusFilter}
            options={MONITOR_STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className={LIST_SELECT_CLASS}
          />
          <VisualSelect<MonitorSortKey>
            label='Ordenação'
            ariaLabel='Ordenar monitores por'
            value={sortKey}
            options={MONITOR_SORT_OPTIONS}
            onChange={setSortKey}
            className={LIST_SELECT_CLASS}
          />
        </div>
        <div
          data-testid='monitor-desktop-pagination'
          className='hidden items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:flex sm:justify-start'
        >
          <span>{formatPaginationText(firstIndex, lastIndex, filteredMonitors.length, 'monitores')}</span>
          <div className='flex items-center gap-1'>
            <PaginationButton
              aria-label='Página anterior de monitores'
              disabled={normalizedPage <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              ‹
            </PaginationButton>
            <PaginationButton
              aria-label='Próxima página de monitores'
              disabled={normalizedPage >= pageCount}
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            >
              ›
            </PaginationButton>
          </div>
        </div>
      </div>

      <div data-testid='monitor-desktop-table' className='hidden overflow-x-auto sm:block'>
        <table className='min-w-full table-fixed border-separate border-spacing-y-3'>
          <colgroup>
            <col className='w-[52%]'/>
            <col className='w-[16%]'/>
            <col className='w-[32%]'/>
          </colgroup>
          <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
            <th scope='col' className='px-3 pb-1'>Monitores</th>
            <th scope='col' className='px-3 pb-1 text-center'>Status</th>
            <th scope='col' className='px-3 pb-1 text-center'>
              <span className='grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-3'>
                <span className='justify-self-center'>Contato</span>
                <span aria-hidden='true'/>
              </span>
            </th>
          </tr>
          </thead>
          <tbody>
          {pageMonitors.map((monitor) => (
            <MonitorTableRow
              key={monitor.id}
              monitor={monitor}
              onOpenMonitor={onEditMonitor}
              onRequestMonitorStatusChange={onRequestMonitorStatusChange}
            />
          ))}
          </tbody>
        </table>
      </div>

      <div data-testid='monitor-mobile-list' className='space-y-3 sm:hidden'>
        {pageMonitors.map((monitor) => (
          <MonitorMobileCard
            key={monitor.id}
            monitor={monitor}
            onOpenMonitor={onEditMonitor}
            onRequestMonitorStatusChange={onRequestMonitorStatusChange}
          />
        ))}
      </div>

      <MobilePagination
        testId='monitor-mobile-pagination'
        text={formatPaginationText(firstIndex, lastIndex, filteredMonitors.length, 'monitores')}
        page={normalizedPage}
        pageCount={pageCount}
        entityLabel='monitores'
        onPageChange={setPage}
      />

      {!filteredMonitors.length ? (
        <EmptyState
          title={constructionSite.monitors.length ? 'Nenhum monitor encontrado' : 'Nenhum monitor cadastrado'}
          description={
            constructionSite.monitors.length
              ? 'Altere o filtro para consultar monitores inativos ou todos.'
              : 'Adicione um monitor para registrar a equipe da construção.'
          }
        />
      ) : null}
    </section>
  );
}

function MonitorMobileCard({
  monitor,
  onOpenMonitor,
  onRequestMonitorStatusChange,
}: {
  monitor: MonitorRecord;
  onOpenMonitor(monitorId: string): void;
  onRequestMonitorStatusChange(monitorId: string, action: StatusChangeAction): void;
}) {
  const statusLabel = MONITOR_STATUS_LABELS[monitor.status];
  const openMonitor = () => onOpenMonitor(monitor.id);
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestMonitorStatusChange(monitor.id, monitor.status === 'inactive' ? 'unarchive' : 'archive');
  };

  return (
    <article
      data-testid='monitor-mobile-card'
      role='button'
      tabIndex={0}
      aria-label={`Abrir monitor ${monitor.name} ${statusLabel}`}
      onClick={openMonitor}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openMonitor();
      }}
      className={cn(
        'cursor-pointer rounded-2xl bg-slate-50 p-4 text-sm shadow-sm shadow-slate-200/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 hover:bg-slate-100',
        monitor.status === 'inactive' ? 'opacity-55 grayscale' : null,
      )}
    >
      <div className='flex items-start gap-3'>
        <MonitorAvatar monitor={monitor}/>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 className='truncate text-base font-semibold text-slate-950'>{monitor.name}</h2>
              <p className='mt-1 truncate text-xs font-medium text-slate-500'>{monitor.email || 'Sem e-mail'}</p>
            </div>
            <MonitorStatusBadge status={monitor.status}/>
          </div>
        </div>
      </div>
      <div className='mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2'>
        <div className='min-w-0 text-xs font-medium text-slate-600'>
          <span className='block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
            Telefone
          </span>
          <span className='mt-0.5 block'>{monitor.phone}</span>
        </div>
        <StatusActionButton
          action={monitor.status === 'inactive' ? 'unarchive' : 'archive'}
          label={monitor.status === 'inactive' ? `Reativar monitor ${monitor.name}` : `Inativar monitor ${monitor.name}`}
          onClick={requestStatusChange}
        />
      </div>
    </article>
  );
}

function MonitorTableRow({
  monitor,
  onOpenMonitor,
  onRequestMonitorStatusChange,
}: {
  monitor: MonitorRecord;
  onOpenMonitor(monitorId: string): void;
  onRequestMonitorStatusChange(monitorId: string, action: StatusChangeAction): void;
}) {
  const statusLabel = MONITOR_STATUS_LABELS[monitor.status];
  const openMonitor = () => onOpenMonitor(monitor.id);
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestMonitorStatusChange(monitor.id, monitor.status === 'inactive' ? 'unarchive' : 'archive');
  };

  return (
    <tr
      tabIndex={0}
      aria-label={`${monitor.name} ${statusLabel} ${monitor.phone} ${monitor.email ?? ''}`}
      onClick={openMonitor}
      onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openMonitor();
      }}
      className={cn(
        'cursor-pointer rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 hover:bg-slate-50',
        monitor.status === 'inactive' ? 'opacity-55' : null,
      )}
    >
      <td className='max-w-0 rounded-l-lg px-3 py-3'>
        <div className='flex min-h-14 min-w-0 w-full items-center gap-3 rounded-lg text-left'>
          <MonitorAvatar monitor={monitor}/>
          <span data-testid='monitor-table-identity' className='min-w-0 flex-1'>
            <span
              data-testid='monitor-table-name'
              title={monitor.name}
              className='block truncate font-semibold text-slate-950'
            >
              {monitor.name}
            </span>
            <span
              data-testid='monitor-table-email'
              title={monitor.email || 'Sem e-mail'}
              className='mt-0.5 block truncate text-xs font-medium text-slate-500'
            >
              {monitor.email || 'Sem e-mail'}
            </span>
          </span>
        </div>
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <MonitorStatusBadge status={monitor.status}/>
      </td>
      <td className='rounded-r-lg px-3 py-3 text-center align-middle text-xs font-medium text-slate-700'>
        <div className='grid min-h-14 grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-3'>
          <span className='justify-self-center whitespace-nowrap text-center'>{monitor.phone}</span>
          <StatusActionButton
            action={monitor.status === 'inactive' ? 'unarchive' : 'archive'}
            label={monitor.status === 'inactive' ? `Reativar monitor ${monitor.name}` : `Inativar monitor ${monitor.name}`}
            onClick={requestStatusChange}
          />
        </div>
      </td>
    </tr>
  );
}

function MonitorAvatar({monitor}: { monitor: MonitorRecord }) {
  if (monitor.photoDataUrl) {
    return (
      <img
        src={monitor.photoDataUrl}
        alt={`Foto do monitor ${monitor.name}`}
        className='h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white'
      />
    );
  }

  const palette = getAvatarPalette(monitor.name);
  return (
    <span
      role='img'
      aria-label={`Foto gerada do monitor ${monitor.name}`}
      className='grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-white'
      style={{backgroundColor: palette.background, color: palette.foreground}}
    >
      {getMonitorInitials(monitor.name)}
    </span>
  );
}

function MonitorStatusBadge({status}: { status: MonitorStatus }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ring-1',
      MONITOR_STATUS_BADGE_CLASS_NAMES[status],
    )}>
      {MONITOR_STATUS_LABELS[status]}
    </span>
  );
}
