import type {CanvasGroup, CanvasObject, ElementStrategyKey} from '@/components/rac-editor/@canvas/lib';
import type {HousePiloti, HouseSide, HouseViewInstanceId, HouseViewType} from '@/shared/types/house.ts';

/**
 * Capacidade de criar e posicionar objetos visuais no canvas.
 */
export interface CanvasObjectCreationHandle {
  /** Cria um objeto visual de elemento sem adicioná-lo automaticamente ao canvas. */
  createElementObject(kind: ElementStrategyKey): CanvasObject | null;

  /** Cria o grupo visual de uma vista da casa com a identidade lógica já definida. */
  createHouseViewGroup(payload: {
    viewType: HouseViewType;
    instanceId: HouseViewInstanceId;
    side?: HouseSide;
    pilotis: Record<string, HousePiloti>;
    terrainType: number;
    showAllElevationNivelLabels?: boolean;
  }): CanvasGroup | null;

  /** Adiciona um objeto visual no centro visível do canvas. */
  addObjectAtVisibleCenter(object: CanvasObject): boolean;
}
