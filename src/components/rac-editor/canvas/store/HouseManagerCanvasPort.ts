import type {HousePiloti} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';

/**
 * Porta mínima de canvas exigida pelo coordenador da casa.
 */
export interface HouseManagerCanvasPort {
  requestRenderAll(): void;
  includesGroup(group: CanvasGroup): boolean;
  getHouseGroups(): CanvasGroup[];
  readPilotis(currentPilotis: Record<string, HousePiloti>): Record<string, HousePiloti>;
  resolveTerrainType(fallbackTerrainType: number): number;
  insert3DSnapshot(dataUrl: string): Promise<boolean>;
}
