import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {EditorHouseViewRuntime} from '@/components/rac-editor/lib/editor-house-view-runtime.ts';

interface EditorHouseTerrainCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getAggregate: () => HouseAggregate | null;
  getDefaultTerrainType: () => number;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  viewRuntime: Pick<EditorHouseViewRuntime<TGroup>, 'applyTerrainTypeToElevationViews'>;
  persistHouse: () => void;
  syncConstructionSiteSession: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
}

/**
 * Centraliza comandos de terreno e sincronização visual de elevações.
 */
export class EditorHouseTerrainCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: EditorHouseTerrainCommandServiceArgs<TGroup>) {
  }

  setTerrainType(terrainType: number): number {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return this.args.getDefaultTerrainType();

    const normalized = normalizeTerrainSolidityLevel(terrainType);
    aggregate.setTerrainType(normalized);

    this.args.persistHouse();
    this.args.syncConstructionSiteSession();
    this.args.viewRuntime.applyTerrainTypeToElevationViews(this.args.getRuntimeHouse(), normalized);

    this.args.requestCanvasRender();
    this.args.notify();
    return normalized;
  }
}
