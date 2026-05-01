import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseViewInstanceId,
} from '@/shared/types/house.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import type {HouseManagerVisualRebuildInput} from '@/components/rac-editor/lib/house-manager-visual-runtime.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';
import type {HouseManagerViewRuntime} from '@/components/rac-editor/lib/house-manager-view-runtime.ts';

interface HouseManagerViewCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getAggregate: () => HouseAggregate | null;
  getTerrainType: () => number;
  getAllGroups: () => TGroup[];
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  replaceRuntimeViewGroups: (entries: Array<{ instanceId: HouseViewInstanceId; group: TGroup }>) => void;
  createVisualRebuildInput: (params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }) => HouseManagerVisualRebuildInput<TGroup> | null;
  viewRuntime: Pick<HouseManagerViewRuntime<TGroup>, 'applyCurrentHouseDataToGroups' | 'rebuildViewsFromRuntime'>;
  persistHouse: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de vistas e reconstrução a partir do runtime visual.
 */
export class HouseManagerViewCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: HouseManagerViewCommandServiceArgs<TGroup>) {
  }

  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return null;

    aggregate.registerView({
      viewType: request.viewType,
      instanceId: request.instanceId,
      side: request.side,
    });

    this.args.persistHouse();
    if (request.viewType === 'top') {
      this.args.refreshAutoContraventamento();
    }

    this.args.notify();
    return {
      viewType: request.viewType,
      instanceId: request.instanceId,
      side: request.side,
      registeredTopView: request.viewType === 'top',
    };
  }

  rebuildFromCanvas(): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    const visualState = this.args.createVisualRebuildInput({
      currentPilotis: house.pilotis,
      fallbackTerrainType: this.args.getTerrainType(),
    });
    if (!visualState) return;

    const rebuild = this.args.viewRuntime.rebuildViewsFromRuntime({
      aggregate,
      house,
      visualGroups: visualState.visualGroups,
      pilotisFromRuntime: visualState.pilotisFromRuntime,
      terrainTypeFromRuntime: visualState.terrainTypeFromRuntime,
    });
    this.args.replaceRuntimeViewGroups(rebuild.runtimeViewGroups);
    this.args.persistHouse();

    this.args.viewRuntime.applyCurrentHouseDataToGroups({
      groups: rebuild.groupsToSync,
      terrainType: this.args.getTerrainType(),
      pilotis: house.pilotis,
    });

    this.args.notify();
  }

  removeView(instanceId: HouseViewInstanceId): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    const result = aggregate.removeView({instanceId});

    if (result.removedCount > 0) {
      this.args.unregisterRuntimeViewGroup(instanceId);
      this.args.persistHouse();
      this.args.notify();
    }
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.autoAssignAllSides(initialSide);
    this.args.persistHouse();
    this.args.notify();
  }
}
