import type {HouseSide, HouseState, HouseType, HouseViewType} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  type HouseDrawingCanvasDocument,
} from '@/shared/types/house-drawing-document.ts';

export type ConstructionSiteStatus = 'in_progress' | 'completed' | 'archived';

export type PersistedHouseStatus =
  | 'draft'
  | 'rac_printed'
  | 'built'
  | 'archived';

export type MonitorStatus = 'active' | 'inactive';

export type HouseSize = 'large' | 'small';

export type PilotiCode =
  | 'a1' | 'a2' | 'a3' | 'a4'
  | 'b1' | 'b2' | 'b3' | 'b4'
  | 'c1' | 'c2' | 'c3' | 'c4';

export type SoilProfile = 'stable_clay' | 'firm_hard' | 'alluvial' | 'water_table';

export type TerrainComplexity = 'flat' | 'moderate' | 'steep' | 'very_steep' | 'extreme';

export interface CommunityRecord {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export interface FamilyRecord {
  id: string;
  constructionSiteId: string;
  communityId?: string;
  name: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  photoDataUrl?: string;
  notes?: string;
}

export interface MonitorRecord {
  id: string;
  constructionSiteId: string;
  name: string;
  phone: string;
  photoDataUrl?: string;
  email?: string;
  status: MonitorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteAssessment {
  soilProfile?: SoilProfile;
  hasHydraulicObstacles?: boolean;
  hasUndergroundObstacles?: boolean;
  hasElevatedObstacles?: boolean;
  hasNeighborSetbackConstraints?: boolean;
  locationQuery?: string;
}

export interface HouseExtraMaterials {
  floorBeams?: number;
  rafters?: number;
  secondaryBeams?: number;
  gutters?: number;
  justification?: string;
}

export interface HouseDesignSettings {
  selectedPilotiHeights: number[];
}

export interface PersistedPilotiPoint {
  id: string;
  code: PilotiCode;
  height: number;
  nivel: number;
  isMaster: boolean;
}

export interface PersistedPilotiSummary {
  totalByHeight: Partial<Record<string, number>>;
  masterCode?: PilotiCode;
  masterHeight?: number;
}

export interface PersistedPilotiLayout {
  masterCode?: PilotiCode;
  points: PersistedPilotiPoint[];
  summary?: PersistedPilotiSummary;
}

export interface PersistedHouseViewDocument {
  instanceId: string;
  viewType: HouseViewType;
  side?: HouseSide;
  payload: unknown;
}

export interface PersistedDrawingDocument {
  schemaVersion: number;
  house: HouseState | null;
  canvas: HouseDrawingCanvasDocument;
  views?: Partial<Record<HouseViewType, PersistedHouseViewDocument[]>>;
  canvasMeta?: Record<string, unknown>;
}

export interface PersistedHouseRecord {
  id: string;
  constructionSiteId: string;
  familyId: string;
  communityId?: string;
  houseType: HouseType;
  terrainType: number;
  status: PersistedHouseStatus;
  houseSize?: HouseSize;
  leaders?: string;
  extraMaterials?: HouseExtraMaterials;
  designSettings: HouseDesignSettings;
  siteAssessment: SiteAssessment;
  pilotiLayout: PersistedPilotiLayout;
  drawingDocument: PersistedDrawingDocument;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionSiteRecord {
  id: string;
  externalCode: string;
  photoDataUrl?: string;
  constructionDate: string;
  communityId: string;
  status: ConstructionSiteStatus;
  activeHouseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionSiteState {
  constructionSite: ConstructionSiteRecord;
  communities: CommunityRecord[];
  families: FamilyRecord[];
  monitors: MonitorRecord[];
  houses: PersistedHouseRecord[];
}

export interface ConstructionSiteSummary {
  id: string;
  label: string;
  externalCode: string;
  photoDataUrl?: string;
  constructionDate: string;
  communityName: string;
  status: ConstructionSiteStatus;
  activeHouseId?: string;
  houseCount: number;
  familyCount: number;
  updatedAt: string;
}

export const CONSTRUCTION_SITE_DOCUMENT_SCHEMA_VERSION = 1;

export const EMPTY_SITE_ASSESSMENT: SiteAssessment = {};

export const EMPTY_DRAWING_DOCUMENT: PersistedDrawingDocument = {
  schemaVersion: CONSTRUCTION_SITE_DOCUMENT_SCHEMA_VERSION,
  house: null,
  canvas: {
    schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
    objects: [],
  },
  views: {},
};

export function createEmptyConstructionSiteState(constructionSite: ConstructionSiteRecord): ConstructionSiteState {
  return {
    constructionSite,
    communities: [],
    families: [],
    monitors: [],
    houses: [],
  };
}

export function toConstructionSiteSummary(state: ConstructionSiteState): ConstructionSiteSummary {
  const communityName = getConstructionSiteCommunityName(state);

  return {
    id: state.constructionSite.id,
    label: formatConstructionLabel(state.constructionSite.externalCode, communityName),
    externalCode: state.constructionSite.externalCode,
    photoDataUrl: state.constructionSite.photoDataUrl,
    constructionDate: state.constructionSite.constructionDate,
    communityName,
    status: state.constructionSite.status,
    activeHouseId: state.constructionSite.activeHouseId,
    houseCount: state.houses.length,
    familyCount: state.families.length,
    updatedAt: state.constructionSite.updatedAt,
  };
}

export function getConstructionSiteCommunityName(state: ConstructionSiteState): string {
  const communityId = state.constructionSite.communityId;
  if (!communityId) return 'Comunidade não informada';
  return state.communities.find((community) => community.id === communityId)?.name?.trim() || 'Comunidade não informada';
}

export function formatConstructionLabel(externalCode?: string, communityName?: string): string {
  const code = externalCode?.trim();
  const community = communityName?.trim();

  if (code && community) return `${code} · ${community}`;
  if (code) return code;
  if (community) return community;
  return 'Construção sem identificação';
}
