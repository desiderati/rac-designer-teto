import type {
  CreateMonitorInput,
  CreateHouseInput,
  CreateConstructionSiteInput,
  UpdateMonitorInput,
  UpdateFamilyInput,
  UpdateHouseExtraMaterialsInput,
  UpdateHouseConfigurationInput,
  UpdateConstructionSiteInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import type {
  MonitorRecord,
  PersistedHouseRecord,
  ConstructionSiteState,
  ConstructionSiteSummary,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

export interface ConstructionSiteManagementPort {
  subscribe(listener: () => void): () => void;
  getConstructionSiteSummaries(): ConstructionSiteSummary[];
  getConstructionSiteSnapshots(): ConstructionSiteState[];
  getConstructionSiteSnapshot(): ConstructionSiteState | null;
  canOpenRacEditor(): boolean;
  createConstructionSite(input: CreateConstructionSiteInput): ConstructionSiteState;
  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void;
  archiveActiveConstructionSite(): void;
  archiveConstructionSite(constructionSiteId: string): void;
  unarchiveConstructionSite(constructionSiteId: string): void;
  activateConstructionSite(constructionSiteId: string): HouseDrawingDocument | null;
  createMonitor(input: CreateMonitorInput): MonitorRecord;
  updateMonitor(monitorId: string, input: UpdateMonitorInput): void;
  inactivateMonitor(monitorId: string): void;
  reactivateMonitor(monitorId: string): void;
  createHouse(input: CreateHouseInput): PersistedHouseRecord;
  duplicateActiveHouse(): PersistedHouseRecord;
  archiveActiveHouse(): void;
  archiveHouse(houseId: string): void;
  unarchiveHouse(houseId: string): void;
  activateHouse(constructionSiteId: string, houseId: string): HouseDrawingDocument | null;
  updateActiveFamily(input: UpdateFamilyInput): void;
  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void;
  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void;
  updateActiveHouseExtraMaterials(input: UpdateHouseExtraMaterialsInput): void;
  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void;
  getActiveHouseDrawingDocument(): HouseDrawingDocument | null;
}
