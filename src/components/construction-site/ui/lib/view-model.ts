import type {CreateHouseInput, CreateMonitorInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  HouseConfigurationFormValues,
  MonitorFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
  FamilyRecord,
  HouseSize,
  MonitorRecord,
  PersistedHouseRecord,
  SoilProfile,
  TerrainComplexity,
} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {
  CONSTRUCTION_SITE_STATUS_LABELS,
  HOUSE_STATUS_LABELS,
  MONITOR_STATUS_LABELS,
} from './constants.ts';
import type {
  ConstructionSiteManagementScreen,
  ConstructionSortKey,
  HouseSortKey,
  MonitorSortKey,
} from './types.ts';

export function getScreenTitle(screen: ConstructionSiteManagementScreen, constructionLabel: string): string {
  if (screen === 'construction-list') return 'Construções TETO';
  if (screen === 'construction-create') return 'Adicionar Construção TETO';
  if (screen === 'construction-detail') return 'Editar Construção TETO';
  if (screen === 'monitors') return `Monitores - ${constructionLabel}`;
  if (screen === 'monitor-create') return 'Cadastrar Monitor';
  if (screen === 'monitor-detail') return 'Editar Monitor';
  if (screen === 'houses') return 'Casas da Construção';
  if (screen === 'house-create' || screen === 'house-detail') return 'Configuração da Casa';
  return constructionLabel;
}

export function getScreenSubtitle(screen: ConstructionSiteManagementScreen): string {
  if (screen === 'construction-list') return 'Criar, arquivar, listar e trocar construções.';
  if (screen === 'construction-create') return 'Cadastrar código da CC, data e comunidade associada.';
  if (screen === 'construction-detail') return 'Atualizar os dados da construção selecionada.';
  if (screen === 'monitors') return 'Monitores vinculados à construção ativa.';
  if (screen === 'monitor-create') return 'Cadastrar dados de contato do monitor.';
  if (screen === 'monitor-detail') return 'Atualizar dados do monitor sem duplicar o registro.';
  if (screen === 'houses') return 'Casas vinculadas à construção ativa.';
  return 'Família, restrições e características do local da casa.';
}

