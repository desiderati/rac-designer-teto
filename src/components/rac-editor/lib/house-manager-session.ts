import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseType} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {normalizeAvailablePilotiHeights} from '@/shared/types/piloti.ts';
import {projectSession} from '@/components/rac-editor/lib/project-session.ts';

/**
 * Mantém metadados do projeto ativo usados pelo editor de casa.
 */
export class HouseManagerSessionMetadata {
  private familyName: string = '';
  private selectedPilotiHeights: number[] = [...DEFAULT_HOUSE_PILOTI_HEIGHTS];

  reset(): void {
    this.familyName = '';
    this.selectedPilotiHeights = [...DEFAULT_HOUSE_PILOTI_HEIGHTS];
  }

  hydrateFromProjectSession(params: {
    aggregate: HouseAggregate<CanvasGroup> | null;
    persistHouse: () => void;
  }): void {
    const activeHouse = projectSession.getActiveHouse();
    const activeFamily = projectSession.getActiveFamily();

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
    projectSession.syncActiveHouseMetadata({
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
