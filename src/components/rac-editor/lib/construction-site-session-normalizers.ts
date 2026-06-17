import {
  hasValidOptionalEmail,
  hasValidRequiredPhone,
} from '@/shared/lib/contact-validation.ts';
import {isSupportedPhotoDataUrl} from '@/shared/lib/photo-data-url.ts';
import {
  EMPTY_SITE_ASSESSMENT,
  type ConstructionSiteStatus,
  type CommunityRecord,
  type HouseExtraMaterials,
  type HouseSize,
  type MonitorStatus,
  type PersistedHouseRecord,
  type PersistedHouseStatus,
  type SiteAssessment,
  type SoilProfile,
  type TerrainComplexity,
} from '@/shared/types/construction-site.ts';
import type {HouseType} from '@/shared/types/house.ts';

const HOUSE_EXTRA_MATERIAL_MAX_COUNT = 9999;

export function cloneConstructionSiteValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function sanitizeSiteAssessment(input: Partial<SiteAssessment>): SiteAssessment {
  const assessment: SiteAssessment = {
    terrainComplexity: isTerrainComplexity(input.terrainComplexity)
      ? input.terrainComplexity
      : EMPTY_SITE_ASSESSMENT.terrainComplexity,
  };

  if (isSoilProfile(input.soilProfile)) {
    assessment.soilProfile = input.soilProfile;
  }
  if (typeof input.hasUndergroundObstacles === 'boolean') {
    assessment.hasUndergroundObstacles = input.hasUndergroundObstacles;
  }
  if (typeof input.hasElevatedObstacles === 'boolean') {
    assessment.hasElevatedObstacles = input.hasElevatedObstacles;
  }
  if (typeof input.hasNeighborSetbacks === 'boolean') {
    assessment.hasNeighborSetbacks = input.hasNeighborSetbacks;
  }
  if (typeof input.locationQuery === 'string' && input.locationQuery.trim()) {
    assessment.locationQuery = input.locationQuery.trim();
  }

  return assessment;
}

export function sanitizeHouseExtraMaterials(input: Partial<HouseExtraMaterials> | undefined): HouseExtraMaterials | undefined {
  if (!input) return undefined;

  const extraMaterials: HouseExtraMaterials = {};
  const floorBeams = normalizeOptionalNonNegativeInteger(input.floorBeams);
  const rafters = normalizeOptionalNonNegativeInteger(input.rafters);
  const secondaryBeams = normalizeOptionalNonNegativeInteger(input.secondaryBeams);
  const gutters = normalizeOptionalNonNegativeInteger(input.gutters);
  const justification = normalizeOptionalText(input.justification);

  if (floorBeams !== undefined) extraMaterials.floorBeams = floorBeams;
  if (rafters !== undefined) extraMaterials.rafters = rafters;
  if (secondaryBeams !== undefined) extraMaterials.secondaryBeams = secondaryBeams;
  if (gutters !== undefined) extraMaterials.gutters = gutters;
  if (justification !== undefined) extraMaterials.justification = justification;

  return Object.keys(extraMaterials).length > 0 ? extraMaterials : undefined;
}

export function normalizeNumberArray(value: number[] | undefined): number[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.filter((entry) => Number.isFinite(entry));
  return normalized.length ? normalized : null;
}

export function normalizePilotiLayout(layout: PersistedHouseRecord['pilotiLayout']): PersistedHouseRecord['pilotiLayout'] {
  return {
    masterCode: layout?.masterCode,
    points: Array.isArray(layout?.points) ? cloneConstructionSiteValue(layout.points) : [],
    summary: layout?.summary ? cloneConstructionSiteValue(layout.summary) : undefined,
  };
}

export function isConstructionSiteStatus(value: ConstructionSiteStatus): value is ConstructionSiteStatus {
  return ['in_progress', 'completed', 'archived'].includes(value);
}

export function isMonitorStatus(value: unknown): value is MonitorStatus {
  return value === 'active' || value === 'inactive';
}

export function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeHouseSize(value: unknown): HouseSize | undefined {
  if (value === 'large' || value === 'small') return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'grande') return 'large';
  if (normalized === 'pequena') return 'small';
  return undefined;
}

export function requireMonitorName(value: unknown): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) throw new Error('Nome do monitor é obrigatório.');
  return normalized;
}

export function requireMonitorPhone(value: unknown): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) throw new Error('Telefone do monitor é obrigatório.');
  if (!hasValidRequiredPhone(normalized)) throw new Error('Telefone do monitor deve ter 11 dígitos com DDD.');
  return normalized;
}

export function normalizeMonitorEmail(value: unknown): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return undefined;
  if (!hasValidOptionalEmail(normalized)) throw new Error('E-mail do monitor inválido.');
  return normalized;
}

export function normalizeMonitorPhotoDataUrl(value: unknown): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return undefined;
  if (!isSupportedPhotoDataUrl(normalized)) throw new Error('Foto do monitor inválida.');
  return normalized;
}

export function normalizePersistedMonitorPhone(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized && hasValidRequiredPhone(normalized) ? normalized : null;
}

export function normalizePersistedMonitorEmail(value: unknown): string | undefined {
  const normalized = normalizeOptionalText(value);
  return normalized && hasValidOptionalEmail(normalized) ? normalized : undefined;
}

export function normalizeConstructionCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  if (!/^CC\d{4}$/.test(normalized)) return undefined;
  return normalized;
}

export function requireConstructionCode(value: unknown): string {
  const normalized = normalizeConstructionCode(value);
  if (!normalized) throw new Error('Código da CC deve seguir o formato CC0000.');
  return normalized;
}

export function normalizeConstructionDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return undefined;
  }
  return trimmed;
}

export function requireConstructionDate(value: unknown): string {
  const normalized = normalizeConstructionDate(value);
  if (!normalized) throw new Error('Data da Construção é obrigatória.');
  return normalized;
}

export function normalizeDateOnlyFromIso(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return normalizeConstructionDate(value.slice(0, 10));
}

export function normalizeConstructionSiteCommunityId(
  rawCommunityId: unknown,
  communities: CommunityRecord[],
  now: string,
): string {
  if (
    typeof rawCommunityId === 'string'
    && communities.some((community) => community.id === rawCommunityId)
  ) {
    return rawCommunityId;
  }

  const fallbackCommunity = communities.find((community) => community.name.trim())
    ?? createFallbackCommunity(now);
  if (!communities.some((community) => community.id === fallbackCommunity.id)) {
    communities.push(fallbackCommunity);
  }
  return fallbackCommunity.id;
}

export function isPersistedHouseStatus(value: PersistedHouseStatus): value is PersistedHouseStatus {
  return ['draft', 'rac_printed', 'built', 'archived'].includes(value);
}

export function isHouseType(value: HouseType): value is HouseType {
  return value === null || value === 'tipo6' || value === 'tipo3';
}

export function isSoilProfile(value: SoilProfile | undefined): value is SoilProfile {
  return value === 'stable' || value === 'loose_clay' || value === 'water_table';
}

export function isTerrainComplexity(value: TerrainComplexity | undefined): value is TerrainComplexity {
  return value === 'flat'
    || value === 'moderate'
    || value === 'steep'
    || value === 'very_steep'
    || value === 'extreme';
}

function normalizeOptionalNonNegativeInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > HOUSE_EXTRA_MATERIAL_MAX_COUNT) return undefined;
  return parsed;
}

function createFallbackCommunity(now: string): CommunityRecord {
  return {
    id: `community_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Comunidade não informada',
    createdAt: now,
  };
}