export function getSelectedConstructionFields(constructionSite: ConstructionSiteState | null, summary: ConstructionSiteSummary | null) {
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

export function compareConstructionSummaries(a: ConstructionSiteSummary, b: ConstructionSiteSummary, sortKey: ConstructionSortKey): number {
  if (sortKey === 'constructionDate') return compareOptionalDateDesc(a.constructionDate, b.constructionDate, a.updatedAt, b.updatedAt);
  if (sortKey === 'externalCode') return getConstructionCode(a).localeCompare(getConstructionCode(b), 'pt-BR');
  return CONSTRUCTION_SITE_STATUS_LABELS[a.status].localeCompare(CONSTRUCTION_SITE_STATUS_LABELS[b.status], 'pt-BR');
}

export function compareOptionalDateDesc(
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

export function formatPaginationText(
  firstIndex: number,
  lastIndex: number,
  total: number,
  entityLabel = 'construções',
): string {
  if (!total) return `Mostrando 0-0 de 0 ${entityLabel}`;
  return `Mostrando ${firstIndex + 1}-${lastIndex} de ${total} ${entityLabel}`;
}

export function formatTimestampDate(value: string): { date: string; time: string } {
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

export function formatDateOnly(value?: string): string {
  const parsed = parseDateOnlyParts(value);
  if (!parsed) return 'Sem data';
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${parsed.year}`;
}

export function parseDateOnly(value?: string): Date | undefined {
  const parsed = parseDateOnlyParts(value);
  if (!parsed) return undefined;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

export function parseDateOnlyParts(value?: string): { year: number; month: number; day: number } | null {
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

export function toDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function buildGoogleMapsEmbedUrl(
  coordinates: { latitude: number; longitude: number },
  apiKey: string,
): string {
  const query = encodeURIComponent(`${coordinates.latitude},${coordinates.longitude}`);
  const key = encodeURIComponent(apiKey);
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}&zoom=17`;
}

export function getConstructionCode(summary: ConstructionSiteSummary): string {
  return summary.externalCode?.trim() || 'Construção sem código';
}

export function getConstructionInitials(label: string): string {
  const alphanumeric = label.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (alphanumeric.length >= 2) return alphanumeric.slice(0, 2);
  return alphanumeric || 'CT';
}

export function getAvatarPalette(label: string): { background: string; foreground: string } {
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

export interface HouseConfigurationFormState {
  familyName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  familyPhotoDataUrl: string;
  houseSize: HouseSize | '';
  leaders: string;
  notes: string;
  soilProfile: SoilProfile | '';
  hasUndergroundObstacles: boolean;
  hasElevatedObstacles: boolean;
  hasNeighborSetbacks: boolean;
  locationQuery: string;
  terrainComplexity: TerrainComplexity;
}

export function getHouseConfigurationInitialState(
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
    houseSize: house?.houseSize ?? '',
    leaders: house?.leaders ?? '',
    notes: house?.notes ?? family?.notes ?? '',
    soilProfile: assessment?.soilProfile ?? '',
    hasUndergroundObstacles: assessment?.hasUndergroundObstacles ?? false,
    hasElevatedObstacles: assessment?.hasElevatedObstacles ?? false,
    hasNeighborSetbacks: assessment?.hasNeighborSetbacks ?? false,
    locationQuery: assessment?.locationQuery ?? '',
    terrainComplexity: assessment?.terrainComplexity ?? 'flat',
  };
}

export function toHouseConfigurationInput(form: HouseConfigurationFormValues): CreateHouseInput {
  return {
    familyName: form.familyName?.trim() || 'Família sem nome',
    primaryContactName: form.primaryContactName?.trim() || undefined,
    primaryContactPhone: form.primaryContactPhone?.trim() || undefined,
    primaryContactEmail: form.primaryContactEmail?.trim() || undefined,
    familyPhotoDataUrl: form.familyPhotoDataUrl || undefined,
    houseSize: form.houseSize || undefined,
    leaders: form.leaders?.trim() || undefined,
    notes: form.notes ?? '',
    siteAssessment: {
      soilProfile: form.soilProfile || undefined,
      hasUndergroundObstacles: form.hasUndergroundObstacles ?? false,
      hasElevatedObstacles: form.hasElevatedObstacles ?? false,
      hasNeighborSetbacks: form.hasNeighborSetbacks ?? false,
      locationQuery: form.locationQuery?.trim() || undefined,
      terrainComplexity: form.terrainComplexity ?? 'flat',
    },
  };
}

export interface MonitorFormState {
  name: string;
  phone: string;
  email: string;
  photoDataUrl: string;
}

export function getMonitorInitialState(monitor: MonitorRecord | null): MonitorFormState {
  return {
    name: monitor?.name ?? '',
    phone: monitor?.phone ?? '',
    email: monitor?.email ?? '',
    photoDataUrl: monitor?.photoDataUrl ?? '',
  };
}

export function toMonitorInput(form: MonitorFormValues): CreateMonitorInput {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || undefined,
    photoDataUrl: form.photoDataUrl || undefined,
  };
}

export function compareMonitors(a: MonitorRecord, b: MonitorRecord, sortKey: MonitorSortKey): number {
  if (sortKey === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
  if (sortKey === 'status') return MONITOR_STATUS_LABELS[a.status].localeCompare(MONITOR_STATUS_LABELS[b.status], 'pt-BR');
  return a.name.localeCompare(b.name, 'pt-BR');
}

export function getMonitorInitials(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'MO';
}

export function compareHouses(
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

export function formatHouseType(type: HouseType): string {
  if (type === 'tipo6') return 'Tipo 6';
  if (type === 'tipo3') return 'Tipo 3';
  return 'Sem tipo';
}

export function getHouseInitials(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'CA';
}

export function getActiveHouse(constructionSite: ConstructionSiteState): PersistedHouseRecord | null {
  return constructionSite.houses.find((house) => house.id === constructionSite.constructionSite.activeHouseId)
    ?? constructionSite.houses.find((house) => house.status !== 'archived')
    ?? null;
}

export function getHouseFamily(constructionSite: ConstructionSiteState, house: PersistedHouseRecord): FamilyRecord | null {
  return constructionSite.families.find((family) => family.id === house.familyId) ?? null;
}

export function getHouseFamilyName(constructionSite: ConstructionSiteState, house: PersistedHouseRecord): string {
  return getHouseFamily(constructionSite, house)?.name ?? 'Família sem nome';
}
