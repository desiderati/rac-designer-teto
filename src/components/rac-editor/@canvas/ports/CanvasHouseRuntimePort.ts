import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseVisualRuntimePort} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

/**
 * Porta mínima do canvas exigida pela projeção visual da casa.
 */
export interface CanvasHouseRuntimePort extends HouseVisualRuntimePort<CanvasGroup> {
  /** Solicita uma nova renderização do canvas. */
  requestRenderAll(): void;

  /** Retorna se o grupo informado ainda pertence ao canvas atual. */
  includesGroup(group: CanvasGroup): boolean;

  /** Retorna todos os grupos de casa atualmente presentes no canvas. */
  getHouseGroups(): CanvasGroup[];
}
