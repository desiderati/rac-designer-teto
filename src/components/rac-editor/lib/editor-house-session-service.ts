import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {EditorHouseSessionMetadata} from '@/components/rac-editor/lib/editor-house-session.ts';
import type {ConstructionSiteSessionPort} from '@/components/rac-editor/lib/construction-site-session.ts';

interface EditorHouseSessionServiceArgs {
  constructionSiteSession: ConstructionSiteSessionPort;
  getAggregate: () => HouseAggregate | null;
  getHouseType: () => HouseType;
  getTerrainType: () => number;
  persistHouse: () => void;
  notify: () => void;
}

/**
 * Coordena metadados de sessão da casa e sincronização com a Construção TETO ativa.
 */
export class EditorHouseSessionService {
  private readonly metadata: EditorHouseSessionMetadata;

  constructor(private readonly args: EditorHouseSessionServiceArgs) {
    this.metadata = new EditorHouseSessionMetadata(args.constructionSiteSession);
  }

  reset(): void {
    this.metadata.reset();
    this.hydrateFromConstructionSiteSession();
  }

  syncConstructionSiteSession(): void {
    this.metadata.syncConstructionSiteSession({
      houseType: this.args.getHouseType(),
      terrainType: this.args.getTerrainType(),
    });
  }

  getFamilyName(): string {
    return this.metadata.getFamilyName();
  }

  setFamilyName(name: string): void {
    this.metadata.setFamilyName(name);
    this.syncConstructionSiteSession();
    this.args.notify();
  }

  getSelectedPilotiHeights(): readonly number[] {
    return this.metadata.getSelectedPilotiHeights();
  }

  setSelectedPilotiHeights(heights: readonly number[]): void {
    this.metadata.setSelectedPilotiHeights(heights);
    this.syncConstructionSiteSession();
  }

  private hydrateFromConstructionSiteSession(): void {
    this.metadata.hydrateFromConstructionSiteSession({
      aggregate: this.args.getAggregate(),
      persistHouse: () => this.args.persistHouse(),
    });
  }
}
