import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseState,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

export interface EditorHouseViewRuntime<TGroup extends HouseRuntimeGroupRef> {
  applyCurrentHouseDataToGroups(params: {
    groups: TGroup[];
    pilotis: Record<string, HousePiloti>;
    terrainType: number;
    showAllElevationNivelLabels?: boolean;
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
    recalculateHeightOnNivelChange: boolean;
  }): { updated: boolean; shouldRefreshAutoContraventamento: boolean };
}
