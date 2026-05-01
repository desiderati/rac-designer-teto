import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {EditorHouseSessionMetadata} from '@/components/rac-editor/lib/editor-house-session.ts';
import type {ProjectSessionPort} from '@/components/rac-editor/lib/project-session.ts';

interface EditorHouseSessionServiceArgs {
  projectSession: ProjectSessionPort;
  getAggregate: () => HouseAggregate | null;
  getHouseType: () => HouseType;
  getTerrainType: () => number;
  persistHouse: () => void;
  notify: () => void;
}

/**
 * Coordena metadados de sessão da casa e sincronização com o projeto ativo.
 */
export class EditorHouseSessionService {
  private readonly metadata: EditorHouseSessionMetadata;

  constructor(private readonly args: EditorHouseSessionServiceArgs) {
    this.metadata = new EditorHouseSessionMetadata(args.projectSession);
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
