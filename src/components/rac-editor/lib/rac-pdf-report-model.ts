import type {
  ConstructionSiteState,
  HouseExtraMaterials,
  HouseSize,
  MonitorRecord,
  PersistedHouseRecord,
  SiteAssessment,
  SoilProfile,
} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import type {HousePiloti, HouseState, HouseType} from '@/shared/types/house.ts';
import {formatNivel, formatPilotiHeight, getAllPilotiIds, getPilotiName} from '@/shared/types/piloti.ts';
import {calculateTotalVolumes} from '@/components/rac-editor/lib/terrain-volume.ts';
import {
  calculateTerrainDesnivelCm,
  calculateHouseDifficultyIndicator,
  type HouseDifficultyIndicator,
  type HouseDifficultyLevel,
} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';

export interface RacPdfReportField {
  label: string;
  value: string;
}

export interface RacPdfReportOptionGroup {
  label: string;
  options: string[];
  selected: string[];
}

export interface RacPdfReportPilotiCell {
  code: string;
  heightLabel: string;
  nivelLabel: string;
  isMaster: boolean;
}

export interface RacPdfReportPilotiTotal {
  heightLabel: string;
  count: number;
}

export interface RacPdfReportMonitor {
  name: string;
  phone: string;
  email?: string;
}

export interface RacPdfReportExtraMaterials {
  fields: RacPdfReportField[];
  justification: string;
}

export interface RacPdfReportTerrainVolumes {
  rachaoM3: number;
  britaM3: number;
  pedrasM3: number;
}

export type RacPdfTerrainRiskLevel = HouseDifficultyLevel;
export type RacPdfTerrainRiskIndicator = HouseDifficultyIndicator;

export interface RacPdfReportModel {
  title: string;
  fileName: string;
  canvasImageDataUrl: string;
  canvasImageAspectRatio: number;
  house3DImageDataUrl: string | null;
  house3DImageAspectRatio: number;
  familyName: string;
  leaders: string;
  communityName: string;
  constructionCode: string;
  constructionCodeDisplay: string;
  generatedAtLabel: string;
  headerFields: RacPdfReportField[];
  house: {
    sizeOptions: string[];
    selectedSize: string | null;
    typeOptions: string[];
    selectedType: string | null;
  };
  extraMaterials: RacPdfReportExtraMaterials;
  terrain: {
    desnivelCm: number | null;
    volumes: RacPdfReportTerrainVolumes | null;
    riskIndicator: RacPdfTerrainRiskIndicator;
    optionGroups: RacPdfReportOptionGroup[];
  };
  pilotis: {
    grid: RacPdfReportPilotiCell[][];
    totals: RacPdfReportPilotiTotal[];
    master: RacPdfReportPilotiCell | null;
  };
  monitors: RacPdfReportMonitor[];
  notes: string;
}

interface BuildRacPdfReportModelArgs {
  constructionSite: ConstructionSiteState;
  canvasImageDataUrl: string;
  canvasImageAspectRatio?: number;
  house3DImageDataUrl?: string | null;
  house3DImageAspectRatio?: number;
  generatedAt?: Date;
}

const NOT_INFORMED = 'Não informado';

const HOUSE_SIZE_LABELS: Record<HouseSize, string> = {
  large: 'Grande',
  small: 'Pequena',
};

const HOUSE_TYPE_LABELS: Record<Exclude<HouseType, null>, string> = {
  tipo6: 'Tipo 6',
  tipo3: 'Tipo 3',
};

const SOIL_PROFILE_LABELS: Record<SoilProfile, string> = {
  stable: 'Firme',
  loose_clay: 'Argila / solto',
  water_table: 'Água no fundo',
};

