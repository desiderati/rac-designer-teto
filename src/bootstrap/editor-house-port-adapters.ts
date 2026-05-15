import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {
  HouseRuntimeGroupRef,
  HouseVisualRuntimePort,
} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {HousePilotiPatch} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {ConstructionSiteManagementPort} from '@/components/construction-site/ports/ConstructionSiteManagementPort.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {
  CreateHouseInput,
  CreateConstructionSiteInput,
  CreateMonitorInput,
  UpdateFamilyInput,
  UpdateHouseConfigurationInput,
  UpdateConstructionSiteInput,
  UpdateMonitorInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingDocument,
  type HouseDrawingCanvasDocument,
} from '@/shared/types/house-drawing-document.ts';
import type {
  MonitorRecord,
  PersistedHouseRecord,
  ConstructionSiteState,
  ConstructionSiteSummary,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

export interface EditorHouseReadSource<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  getHouseType(): HouseType;
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getTerrainType(): number;
  getHouse(): HouseRuntimeSnapshot<TGroup> | null;
  getPilotiData(pilotiId: string): HousePiloti;
  getHouseViewCount(viewType: HouseViewType): number;
  getMaxHouseViewCount(viewType: HouseViewType): number;
  canDeletePlant(): boolean;
  isViewAtLimit(viewType: HouseViewType): boolean;
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];
  getAvailableSides(viewType: HouseViewType): HouseSide[];
  hasPreAssignedSides(): boolean;
}

export interface EditorHouseWriteSource {
  setSelectedPilotiHeights(heights: number[]): void;
  setFamilyName(name: string): void;
  refreshAutoStairsForCurrentSettings(): void;
  refreshAutoContraventamentoForCurrentHouse(): void;
  setHouseType(type: HouseType): void;
  reset(): void;
  setTerrainType(terrainType: number): number;
  removeView(instanceId: HouseViewInstanceId): void;
  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null;
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
  updatePiloti(pilotiId: string, pilotiData: HousePilotiPatch): void;
  getPilotiData(pilotiId: string): HousePiloti;
  calculateAndApplyRecommendedHeights(): void;
}

export interface EditorHouseRuntimeSource<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  initialize(canvasPort: HouseVisualRuntimePort<TGroup>): void;
}

export interface EditorHouseStateSource<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  subscribe(listener: () => void): () => void;
  getHouseState(): HouseState | null;
  getHouse(): HouseRuntimeSnapshot<TGroup> | null;
}

export interface EditorHouseDocumentSource {
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getHouseState(): HouseState | null;
  loadHouseDrawingDocument(document: HouseDrawingDocument): void;
}

export interface EditorConstructionSiteManagementSource {
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
  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void;
  getActiveHouseDrawingDocument(): HouseDrawingDocument | null;
}

export function createEditorHouseReadPort<TGroup extends HouseRuntimeGroupRef>(
  source: EditorHouseReadSource<TGroup>,
): HouseReadPort {
  return {
    getCurrentHouseType: () => source.getHouseType(),
    getFamilyName: () => source.getFamilyName(),
    getSelectedPilotiHeights: () => source.getSelectedPilotiHeights(),
    getTerrainType: () => source.getTerrainType(),
    getPilotis: () => source.getHouse()?.pilotis,
    getPilotiData: (pilotiId) => source.getPilotiData(pilotiId),
    getViewCount: (viewType) => ({
      current: source.getHouseViewCount(viewType),
      max: source.getMaxHouseViewCount(viewType),
    }),
    canDeleteTopView: () => source.canDeletePlant(),
    isViewAtLimit: (viewType) => source.isViewAtLimit(viewType),
    getPreAssignedSides: (viewType) => source.getPreAssignedSides(viewType),
    getAvailableSides: (viewType) => source.getAvailableSides(viewType),
    hasPreAssignedSides: () => source.hasPreAssignedSides(),
  };
}

export function createEditorHouseWritePort(source: EditorHouseWriteSource): HouseWritePort {
  return {
    applyPilotisSetup: (setup) => {
      source.setSelectedPilotiHeights([...setup.selectedPilotiHeights]);
    },
    renameFamily: (name) => source.setFamilyName(name),
    refreshAutoStairsForCurrentSettings: () => source.refreshAutoStairsForCurrentSettings(),
    refreshAutoContraventamentoForCurrentHouse: () => source.refreshAutoContraventamentoForCurrentHouse(),
    setHouseType: (type) => source.setHouseType(type),
    resetHouse: () => source.reset(),
    setTerrainType: (terrainType) => source.setTerrainType(terrainType),
    removeView: (instanceId) => source.removeView(instanceId),
    registerView: (request) => source.registerView(request),
    autoAssignAllSides: (initialViewType, initialSide) => source.autoAssignAllSides(initialViewType, initialSide),
    updatePiloti: (pilotiId, pilotiData) => {
      source.updatePiloti(pilotiId, pilotiData);
      return source.getPilotiData(pilotiId);
    },
    calculateAndApplyRecommendedHeights: () => source.calculateAndApplyRecommendedHeights(),
  };
}

