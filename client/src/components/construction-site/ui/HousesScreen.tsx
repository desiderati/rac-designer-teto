import {type KeyboardEvent, type MouseEvent, useEffect, useMemo, useState} from 'react';
import {Download, PackagePlus} from 'lucide-react';
import type {
  ConstructionSiteState,
  PersistedHouseRecord,
  PersistedHouseStatus,
} from '@/shared/types/construction-site.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  HOUSE_SORT_OPTIONS,
  HOUSE_STATUS_BADGE_CLASS_NAMES,
  HOUSE_STATUS_FILTER_OPTIONS,
  HOUSE_STATUS_LABELS,
  HOUSES_PER_PAGE,
  LIST_CONTROLS_CLASS,
  LIST_SELECT_CLASS,
} from '@/components/construction-site/ui/lib/constants.ts';
import type {HouseSortKey, HouseStatusFilter, StatusChangeAction} from '@/components/construction-site/ui/lib/types.ts';
import {
  compareHouses,
  formatHouseType,
  formatPaginationText,
  formatTimestampDate,
  getAvatarPalette,
  getHouseDifficultyIndicator,
  getHouseFamily,
  getHouseFamilyName,
  getHouseInitials,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {
  EmptyState,
  MobilePagination,
  PaginationButton,
  PermanentDeleteActionButton,
  RoundIconActionButton,
  StatusActionButton,
  VisualSelect,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {HouseDifficultyGauge} from '@/components/rac-editor/ui/HouseDifficultyGauge.tsx';

export function HousesScreen({
  constructionSite,
  activeHouse,
  onEditHouse,
  onOpenHouseExtraMaterials,
  onExportHouseRacPdf,
  exportingRacPdfHouseId,
  onRequestHouseStatusChange,
  onRequestHousePermanentDelete,
  readOnly = false,
}: {
  constructionSite: ConstructionSiteState;
  activeHouse: PersistedHouseRecord | null;
  onEditHouse(houseId: string): Promise<void>;
  onOpenHouseExtraMaterials(houseId: string): Promise<void>;
  onExportHouseRacPdf(houseId: string): Promise<void>;
  exportingRacPdfHouseId?: string | null;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
  onRequestHousePermanentDelete(houseId: string): void;
  readOnly?: boolean;
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
  const guidedTourHouseId = pageHouses.find((house) => house.status !== 'archived')?.id ?? null;

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
          <VisualSelect<HouseStatusFilter>
            label='Filtro'
            ariaLabel='Filtrar casas por status'
            value={statusFilter}
            options={HOUSE_STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className={LIST_SELECT_CLASS}
          />
          <VisualSelect<HouseSortKey>
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
        <table className='min-w-full table-fixed border-separate border-spacing-y-3'>
          <colgroup>
            <col className='w-[32%]'/>
            <col className='w-[13%]'/>
            <col className='w-[21%]'/>
            <col className='w-[14%]'/>
            <col className='w-[20%]'/>
          </colgroup>
          <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400'>
            <th scope='col' className='px-3 pb-1'>Casas</th>
            <th scope='col' className='px-3 pb-1 text-center'>Status</th>
            <th scope='col' className='px-3 pb-1 text-center'>Dificuldade</th>
            <th scope='col' className='px-3 pb-1 text-center align-middle leading-4'>
              Última Modificação
            </th>
            <th scope='col' className='w-[11.5rem] px-3 pb-1 text-center'>
              <span className='sr-only'>Ações</span>
            </th>
          </tr>
          </thead>
          <tbody>
          {pageHouses.map((house) => (
            <HouseTableRow
              key={house.id}
              constructionSite={constructionSite}
              house={house}
              active={activeHouse?.id === house.id}
              showGuidedTourTargets={house.id === guidedTourHouseId}
              onOpenHouse={onEditHouse}
              onOpenHouseExtraMaterials={onOpenHouseExtraMaterials}
              onExportHouseRacPdf={onExportHouseRacPdf}
              exportingRacPdfHouseId={exportingRacPdfHouseId}
              onRequestHouseStatusChange={onRequestHouseStatusChange}
              onRequestHousePermanentDelete={onRequestHousePermanentDelete}
              readOnly={readOnly}
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
            showGuidedTourTargets={house.id === guidedTourHouseId}
            onOpenHouse={onEditHouse}
            onOpenHouseExtraMaterials={onOpenHouseExtraMaterials}
            onExportHouseRacPdf={onExportHouseRacPdf}
            exportingRacPdfHouseId={exportingRacPdfHouseId}
            onRequestHouseStatusChange={onRequestHouseStatusChange}
            onRequestHousePermanentDelete={onRequestHousePermanentDelete}
            readOnly={readOnly}
          />
        ))}
      </div>

      <MobilePagination
        testId='house-mobile-pagination'
        text={formatPaginationText(firstIndex, lastIndex, filteredHouses.length, 'casas')}
        page={normalizedPage}
        pageCount={pageCount}
        entityLabel='casas'
        onPageChange={setPage}
      />

      {!filteredHouses.length ? (
        <EmptyState
          title={constructionSite.houses.length ? 'Nenhuma casa encontrada' : 'Nenhuma casa cadastrada'}
          description={constructionSite.houses.length ? 'Altere o filtro para ver outras casas.' : 'Adicione uma casa para configurar a família e o local.'}
        />
      ) : null}
    </section>
  );
}

export function HouseMobileCard({
  constructionSite,
  house,
  active,
  showGuidedTourTargets = false,
  onOpenHouse,
  onOpenHouseExtraMaterials,
  onExportHouseRacPdf,
  exportingRacPdfHouseId,
  onRequestHouseStatusChange,
  onRequestHousePermanentDelete,
  readOnly = false,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  active: boolean;
  showGuidedTourTargets?: boolean;
  onOpenHouse(houseId: string): Promise<void>;
  onOpenHouseExtraMaterials(houseId: string): Promise<void>;
  onExportHouseRacPdf(houseId: string): Promise<void>;
  exportingRacPdfHouseId?: string | null;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
  onRequestHousePermanentDelete(houseId: string): void;
  readOnly?: boolean;
}) {
  const family = getHouseFamily(constructionSite, house);
  const familyName = family?.name ?? getHouseFamilyName(constructionSite, house);
  const houseTypeLabel = formatHouseType(house.houseType);
  const statusLabel = HOUSE_STATUS_LABELS[house.status];
  const formattedDate = formatTimestampDate(house.updatedAt);
  const difficultyIndicator = getHouseDifficultyIndicator(house);
  const isExportingRacPdf = exportingRacPdfHouseId === house.id;
  const exportRacPdfLabel = isExportingRacPdf
    ? `Gerando PDF da RAC da casa ${familyName}`
    : `Exportar RAC PDF da casa ${familyName}`;
  const openHouse = () => {
    void onOpenHouse(house.id);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'archived' ? 'unarchive' : 'archive');
  };
  const requestPermanentDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHousePermanentDelete(house.id);
  };
  const requestBuiltStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'built' ? 'markDraft' : 'markBuilt');
  };
  const openExtraMaterials = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenHouseExtraMaterials(house.id);
  };
  const exportRacPdf = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isExportingRacPdf || house.status === 'archived' || readOnly) return;
    void onExportHouseRacPdf(house.id);
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
            <HouseStatusBadge
              status={house.status}
              guidedTourId={showGuidedTourTargets ? 'rac-house-status' : undefined}
            />
          </div>
        </div>
      </div>
      <div className='mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2'>
        <div className='grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3'>
          <div className='min-w-0 text-xs font-medium text-slate-600'>
            <span className='block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400'>
              Última Modificação
            </span>
            <time dateTime={house.updatedAt} className='mt-0.5 block'>{formattedDate.date}</time>
            <span className='block text-[11px] text-slate-400'>{formattedDate.time}</span>
          </div>
          <span
            data-guided-tour-id={showGuidedTourTargets ? 'rac-house-difficulty' : undefined}
            className='block min-w-0'
          >
            <HouseDifficultyGauge
              indicator={difficultyIndicator}
              testId='house-mobile-difficulty-gauge'
              meterClassName='h-2'
            />
          </span>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          {house.status !== 'archived' ? (
            <RoundIconActionButton
              label={`Abrir materiais extras da casa ${familyName}`}
              onClick={openExtraMaterials}
              guidedTourId={showGuidedTourTargets ? 'rac-house-extra-materials' : undefined}
            >
              <PackagePlus className='h-4 w-4'/>
            </RoundIconActionButton>
          ) : null}
          {house.status !== 'archived' ? (
            <RoundIconActionButton
              label={exportRacPdfLabel}
              onClick={exportRacPdf}
              disabled={readOnly || isExportingRacPdf}
            >
              <Download className='h-4 w-4'/>
            </RoundIconActionButton>
          ) : null}
          {house.status !== 'archived' ? (
            <StatusActionButton
              action={house.status === 'built' ? 'markDraft' : 'markBuilt'}
              label={house.status === 'built'
                ? `Voltar casa ${familyName} para rascunho`
                : `Marcar casa ${familyName} como construída`}
              onClick={requestBuiltStatusChange}
              guidedTourId={showGuidedTourTargets ? 'rac-house-built' : undefined}
              disabled={readOnly}
            />
          ) : null}
          <StatusActionButton
            action={house.status === 'archived' ? 'unarchive' : 'archive'}
            label={house.status === 'archived' ? `Desarquivar casa ${familyName}` : `Arquivar casa ${familyName}`}
            onClick={requestStatusChange}
            guidedTourId={showGuidedTourTargets ? 'rac-house-archive' : undefined}
            disabled={readOnly}
          />
          {house.status === 'archived' ? (
            <PermanentDeleteActionButton
              label={`Excluir definitivamente casa ${familyName}`}
              onClick={requestPermanentDelete}
              disabled={readOnly}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HouseTableRow({
  constructionSite,
  house,
  active,
  showGuidedTourTargets = false,
  onOpenHouse,
  onOpenHouseExtraMaterials,
  onExportHouseRacPdf,
  exportingRacPdfHouseId,
  onRequestHouseStatusChange,
  onRequestHousePermanentDelete,
  readOnly = false,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  active: boolean;
  showGuidedTourTargets?: boolean;
  onOpenHouse(houseId: string): Promise<void>;
  onOpenHouseExtraMaterials(houseId: string): Promise<void>;
  onExportHouseRacPdf(houseId: string): Promise<void>;
  exportingRacPdfHouseId?: string | null;
  onRequestHouseStatusChange(houseId: string, action: StatusChangeAction): void;
  onRequestHousePermanentDelete(houseId: string): void;
  readOnly?: boolean;
}) {
  const family = getHouseFamily(constructionSite, house);
  const familyName = family?.name ?? getHouseFamilyName(constructionSite, house);
  const houseTypeLabel = formatHouseType(house.houseType);
  const statusLabel = HOUSE_STATUS_LABELS[house.status];
  const formattedDate = formatTimestampDate(house.updatedAt);
  const difficultyIndicator = getHouseDifficultyIndicator(house);
  const isExportingRacPdf = exportingRacPdfHouseId === house.id;
  const exportRacPdfLabel = isExportingRacPdf
    ? `Gerando PDF da RAC da casa ${familyName}`
    : `Exportar RAC PDF da casa ${familyName}`;
  const openHouse = () => {
    void onOpenHouse(house.id);
  };
  const requestStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'archived' ? 'unarchive' : 'archive');
  };
  const requestPermanentDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHousePermanentDelete(house.id);
  };
  const requestBuiltStatusChange = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRequestHouseStatusChange(house.id, house.status === 'built' ? 'markDraft' : 'markBuilt');
  };
  const openExtraMaterials = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void onOpenHouseExtraMaterials(house.id);
  };
  const exportRacPdf = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isExportingRacPdf || house.status === 'archived' || readOnly) return;
    void onExportHouseRacPdf(house.id);
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
      <td className='max-w-0 rounded-l-lg px-3 py-3'>
        <div className='flex min-h-14 min-w-0 w-full items-center gap-3 rounded-lg text-left'>
          <HouseThumbnail familyName={familyName} photoDataUrl={family?.photoDataUrl}/>
          <span data-testid='house-table-identity' className='min-w-0 flex-1'>
            <span
              data-testid='house-table-family-name'
              title={familyName}
              className='block truncate font-semibold text-slate-950'
            >
              {familyName}
            </span>
            <span
              data-testid='house-table-type'
              title={houseTypeLabel}
              className='mt-0.5 block truncate text-xs font-medium text-slate-500'
            >
              {houseTypeLabel}
            </span>
          </span>
        </div>
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <HouseStatusBadge
          status={house.status}
          guidedTourId={showGuidedTourTargets ? 'rac-house-status' : undefined}
        />
      </td>
      <td className='px-3 py-3 text-center align-middle'>
        <span
          data-guided-tour-id={showGuidedTourTargets ? 'rac-house-difficulty' : undefined}
          className='mx-auto block max-w-[8rem]'
        >
          <HouseDifficultyGauge
            indicator={difficultyIndicator}
            testId='house-table-difficulty-gauge'
          />
        </span>
      </td>
      <td className='px-3 py-3 text-center align-middle text-xs font-medium text-slate-700'>
        <span data-testid='house-table-updated-at' className='block text-center'>
          <time dateTime={house.updatedAt} className='block'>{formattedDate.date}</time>
          <span className='mt-0.5 block text-[11px] text-slate-400'>{formattedDate.time}</span>
        </span>
      </td>
      <td className='w-[11.5rem] rounded-r-lg px-3 py-3 align-middle'>
        <div data-testid='house-table-actions' className='flex min-h-14 items-center justify-end gap-2'>
          {house.status !== 'archived' ? (
            <RoundIconActionButton
              label={`Abrir materiais extras da casa ${familyName}`}
              onClick={openExtraMaterials}
              guidedTourId={showGuidedTourTargets ? 'rac-house-extra-materials' : undefined}
            >
              <PackagePlus className='h-4 w-4'/>
            </RoundIconActionButton>
          ) : null}
          {house.status !== 'archived' ? (
            <RoundIconActionButton
              label={exportRacPdfLabel}
              onClick={exportRacPdf}
              disabled={readOnly || isExportingRacPdf}
            >
              <Download className='h-4 w-4'/>
            </RoundIconActionButton>
          ) : null}
          {house.status !== 'archived' ? (
            <StatusActionButton
              action={house.status === 'built' ? 'markDraft' : 'markBuilt'}
              label={house.status === 'built'
                ? `Voltar casa ${familyName} para rascunho`
                : `Marcar casa ${familyName} como construída`}
              onClick={requestBuiltStatusChange}
              guidedTourId={showGuidedTourTargets ? 'rac-house-built' : undefined}
              disabled={readOnly}
            />
          ) : null}
          <StatusActionButton
            action={house.status === 'archived' ? 'unarchive' : 'archive'}
            label={house.status === 'archived' ? `Desarquivar casa ${familyName}` : `Arquivar casa ${familyName}`}
            onClick={requestStatusChange}
            guidedTourId={showGuidedTourTargets ? 'rac-house-archive' : undefined}
            disabled={readOnly}
          />
          {house.status === 'archived' ? (
            <PermanentDeleteActionButton
              label={`Excluir definitivamente casa ${familyName}`}
              onClick={requestPermanentDelete}
              disabled={readOnly}
            />
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function MetricCard({label, value}: { label: string; value: number }) {
  return (
    <article className='rounded-2xl bg-slate-50 px-3 py-3 text-center sm:px-5 sm:py-4'>
      <p className='text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[11px] sm:tracking-[0.14em]'>{label}</p>
      <p className='mt-2 text-xl font-semibold text-slate-950 sm:text-2xl'>{value}</p>
    </article>
  );
}

export function HouseThumbnail({
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

export function HouseStatusBadge({
  status,
  guidedTourId,
}: {
  status: PersistedHouseStatus;
  guidedTourId?: string;
}) {
  return (
    <span
      data-guided-tour-id={guidedTourId}
      className={cn(
        'inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ring-1',
        HOUSE_STATUS_BADGE_CLASS_NAMES[status],
      )}
    >
      {HOUSE_STATUS_LABELS[status]}
    </span>
  );
}
