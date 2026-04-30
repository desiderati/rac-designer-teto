import type {HousePiloti} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';

/**
 * Porta mínima do canvas exigida pela projeção visual da casa.
 */
export interface CanvasHouseRuntimePort {
  /** Solicita uma nova renderização do canvas. */
  requestRenderAll(): void;

  /** Retorna se o grupo informado ainda pertence ao canvas atual. */
  includesGroup(group: CanvasGroup): boolean;

  /** Retorna todos os grupos de casa atualmente presentes no canvas. */
  getHouseGroups(): CanvasGroup[];

  /** Lê os pilotis projetados no canvas e combina com o estado lógico atual. */
  readPilotis(currentPilotis: Record<string, HousePiloti>): Record<string, HousePiloti>;

  /** Resolve o tipo de terreno a partir das vistas no canvas ou usa o fallback. */
  resolveTerrainType(fallbackTerrainType: number): number;
}