export function createEditorHouseRuntimePort<TGroup extends HouseRuntimeGroupRef>(
  source: EditorHouseRuntimeSource<TGroup>,
): HouseRuntimePort<TGroup> {
  return {
    initializeCanvas: (canvasPort) => source.initialize(canvasPort),
  };
}

export function createEditorHouseStatePorts<TGroup extends HouseRuntimeGroupRef>(
  source: EditorHouseStateSource<TGroup>,
): {
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<TGroup>;
} {
  return {
    houseStatePort: {
      subscribe: (listener) => source.subscribe(listener),
      getStateSnapshot: () => source.getHouseState(),
    },
    houseRuntimeSnapshotPort: {
      subscribe: (listener) => source.subscribe(listener),
      getRuntimeSnapshot: () => source.getHouse(),
    },
  };
}

export function createEditorHouseDrawingDocumentPort(
  source: EditorHouseDocumentSource,
): HouseDrawingDocumentPort {
  return {
    exportHouseDrawingDocument: (canvas: HouseDrawingCanvasDocument) => {
      const house = source.getHouseState();
      if (!house) return null;

      return {
        documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
        schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
        setup: {
          familyName: source.getFamilyName(),
          selectedPilotiHeights: [...source.getSelectedPilotiHeights()],
        },
        house,
        canvas,
      };
    },
    importHouseDrawingDocument: (document) => source.loadHouseDrawingDocument(document),
  };
}

export function createEditorConstructionSiteManagementPort(
  source: EditorConstructionSiteManagementSource,
): ConstructionSiteManagementPort {
  return {
    subscribe: (listener) => source.subscribe(listener),
    getConstructionSiteSummaries: () => source.getConstructionSiteSummaries(),
    getConstructionSiteSnapshots: () => clonePortValue(source.getConstructionSiteSnapshots()),
    getConstructionSiteSnapshot: () => clonePortValue(source.getConstructionSiteSnapshot()),
    canOpenRacEditor: () => source.canOpenRacEditor(),
    createConstructionSite: (input) => clonePortValue(source.createConstructionSite(input)),
    updateActiveConstructionSite: (input) => source.updateActiveConstructionSite(input),
    archiveActiveConstructionSite: () => source.archiveActiveConstructionSite(),
    archiveConstructionSite: (constructionSiteId) => source.archiveConstructionSite(constructionSiteId),
    unarchiveConstructionSite: (constructionSiteId) => source.unarchiveConstructionSite(constructionSiteId),
    activateConstructionSite: (constructionSiteId) => source.activateConstructionSite(constructionSiteId),
    createMonitor: (input) => clonePortValue(source.createMonitor(input)),
    updateMonitor: (monitorId, input) => source.updateMonitor(monitorId, input),
    inactivateMonitor: (monitorId) => source.inactivateMonitor(monitorId),
    reactivateMonitor: (monitorId) => source.reactivateMonitor(monitorId),
    createHouse: (input) => clonePortValue(source.createHouse(input)),
    duplicateActiveHouse: () => clonePortValue(source.duplicateActiveHouse()),
    archiveActiveHouse: () => source.archiveActiveHouse(),
    archiveHouse: (houseId) => source.archiveHouse(houseId),
    unarchiveHouse: (houseId) => source.unarchiveHouse(houseId),
    activateHouse: (constructionSiteId, houseId) => source.activateHouse(constructionSiteId, houseId),
    updateActiveFamily: (input) => source.updateActiveFamily(input),
    updateActiveHouseSiteAssessment: (input) => source.updateActiveHouseSiteAssessment(input),
    updateActiveHouseConfiguration: (input) => source.updateActiveHouseConfiguration(input),
    saveActiveHouseDrawingDocument: (document) => source.saveActiveHouseDrawingDocument(document),
    getActiveHouseDrawingDocument: () => source.getActiveHouseDrawingDocument(),
  };
}

function clonePortValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
