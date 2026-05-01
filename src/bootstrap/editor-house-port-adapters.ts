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

export interface EditorHouseReadSource {
  getHouseType(): HouseType;
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getTerrainType(): number;
  getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null;
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

export interface EditorHouseRuntimeSource {
  initialize(canvasPort: HouseVisualRuntimePort<CanvasGroup>): void;
}

export interface EditorHouseStateSource {
  subscribe(listener: () => void): () => void;
  getHouseState(): HouseState | null;
  getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null;
}

export function createEditorHouseReadPort(source: EditorHouseReadSource): HouseReadPort {
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
    applyHouseSetup: (setup) => {
      source.setSelectedPilotiHeights([...setup.selectedPilotiHeights]);
      source.setFamilyName(setup.familyName);
    },
    renameFamily: (name) => source.setFamilyName(name),
    refreshAutoStairsForCurrentSettings: () => source.refreshAutoStairsForCurrentSettings(),
    setHouseType: (type) => source.setHouseType(type),
    resetHouse: () => source.reset(),
    rebuildHouseFromCanvas: () => source.rebuildFromCanvas(),
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

export function createEditorHouseRuntimePort(source: EditorHouseRuntimeSource): HouseRuntimePort<CanvasGroup> {
  return {
    initializeCanvas: (canvasPort) => source.initialize(canvasPort),
  };
}

export function createEditorHouseStatePorts(source: EditorHouseStateSource): {
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<CanvasGroup>;
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

export function createHouse3DProjectionPort(
  getHouse: () => HouseRuntimeSnapshot<CanvasGroup> | null,
): House3DProjectionPort {
  return {
    getProjection: () => createHouse3DProjectionFromCanvasHouse(getHouse()),
  };
}
