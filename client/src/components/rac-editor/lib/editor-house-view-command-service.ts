import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HouseSide,
  HouseState,
  HouseViewInstanceId,
} from '@/shared/types/house.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

interface EditorHouseViewCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getAggregate: () => HouseAggregate | null;
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  persistHouse: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de vistas da casa sem depender de reconstrução por snapshot visual.
 */
export class EditorHouseViewCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: EditorHouseViewCommandServiceArgs<TGroup>) {
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