export function buildRacPdfReportModel({
  constructionSite,
  canvasImageDataUrl,
  canvasImageAspectRatio = 1,
  house3DImageDataUrl = null,
  house3DImageAspectRatio = canvasImageAspectRatio,
  generatedAt = new Date(),
}: BuildRacPdfReportModelArgs): RacPdfReportModel | null {
  const activeHouse = getActiveReportHouse(constructionSite);
  if (!activeHouse) return null;

  const family = constructionSite.families.find((entry) => entry.id === activeHouse.familyId) ?? null;
  const familyName = normalizeDisplayValue(family?.name, 'Família sem nome');
  const communityName = normalizeDisplayValue(getConstructionSiteCommunityName(constructionSite));
  const constructionCode = normalizeDisplayValue(constructionSite.constructionSite.externalCode);
  const constructionCodeDisplay = formatConstructionCodeDisplay(constructionCode);
  const houseState = activeHouse.drawingDocument.house;
  const pilotis = houseState?.pilotis ?? {};
  const pilotiGrid = buildPilotiGrid(pilotis);
  const pilotiTotals = buildPilotiTotals(pilotis, activeHouse.designSettings.selectedPilotiHeights);
  const master = pilotiGrid.flat().find((piloti) => piloti.isMaster) ?? null;
  const leaders = normalizeDisplayValue(activeHouse.leaders, '');
  const generatedAtLabel = formatDateLabel(generatedAt);

  return {
    title: 'RAC - Relatório de Acompanhamento Construtivo',
    fileName: buildReportFileName(constructionCode, familyName),
    canvasImageDataUrl,
    canvasImageAspectRatio: normalizeAspectRatio(canvasImageAspectRatio),
    house3DImageDataUrl,
    house3DImageAspectRatio: normalizeAspectRatio(house3DImageAspectRatio),
    familyName,
    leaders,
    communityName,
    constructionCode,
    constructionCodeDisplay,
    generatedAtLabel,
    headerFields: [
      {label: 'Comunidade', value: communityName},
      {label: 'Construção', value: constructionCode},
      {label: 'Data de geração', value: generatedAtLabel},
    ],
    house: {
      sizeOptions: ['Pequena', 'Grande'],
      selectedSize: activeHouse.houseSize ? HOUSE_SIZE_LABELS[activeHouse.houseSize] : null,
      typeOptions: ['Tipo 3', 'Tipo 6'],
      selectedType: activeHouse.houseType ? HOUSE_TYPE_LABELS[activeHouse.houseType] : null,
    },
    terrain: {
      desnivelCm: calculateDesnivelCm(houseState),
      volumes: houseState ? calculateTotalVolumes(houseState.terrainType, pilotis) : null,
      riskIndicator: calculateTerrainRiskIndicator(activeHouse.siteAssessment, pilotis),
      optionGroups: buildTerrainOptionGroups(activeHouse.siteAssessment),
    },
    extraMaterials: buildExtraMaterials(activeHouse.extraMaterials),
    pilotis: {
      grid: pilotiGrid,
      totals: pilotiTotals,
      master,
    },
    monitors: constructionSite.monitors
      .filter((monitor) => monitor.status === 'active')
      .map(toReportMonitor),
    notes: normalizeDisplayValue(activeHouse.notes, ''),
  };
}

export function calculateDesnivelCm(house: HouseState | null | undefined): number | null {
  return calculateTerrainDesnivelCm(house?.pilotis);
}

export function calculateTerrainRiskIndicator(
  assessment: SiteAssessment,
  pilotis?: Record<string, HousePiloti>,
): RacPdfTerrainRiskIndicator {
  return calculateHouseDifficultyIndicator(assessment, pilotis);
}

function getActiveReportHouse(constructionSite: ConstructionSiteState): PersistedHouseRecord | null {
  const activeHouseId = constructionSite.constructionSite.activeHouseId;
  return constructionSite.houses.find((house) => house.id === activeHouseId && house.status !== 'archived')
    ?? constructionSite.houses.find((house) => house.status !== 'archived')
    ?? null;
}

