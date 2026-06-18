import type {
  ConstructionSiteStatus,
  HouseSize,
  MonitorStatus,
  PersistedHouseStatus,
} from '@/shared/types/construction-site.ts';
import type {
  ConstructionSortKey,
  ConstructionStatusFilter,
  HouseSortKey,
  HouseStatusFilter,
  MonitorSortKey,
  MonitorStatusFilter,
  VisualSelectOption,
} from './types.ts';

export const CONSTRUCTIONS_PER_PAGE = 10;
export const HOUSES_PER_PAGE = 10;
export const MONITORS_PER_PAGE = 10;
export const HEADER_ACTION_BUTTON_CLASS = 'w-full whitespace-nowrap sm:w-48 sm:shrink-0';
export const FORM_ACTION_BUTTON_CLASS = 'w-full whitespace-nowrap sm:w-48';
export const LIST_CONTROLS_CLASS = 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap';
export const LIST_SELECT_CLASS = 'w-full min-w-0 sm:w-[11.25rem] sm:shrink-0';

export const CONSTRUCTION_SITE_STATUS_LABELS: Record<ConstructionSiteStatus, string> = {
  in_progress: 'Em andamento',
  completed: 'Concluída',
  archived: 'Arquivada',
};

export const STATUS_BADGE_CLASS_NAMES: Record<ConstructionSiteStatus, string> = {
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const HOUSE_STATUS_LABELS: Record<PersistedHouseStatus, string> = {
  draft: 'Rascunho',
  rac_printed: 'RAC Impressa',
  built: 'Construída',
  archived: 'Arquivada',
};

export const HOUSE_STATUS_BADGE_CLASS_NAMES: Record<PersistedHouseStatus, string> = {
  draft: 'bg-blue-50 text-blue-700 ring-blue-100',
  rac_printed: 'bg-violet-50 text-violet-700 ring-violet-100',
  built: 'bg-slate-900 text-white ring-slate-900',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const MONITOR_STATUS_LABELS: Record<MonitorStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const MONITOR_STATUS_BADGE_CLASS_NAMES: Record<MonitorStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const CONSTRUCTION_STATUS_FILTER_OPTIONS: VisualSelectOption<ConstructionStatusFilter>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'archived', label: 'Arquivada'},
  {value: 'in_progress', label: 'Em andamento'},
  {value: 'completed', label: 'Concluída'},
];

export const CONSTRUCTION_SORT_OPTIONS: VisualSelectOption<ConstructionSortKey>[] = [
  {value: 'constructionDate', label: 'Data da Construção'},
  {value: 'externalCode', label: 'Código da CC'},
  {value: 'status', label: 'Status'},
];

export const HOUSE_STATUS_FILTER_OPTIONS: VisualSelectOption<HouseStatusFilter>[] = [
  {value: 'all', label: 'Todos'},
  {value: 'archived', label: 'Arquivada'},
  {value: 'draft', label: 'Rascunho'},
  {value: 'rac_printed', label: 'RAC Impressa'},
  {value: 'built', label: 'Construída'},
];

export const HOUSE_SORT_OPTIONS: VisualSelectOption<HouseSortKey>[] = [
  {value: 'updatedAt', label: 'Última modificação'},
  {value: 'familyName', label: 'Família'},
  {value: 'status', label: 'Status'},
  {value: 'houseType', label: 'Tipo da casa'},
];

export const HOUSE_SIZE_LABELS: Record<HouseSize, string> = {
  large: 'Grande',
  small: 'Pequena',
};

export const HOUSE_SIZE_OPTIONS: VisualSelectOption<HouseSize | ''>[] = [
  {value: '', label: '', triggerLabel: '', ariaLabel: 'Sem seleção'},
  {value: 'large', label: HOUSE_SIZE_LABELS.large},
  {value: 'small', label: HOUSE_SIZE_LABELS.small},
];

export const MONITOR_STATUS_FILTER_OPTIONS: VisualSelectOption<MonitorStatusFilter>[] = [
  {value: 'active', label: 'Ativos'},
  {value: 'inactive', label: 'Inativos'},
  {value: 'all', label: 'Todos'},
];

export const MONITOR_SORT_OPTIONS: VisualSelectOption<MonitorSortKey>[] = [
  {value: 'name', label: 'Nome'},
  {value: 'updatedAt', label: 'Última modificação'},
  {value: 'status', label: 'Status'},
];
