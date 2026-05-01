import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseState,
  HouseViewInstanceId,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

export interface EditorHouseViewRuntime<TGroup extends HouseRuntimeGroupRef> {
  rebuildViewsFromRuntime(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    visualGroups: TGroup[];
    pilotisFromRuntime: Record<string, HousePiloti>;
    terrainTypeFromRuntime: number;
  }): { groupsToSync: TGroup[]; runtimeViewGroups: Array<{ instanceId: HouseViewInstanceId; group: TGroup }> };

  applyCurrentHouseDataToGroups(params: {
    groups: TGroup[];
    pilotis: Record<string, HousePiloti>;
    terrainType: number;
  }): void;

  applyTerrainTypeToElevationViews(house: HouseRuntimeSnapshot<TGroup> | null, terrainType: number): void;

  updatePiloti(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    runtimeViews: HouseRuntimeViews<TGroup>;
    pilotiId: string;
    pilotiData: Partial<HousePiloti>;
    selectedPilotiHeights: readonly number[];
    groups: TGroup[];
  }): { updated: boolean; shouldRefreshAutoContraventamento: boolean };
}
