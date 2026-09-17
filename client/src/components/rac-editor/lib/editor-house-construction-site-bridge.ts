import type {
  CreateConstructionSiteInput,
  CreateHouseInput,
  CreateMonitorInput,
  ConstructionSiteSessionPort,
  UpdateConstructionSiteInput,
  UpdateFamilyInput,
  UpdateHouseConfigurationInput,
  UpdateHouseExtraMaterialsInput,
  UpdateMonitorInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
  MonitorRecord,
  PersistedHouseRecord,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

interface EditorHouseConstructionSiteBridgeArgs {
  constructionSiteSession: ConstructionSiteSessionPort;
  loadHouseDrawingDocument(document: HouseDrawingDocument | null): void;
  notify(): void;
}

export class EditorHouseConstructionSiteBridge {
  constructor(private readonly args: EditorHouseConstructionSiteBridgeArgs) {
  }

  getConstructionSiteSummaries(): ConstructionSiteSummary[] {
    return this.session.getConstructionSiteSummaries();
  }

  getConstructionSiteSnapshots(): ConstructionSiteState[] {
    return this.session.getConstructionSiteSnapshots();
  }

  getConstructionSiteSnapshot(): ConstructionSiteState | null {
    return this.session.getConstructionSite();
  }

  createConstructionSite(input: CreateConstructionSiteInput): ConstructionSiteState {
    const constructionSite = this.session.createConstructionSite(input);
    this.args.loadHouseDrawingDocument(null);
    return constructionSite;
  }

  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void {
    this.session.updateActiveConstructionSite(input);
    this.args.notify();
  }

  archiveActiveConstructionSite(): void {
    this.session.archiveActiveConstructionSite();
    this.args.loadHouseDrawingDocument(null);
  }

  archiveConstructionSite(constructionSiteId: string): void {
    this.session.archiveConstructionSite(constructionSiteId);
    this.reloadActiveHouseDrawingDocument();
  }

  unarchiveConstructionSite(constructionSiteId: string): void {
    this.session.unarchiveConstructionSite(constructionSiteId);
    this.reloadActiveHouseDrawingDocument();
  }

  deleteArchivedConstructionSite(constructionSiteId: string): void {
    this.session.deleteArchivedConstructionSite(constructionSiteId);
    this.reloadActiveHouseDrawingDocument();
  }

  markConstructionSiteCompleted(constructionSiteId: string): void {
    this.session.markConstructionSiteCompleted(constructionSiteId);
    this.reloadActiveHouseDrawingDocument();
  }

  markConstructionSiteInProgress(constructionSiteId: string): void {
    this.session.markConstructionSiteInProgress(constructionSiteId);
    this.reloadActiveHouseDrawingDocument();
  }

  activateConstructionSite(constructionSiteId: string): HouseDrawingDocument | null {
    const document = this.session.activateConstructionSite(constructionSiteId);
    this.args.loadHouseDrawingDocument(document);
    return document;
  }

  createMonitor(input: CreateMonitorInput): MonitorRecord {
    const monitor = this.session.createMonitor(input);
    this.args.notify();
    return monitor;
  }

  updateMonitor(monitorId: string, input: UpdateMonitorInput): void {
    this.session.updateMonitor(monitorId, input);
    this.args.notify();
  }

  inactivateMonitor(monitorId: string): void {
    this.session.inactivateMonitor(monitorId);
    this.args.notify();
  }

  reactivateMonitor(monitorId: string): void {
    this.session.reactivateMonitor(monitorId);
    this.args.notify();
  }

  deleteInactiveMonitor(monitorId: string): void {
    this.session.deleteInactiveMonitor(monitorId);
    this.args.notify();
  }

  createHouse(input: CreateHouseInput): PersistedHouseRecord {
    const house = this.session.createHouse(input);
    this.reloadActiveHouseDrawingDocument();
    return house;
  }

  duplicateActiveHouse(): PersistedHouseRecord {
    const house = this.session.duplicateActiveHouse();
    this.reloadActiveHouseDrawingDocument();
    return house;
  }

  archiveActiveHouse(): void {
    this.session.archiveActiveHouse();
    this.reloadActiveHouseDrawingDocument();
  }

  archiveHouse(houseId: string): void {
    this.session.archiveHouse(houseId);
    this.reloadActiveHouseDrawingDocument();
  }

  unarchiveHouse(houseId: string): void {
    this.session.unarchiveHouse(houseId);
    this.reloadActiveHouseDrawingDocument();
  }

  deleteArchivedHouse(houseId: string): void {
    this.session.deleteArchivedHouse(houseId);
    this.reloadActiveHouseDrawingDocument();
  }

  markActiveHouseRacPrinted(): void {
    this.session.markActiveHouseRacPrinted();
    this.args.notify();
  }

  markHouseRacPrinted(houseId: string): void {
    this.session.markHouseRacPrinted(houseId);
    this.args.notify();
  }

  markHouseBuilt(houseId: string): void {
    this.session.markHouseBuilt(houseId);
    this.reloadActiveHouseDrawingDocument();
  }

  markHouseDraft(houseId: string): void {
    this.session.markHouseDraft(houseId);
    this.reloadActiveHouseDrawingDocument();
  }

  activateHouse(constructionSiteId: string, houseId: string): HouseDrawingDocument | null {
    const document = this.session.activateHouse(constructionSiteId, houseId);
    this.args.loadHouseDrawingDocument(document);
    return document;
  }

  updateActiveFamily(input: UpdateFamilyInput): void {
    this.session.updateActiveFamily(input);
    this.reloadActiveHouseDrawingDocument();
  }

  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void {
    this.session.updateActiveHouseSiteAssessment(input);
    this.args.notify();
  }

  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void {
    this.session.updateActiveHouseConfiguration(input);
    this.reloadActiveHouseDrawingDocument();
  }

  updateActiveHouseExtraMaterials(input: UpdateHouseExtraMaterialsInput): void {
    this.session.updateActiveHouseExtraMaterials(input);
    this.args.notify();
  }

  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void {
    this.session.saveActiveHouseDrawingDocument(document);
    this.args.notify();
  }

  getActiveHouseDrawingDocument(): HouseDrawingDocument | null {
    return this.session.getActiveHouseDrawingDocument();
  }

  canOpenRacEditor(): boolean {
    return this.session.canOpenRacEditor();
  }

  prepareRacEditorOpening(): HouseDrawingDocument | null {
    const document = this.session.prepareRacEditorOpening();
    this.args.loadHouseDrawingDocument(document);
    return document;
  }

  private get session(): ConstructionSiteSessionPort {
    return this.args.constructionSiteSession;
  }

  private reloadActiveHouseDrawingDocument(): void {
    this.args.loadHouseDrawingDocument(this.session.getActiveHouseDrawingDocument());
  }
}
