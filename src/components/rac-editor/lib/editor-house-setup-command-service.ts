import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HouseType} from '@/shared/types/house.ts';

interface EditorHouseSetupCommandServiceArgs {
  getAggregate: () => HouseAggregate | null;
  persistHouse: () => void;
  syncConstructionSiteSession: () => void;
  notify: () => void;
}

/**
 * Centraliza comandos de configuração estrutural da casa.
 */
export class EditorHouseSetupCommandService {
  constructor(private readonly args: EditorHouseSetupCommandServiceArgs) {
  }

  setHouseType(type: HouseType): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.setHouseType(type);
    this.args.persistHouse();
    this.args.syncConstructionSiteSession();
    this.args.notify();
  }
}