function buildPilotiGrid(pilotis: Record<string, HousePiloti>): RacPdfReportPilotiCell[][] {
  const cells = getAllPilotiIds().map((pilotiId) => {
    const piloti = pilotis[pilotiId];
    return {
      code: getPilotiName(pilotiId),
      heightLabel: piloti ? `${formatPilotiHeight(piloti.height)} m` : NOT_INFORMED,
      nivelLabel: piloti ? `${formatNivel(piloti.nivel)} m` : NOT_INFORMED,
      isMaster: piloti?.isMaster ?? false,
    };
  });

  return [
    cells.slice(0, 4),
    cells.slice(4, 8),
    cells.slice(8, 12),
  ];
}

function buildPilotiTotals(
  pilotis: Record<string, HousePiloti>,
  selectedHeights: number[],
): RacPdfReportPilotiTotal[] {
  const heights = [
    ...selectedHeights,
    ...Object.values(pilotis).map((piloti) => piloti.height),
  ]
    .filter((height) => Number.isFinite(height))
    .map((height) => Math.round(height * 10) / 10);

  const uniqueHeights = [...new Set(heights)].sort((a, b) => a - b);

  return uniqueHeights.map((height) => ({
    heightLabel: `${formatPilotiHeight(height)} m`,
    count: Object.values(pilotis).filter((piloti) => (
      Math.round(piloti.height * 10) / 10 === height
    )).length,
  }));
}

function buildExtraMaterials(extraMaterials: HouseExtraMaterials | undefined): RacPdfReportExtraMaterials {
  return {
    fields: [
      {label: 'Vigas de Piso', value: formatMaterialCount(extraMaterials?.floorBeams)},
      {label: 'Caibros', value: formatMaterialCount(extraMaterials?.rafters)},
      {label: 'Vigas Secundárias', value: formatMaterialCount(extraMaterials?.secondaryBeams)},
      {label: 'Calhas', value: formatMaterialCount(extraMaterials?.gutters)},
    ],
    justification: normalizeDisplayValue(extraMaterials?.justification, 'Nenhuma observação adicional.'),
  };
}

function buildTerrainOptionGroups(assessment: SiteAssessment): RacPdfReportOptionGroup[] {
  return [
    {
      label: 'Solo',
      options: Object.values(SOIL_PROFILE_LABELS),
      selected: assessment.soilProfile ? [SOIL_PROFILE_LABELS[assessment.soilProfile]] : [],
    },
    {
      label: 'Obstáculos',
      options: ['Subterrâneos', 'Elevados', 'Recuos vizinhos'],
      selected: [
        assessment.hasUndergroundObstacles ? 'Subterrâneos' : null,
        assessment.hasElevatedObstacles ? 'Elevados' : null,
        assessment.hasNeighborSetbacks ? 'Recuos vizinhos' : null,
      ].filter((option): option is string => option !== null),
    },
  ];
}

function toReportMonitor(monitor: MonitorRecord): RacPdfReportMonitor {
  return {
    name: normalizeDisplayValue(monitor.name, 'Monitor sem nome'),
    phone: normalizeDisplayValue(monitor.phone),
    email: monitor.email,
  };
}

function normalizeDisplayValue(value: unknown, fallback = NOT_INFORMED): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function formatMaterialCount(value: number | undefined): string {
  return Number.isInteger(value) && value >= 0 ? String(value) : '0';
}

function formatDateLabel(date: Date): string {
  if (Number.isNaN(date.getTime())) return NOT_INFORMED;
  const parts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')}`;
}

function formatConstructionCodeDisplay(constructionCode: string): string {
  const match = /^CC(\d{4})$/i.exec(constructionCode.trim());
  return match?.[1] ?? constructionCode;
}

function buildReportFileName(constructionCode: string, familyName: string): string {
  return `RAC-${toFileSlug(constructionCode)}-${toFileSlug(familyName)}.pdf`;
}

function normalizeAspectRatio(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function toFileSlug(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return slug || 'TETO';
}
