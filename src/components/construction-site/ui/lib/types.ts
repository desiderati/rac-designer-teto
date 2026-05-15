import type {
  CreateConstructionSiteInput,
  CreateHouseInput,
  CreateMonitorInput,
  UpdateConstructionSiteInput,
  UpdateHouseConfigurationInput,
  UpdateMonitorInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  ConstructionSiteStatus,
  MonitorStatus,
  PersistedHouseStatus,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

export type ConstructionSiteManagementScreen =
  | 'construction-list'
  | 'construction-create'
  | 'construction-detail'
  | 'monitors'
  | 'monitor-create'
  | 'monitor-detail'
  | 'houses'
  | 'house-create'
  | 'house-detail';

export type ConstructionStatusFilter = 'all' | ConstructionSiteStatus;
export type ConstructionSortKey = 'constructionDate' | 'externalCode' | 'status';
export type MonitorStatusFilter = 'all' | MonitorStatus;
export type MonitorSortKey = 'updatedAt' | 'name' | 'status';
export type HouseStatusFilter = 'all' | PersistedHouseStatus;
export type HouseSortKey = 'updatedAt' | 'familyName' | 'status' | 'houseType';
export type StatusChangeAction = 'archive' | 'unarchive';

export type VisualSelectOption<T extends string> = {
  value: T;
  label: string;
  triggerLabel?: string;
  ariaLabel?: string;
};

export interface ConstructionSiteManagementActions {
  createConstructionSite(input: CreateConstructionSiteInput): Promise<void>;
  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void;
  archiveActiveConstructionSite(): void;
  archiveConstructionSite(constructionSiteId: string): Promise<void>;
  unarchiveConstructionSite(constructionSiteId: string): Promise<void>;
  activateConstructionSite(constructionSiteId: string): Promise<void>;
  createMonitor(input: CreateMonitorInput): void;
  updateMonitor(monitorId: string, input: UpdateMonitorInput): void;
  inactivateMonitor(monitorId: string): void;
  reactivateMonitor(monitorId: string): void;
  createHouse(input: CreateHouseInput): Promise<void>;
  duplicateActiveHouse(): Promise<void>;
  archiveActiveHouse(): Promise<void>;
  archiveHouse(houseId: string): Promise<void>;
  unarchiveHouse(houseId: string): Promise<void>;
  activateHouse(constructionSiteId: string, houseId: string): Promise<void>;
  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void;
  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void;
}
