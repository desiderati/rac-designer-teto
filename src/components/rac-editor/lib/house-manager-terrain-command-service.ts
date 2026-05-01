import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';
import type {HouseManagerViewRuntime} from '@/components/rac-editor/lib/house-manager-view-runtime.ts';

interface HouseManagerTerrainCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getAggregate: () => HouseAggregate | null;
  getDefaultTerrainType: () => number;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  viewRuntime: Pick<HouseManagerViewRuntime<TGroup>, 'applyTerrainTypeToElevationViews'>;
  persistHouse: () => void;
  syncProjectSession: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
}

/**
 * Centraliza comandos de terreno e sincronização visual de elevações.
 */
export class HouseManagerTerrainCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: HouseManagerTerrainCommandServiceArgs<TGroup>) {
  }

  setTerrainType(terrainType: number): number {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return this.args.getDefaultTerrainType();

    const normalized = normalizeTerrainSolidityLevel(terrainType);
    aggregate.setTerrainType(normalized);

    this.args.persistHouse();
    this.args.syncProjectSession();
    this.args.viewRuntime.applyTerrainTypeToElevationViews(this.args.getRuntimeHouse(), normalized);

    this.args.requestCanvasRender();
    this.args.notify();
    return normalized;
  }
}
