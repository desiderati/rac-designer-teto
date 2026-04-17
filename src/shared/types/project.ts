import type {HouseSide, HouseType, HouseViewType} from '@/shared/types/house.ts';

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export type PersistedHouseStatus =
  | 'draft'
  | 'assessed'
  | 'designed'
  | 'approved'
  | 'built'
  | 'archived';

export type HouseSize = 'pequena' | 'media' | 'grande' | string;

export type PersonRole = 'leader' | 'monitor' | 'volunteer' | 'technician';

export type PilotiCode =
  | 'a1' | 'a2' | 'a3' | 'a4'
  | 'b1' | 'b2' | 'b3' | 'b4'
  | 'c1' | 'c2' | 'c3' | 'c4';

export interface CommunityRecord {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export interface FamilyRecord {
  id: string;
  projectId: string;
  communityId?: string;
  name: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  notes?: string;
}

export interface PersonRecord {
  id: string;
  name: string;
  phone?: string;
  roles: PersonRole[];
}

export interface ProjectPersonAssignment {
  personId: string;
  role: PersonRole;
  notes?: string;
}

export interface SiteAssessment {
  desnivelCm: number;
  hasConcreteGross: boolean;
  hasConcreteFine: boolean;
  hasStone: boolean;
  hasWater: boolean;
  hasRoots: boolean;
  hasPipe: boolean;
  hasBranches: boolean;
  hasWires: boolean;
  soilNotes?: string;
  obstacleNotes?: string;
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
  views: Partial<Record<HouseViewType, PersistedHouseViewDocument[]>>;
  canvasMeta?: Record<string, unknown>;
}

export interface PersistedHouseRecord {
  id: string;
  projectId: string;
  familyId: string;
  communityId?: string;
  houseType: HouseType;
  houseSize?: HouseSize;
  terrainType: number;
  status: PersistedHouseStatus;
  designSettings: HouseDesignSettings;
  siteAssessment: SiteAssessment;
  pilotiLayout: PersistedPilotiLayout;
  drawingDocument: PersistedDrawingDocument;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionProjectRecord {
  id: string;
  externalCode?: string;
  name: string;
  communityId?: string;
  status: ProjectStatus;
  activeHouseId?: string;
  leaderAssignments: ProjectPersonAssignment[];
  monitorAssignments: ProjectPersonAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectState {
  project: ConstructionProjectRecord;
  communities: CommunityRecord[];
  families: FamilyRecord[];
  people: PersonRecord[];
  houses: PersistedHouseRecord[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  externalCode?: string;
  status: ProjectStatus;
  activeHouseId?: string;
  houseCount: number;
  familyCount: number;
  updatedAt: string;
}

export const PROJECT_DOCUMENT_SCHEMA_VERSION = 1;

export const EMPTY_SITE_ASSESSMENT: SiteAssessment = {
  desnivelCm: 0,
  hasConcreteGross: false,
  hasConcreteFine: false,
  hasStone: false,
  hasWater: false,
  hasRoots: false,
  hasPipe: false,
  hasBranches: false,
  hasWires: false,
};

export const EMPTY_DRAWING_DOCUMENT: PersistedDrawingDocument = {
  schemaVersion: PROJECT_DOCUMENT_SCHEMA_VERSION,
  views: {},
};

export function createEmptyProjectState(project: ConstructionProjectRecord): ProjectState {
  return {
    project,
    communities: [],
    families: [],
    people: [],
    houses: [],
  };
}

export function toProjectSummary(state: ProjectState): ProjectSummary {
  return {
    id: state.project.id,
    name: state.project.name,
    externalCode: state.project.externalCode,
    status: state.project.status,
    activeHouseId: state.project.activeHouseId,
    houseCount: state.houses.length,
    familyCount: state.families.length,
    updatedAt: state.project.updatedAt,
  };
}
