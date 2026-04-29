import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseType} from '@/shared/types/house.ts';
import {HouseManagerSessionMetadata} from '@/components/rac-editor/lib/house-manager-session.ts';

interface HouseManagerSessionServiceArgs {
  getAggregate: () => HouseAggregate<CanvasGroup> | null;
  getHouseType: () => HouseType;
  getTerrainType: () => number;
  persistHouse: () => void;
  notify: () => void;
}

/**
 * Coordena metadados de sessao da casa e sincronizacao com o projeto ativo.
 */
export class HouseManagerSessionService {
  private readonly metadata = new HouseManagerSessionMetadata();

  constructor(private readonly args: HouseManagerSessionServiceArgs) {
  }

  reset(): void {
    this.metadata.reset();
    this.hydrateFromProjectSession();
  }

  syncProjectSession(): void {
    this.metadata.syncProjectSession({
      houseType: this.args.getHouseType(),
      terrainType: this.args.getTerrainType(),
    });
  }

  getFamilyName(): string {
    return this.metadata.getFamilyName();
  }

  setFamilyName(name: string): void {
    this.metadata.setFamilyName(name);
    this.syncProjectSession();
    this.args.notify();
  }

  getSelectedPilotiHeights(): readonly number[] {
    return this.metadata.getSelectedPilotiHeights();
  }

  setSelectedPilotiHeights(heights: readonly number[]): void {
    this.metadata.setSelectedPilotiHeights(heights);
    this.syncProjectSession();
  }

  private hydrateFromProjectSession(): void {
    this.metadata.hydrateFromProjectSession({
      aggregate: this.args.getAggregate(),
      persistHouse: () => this.args.persistHouse(),
    });
  }
}
