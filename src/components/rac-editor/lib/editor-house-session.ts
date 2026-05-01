import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {normalizeAvailablePilotiHeights} from '@/shared/types/piloti.ts';
import type {ProjectSessionPort} from '@/components/rac-editor/lib/project-session.ts';

/**
 * Mantém metadados do projeto ativo usados pelo editor de casa.
 */
export class EditorHouseSessionMetadata {
  private familyName: string = '';
  private selectedPilotiHeights: number[] = [...DEFAULT_HOUSE_PILOTI_HEIGHTS];

  constructor(private readonly projectSession: ProjectSessionPort) {
  }

  reset(): void {
    this.familyName = '';
    this.selectedPilotiHeights = [...DEFAULT_HOUSE_PILOTI_HEIGHTS];
  }

  hydrateFromProjectSession(params: {
    aggregate: HouseAggregate | null;
    persistHouse: () => void;
  }): void {
    const activeHouse = this.projectSession.getActiveHouse();
    const activeFamily = this.projectSession.getActiveFamily();

    this.familyName = activeFamily.name;
    this.selectedPilotiHeights = normalizeAvailablePilotiHeights(
      activeHouse.designSettings.selectedPilotiHeights,
    );

    if (!params.aggregate) return;

    params.aggregate.setHouseType(activeHouse.houseType);
    params.aggregate.setTerrainType(activeHouse.terrainType);
    params.persistHouse();
  }

  syncProjectSession(params: {
    houseType: HouseType;
    terrainType: number;
  }): void {
    this.projectSession.syncActiveHouseMetadata({
      houseType: params.houseType,
      terrainType: params.terrainType,
      familyName: this.familyName,
      selectedPilotiHeights: this.selectedPilotiHeights,
    });
  }

  getFamilyName(): string {
    return this.familyName;
  }

  setFamilyName(name: string): void {
    this.familyName = name;
  }

  getSelectedPilotiHeights(): readonly number[] {
    return this.selectedPilotiHeights;
  }

  setSelectedPilotiHeights(heights: readonly number[]): void {
    this.selectedPilotiHeights = normalizeAvailablePilotiHeights(heights);
  }
}
