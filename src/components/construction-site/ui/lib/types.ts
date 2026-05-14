import type {
  CreateConstructionSiteInput,
  CreateHouseInput,
  UpdateConstructionSiteInput,
  UpdateHouseConfigurationInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  ConstructionSiteStatus,
  PersistedHouseStatus,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

export type ConstructionSiteManagementScreen =
  | 'construction-list'
  | 'construction-create'
  | 'construction-detail'
  | 'houses'
  | 'house-create'
  | 'house-detail';

export type ConstructionStatusFilter = 'all' | ConstructionSiteStatus;
export type ConstructionSortKey = 'constructionDate' | 'externalCode' | 'status';
export type HouseStatusFilter = 'all' | PersistedHouseStatus;
export type HouseSortKey = 'updatedAt' | 'familyName' | 'status' | 'houseType';
export type StatusChangeAction = 'archive' | 'unarchive';

export type VisualSelectOption<T extends string> = {
  value: T;
  label: string;
};

export interface ConstructionSiteManagementActions {
  createConstructionSite(input: CreateConstructionSiteInput): Promise<void>;
  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void;
  archiveActiveConstructionSite(): void;
  archiveConstructionSite(constructionSiteId: string): Promise<void>;
  unarchiveConstructionSite(constructionSiteId: string): Promise<void>;
  activateConstructionSite(constructionSiteId: string): Promise<void>;
  createHouse(input: CreateHouseInput): Promise<void>;
  duplicateActiveHouse(): Promise<void>;
  archiveActiveHouse(): Promise<void>;
  archiveHouse(houseId: string): Promise<void>;
  unarchiveHouse(houseId: string): Promise<void>;
  activateHouse(constructionSiteId: string, houseId: string): Promise<void>;
  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void;
  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void;
}
