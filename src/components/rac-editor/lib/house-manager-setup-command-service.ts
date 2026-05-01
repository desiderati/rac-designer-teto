import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HouseType} from '@/shared/types/house.ts';

interface HouseManagerSetupCommandServiceArgs {
  getAggregate: () => HouseAggregate | null;
  persistHouse: () => void;
  syncProjectSession: () => void;
  notify: () => void;
}

/**
 * Centraliza comandos de configuração estrutural da casa.
 */
export class HouseManagerSetupCommandService {
  constructor(private readonly args: HouseManagerSetupCommandServiceArgs) {
  }

  setHouseType(type: HouseType): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.setHouseType(type);
    this.args.persistHouse();
    this.args.syncProjectSession();
    this.args.notify();
  }
}
