import type {
  ConstructionSiteState,
  HouseExtraMaterials,
  HouseSize,
  MonitorRecord,
  PersistedHouseRecord,
  SiteAssessment,
  SoilProfile,
  TerrainComplexity,
} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {ALL_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import type {HousePiloti, HouseState, HouseType} from '@/shared/types/house.ts';
import {formatNivel, formatPilotiHeight, getAllPilotiIds, getPilotiName} from '@/shared/types/piloti.ts';

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

export type RacPdfTerrainRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RacPdfTerrainRiskIndicator {
  score: number;
  label: string;
  level: RacPdfTerrainRiskLevel;
}

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
  complexityLabel: string;
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

const TERRAIN_COMPLEXITY_LABELS: Record<TerrainComplexity, string> = {
  flat: 'Plano',
  moderate: 'Moderado',
  steep: 'Íngreme',
  very_steep: 'Muito íngreme',
  extreme: 'Extremo',
};

const SOIL_RISK_SCORE: Record<SoilProfile, number> = {
  stable: 1,
  loose_clay: 3,
  water_table: 4,
};

const TERRAIN_COMPLEXITY_RISK_SCORE: Record<TerrainComplexity, number> = {
  flat: 1,
  moderate: 2,
  steep: 3,
  very_steep: 4,
  extreme: 5,
};

const UNKNOWN_SOIL_RISK_SCORE = 2;
const UNDERGROUND_OBSTACLE_RISK_INCREMENT = 1.25;
const ELEVATED_OBSTACLE_RISK_INCREMENT = 0.25;
const NEIGHBOR_SETBACK_RISK_INCREMENT = 0.75;
const MIN_MATRIX_RISK = 1;
const MAX_MATRIX_RISK = 25;
const MIN_PILOTI_AVERAGE_HEIGHT = Math.min(...ALL_PILOTI_HEIGHTS);
const MAX_PILOTI_AVERAGE_HEIGHT = Math.max(...ALL_PILOTI_HEIGHTS);
const MIN_PILOTI_HEIGHT_RISK_MULTIPLIER = 1;
const MAX_PILOTI_HEIGHT_RISK_MULTIPLIER = 2;

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
  const complexityLabel = TERRAIN_COMPLEXITY_LABELS[activeHouse.siteAssessment.terrainComplexity];
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
    complexityLabel,
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
  const niveis = Object.values(house?.pilotis ?? {})
    .map((piloti) => piloti.nivel)
    .filter((nivel): nivel is number => Number.isFinite(nivel));

  if (niveis.length === 0) return null;
  return Math.round((Math.max(...niveis) - Math.min(...niveis)) * 100);
}

export function calculateTerrainRiskIndicator(
  assessment: SiteAssessment,
  pilotis?: Record<string, HousePiloti>,
): RacPdfTerrainRiskIndicator {
  const obstaclePressure = calculateTerrainObstaclePressure(assessment);
  const probability = clampRiskFactor(
    TERRAIN_COMPLEXITY_RISK_SCORE[assessment.terrainComplexity] + obstaclePressure,
  );
  const severity = clampRiskFactor(getSoilRiskScore(assessment.soilProfile) + obstaclePressure);
  const rawRisk = probability * severity * calculatePilotiHeightRiskMultiplier(pilotis);
  const score = Math.round(((rawRisk - MIN_MATRIX_RISK) / (MAX_MATRIX_RISK - MIN_MATRIX_RISK)) * 100);
  const boundedScore = Math.min(100, Math.max(0, score));

  return {
    score: boundedScore,
    ...getTerrainRiskLevel(boundedScore),
  };
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
    {
      label: 'Complexidade',
      options: Object.values(TERRAIN_COMPLEXITY_LABELS),
      selected: [TERRAIN_COMPLEXITY_LABELS[assessment.terrainComplexity]],
    },
  ];
}

function calculateTerrainObstaclePressure(assessment: SiteAssessment): number {
  return [
    assessment.hasUndergroundObstacles ? UNDERGROUND_OBSTACLE_RISK_INCREMENT : 0,
    assessment.hasElevatedObstacles ? ELEVATED_OBSTACLE_RISK_INCREMENT : 0,
    assessment.hasNeighborSetbacks ? NEIGHBOR_SETBACK_RISK_INCREMENT : 0,
  ].reduce((total, value) => total + value, 0);
}

function getSoilRiskScore(soilProfile: SoilProfile | undefined): number {
  return soilProfile ? SOIL_RISK_SCORE[soilProfile] : UNKNOWN_SOIL_RISK_SCORE;
}

function calculatePilotiHeightRiskMultiplier(pilotis: Record<string, HousePiloti> | undefined): number {
  const averageHeight = calculateAveragePilotiHeight(pilotis);
  const normalizedHeightPressure = (
    (averageHeight - MIN_PILOTI_AVERAGE_HEIGHT)
    / (MAX_PILOTI_AVERAGE_HEIGHT - MIN_PILOTI_AVERAGE_HEIGHT)
  );

  return MIN_PILOTI_HEIGHT_RISK_MULTIPLIER
    + normalizedHeightPressure * (MAX_PILOTI_HEIGHT_RISK_MULTIPLIER - MIN_PILOTI_HEIGHT_RISK_MULTIPLIER);
}

function calculateAveragePilotiHeight(pilotis: Record<string, HousePiloti> | undefined): number {
  const heights = Object.values(pilotis ?? {})
    .map((piloti) => piloti.height)
    .filter((height): height is number => Number.isFinite(height));

  if (heights.length === 0) return MIN_PILOTI_AVERAGE_HEIGHT;

  const average = heights.reduce((sum, height) => sum + height, 0) / heights.length;
  return Math.min(MAX_PILOTI_AVERAGE_HEIGHT, Math.max(MIN_PILOTI_AVERAGE_HEIGHT, average));
}

function clampRiskFactor(value: number): number {
  return Math.min(5, Math.max(1, value));
}

function getTerrainRiskLevel(score: number): Pick<RacPdfTerrainRiskIndicator, 'label' | 'level'> {
  if (score < 25) return {label: 'Baixa', level: 'low'};
  if (score < 50) return {label: 'Média', level: 'medium'};
  if (score < 75) return {label: 'Alta', level: 'high'};
  return {label: 'Crítica', level: 'critical'};
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

function formatCentimeters(value: number): number {
  return Math.round(value * 100);
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
