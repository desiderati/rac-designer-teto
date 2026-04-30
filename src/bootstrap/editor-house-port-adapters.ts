import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseVisualRuntimePort} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HousePilotiPatch} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';

interface HouseManagerReadSource {
  getHouseType(): HouseType;
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getTerrainType(): number;
  getHouse(): { pilotis: Record<string, HousePiloti> } | null;
  getPilotiData(pilotiId: string): HousePiloti;
  getHouseViewCount(viewType: HouseViewType): number;
  getMaxHouseViewCount(viewType: HouseViewType): number;
  canDeletePlant(): boolean;
  isViewAtLimit(viewType: HouseViewType): boolean;
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];
  getAvailableSides(viewType: HouseViewType): HouseSide[];
  hasPreAssignedSides(): boolean;
}

interface HouseManagerWriteSource {
  setSelectedPilotiHeights(heights: number[]): void;
  setFamilyName(name: string): void;
  refreshAutoStairsForCurrentSettings(): void;
  setHouseType(type: HouseType): void;
  reset(): void;
  rebuildFromCanvas(): void;
  setTerrainType(terrainType: number): number;
  removeView(instanceId: HouseViewInstanceId): void;
  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null;
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
  updatePiloti(pilotiId: string, pilotiData: HousePilotiPatch): void;
  getPilotiData(pilotiId: string): HousePiloti;
  calculateAndApplyRecommendedHeights(): void;
}

interface HouseManagerRuntimeSource {
  initialize(canvasPort: HouseVisualRuntimePort<CanvasGroup>): void;
}

interface HouseManagerStateSource {
  subscribe(listener: () => void): () => void;
  getHouseState(): HouseState | null;
  getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null;
}

export function createHouseManagerReadPort(houseManager: HouseManagerReadSource): HouseReadPort {
  return {
    getCurrentHouseType: () => houseManager.getHouseType(),
    getFamilyName: () => houseManager.getFamilyName(),
    getSelectedPilotiHeights: () => houseManager.getSelectedPilotiHeights(),
    getTerrainType: () => houseManager.getTerrainType(),
    getPilotis: () => houseManager.getHouse()?.pilotis,
    getPilotiData: (pilotiId) => houseManager.getPilotiData(pilotiId),
    getViewCount: (viewType) => ({
      current: houseManager.getHouseViewCount(viewType),
      max: houseManager.getMaxHouseViewCount(viewType),
    }),
    canDeleteTopView: () => houseManager.canDeletePlant(),
    isViewAtLimit: (viewType) => houseManager.isViewAtLimit(viewType),
    getPreAssignedSides: (viewType) => houseManager.getPreAssignedSides(viewType),
    getAvailableSides: (viewType) => houseManager.getAvailableSides(viewType),
    hasPreAssignedSides: () => houseManager.hasPreAssignedSides(),
  };
}

export function createHouseManagerWritePort(houseManager: HouseManagerWriteSource): HouseWritePort {
  return {
    applyHouseSetup: (setup) => {
      houseManager.setSelectedPilotiHeights([...setup.selectedPilotiHeights]);
      houseManager.setFamilyName(setup.familyName);
    },
    renameFamily: (name) => houseManager.setFamilyName(name),
    refreshAutoStairsForCurrentSettings: () => houseManager.refreshAutoStairsForCurrentSettings(),
    setHouseType: (type) => houseManager.setHouseType(type),
    resetHouse: () => houseManager.reset(),
    rebuildHouseFromCanvas: () => houseManager.rebuildFromCanvas(),
    setTerrainType: (terrainType) => houseManager.setTerrainType(terrainType),
    removeView: (instanceId) => houseManager.removeView(instanceId),
    registerView: (request) => houseManager.registerView(request),
    autoAssignAllSides: (initialViewType, initialSide) => houseManager.autoAssignAllSides(initialViewType, initialSide),
    updatePiloti: (pilotiId, pilotiData) => {
      houseManager.updatePiloti(pilotiId, pilotiData);
      return houseManager.getPilotiData(pilotiId);
    },
    calculateAndApplyRecommendedHeights: () => houseManager.calculateAndApplyRecommendedHeights(),
  };
}

export function createHouseManagerRuntimePort(houseManager: HouseManagerRuntimeSource): HouseRuntimePort<CanvasGroup> {
  return {
    initializeCanvas: (canvasPort) => houseManager.initialize(canvasPort),
  };
}

export function createHouseManagerStatePorts(houseManager: HouseManagerStateSource): {
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<CanvasGroup>;
} {
  return {
    houseStatePort: {
      subscribe: (listener) => houseManager.subscribe(listener),
      getStateSnapshot: () => houseManager.getHouseState(),
    },
    houseRuntimeSnapshotPort: {
      subscribe: (listener) => houseManager.subscribe(listener),
      getRuntimeSnapshot: () => houseManager.getHouse(),
    },
  };
}

export function createHouse3DProjectionPort(
  getHouse: () => HouseRuntimeSnapshot<CanvasGroup> | null,
): House3DProjectionPort {
  return {
    getProjection: () => createHouse3DProjectionFromCanvasHouse(getHouse()),
  };
}
