import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {EditorScreenPoint} from '@/components/rac-editor/@canvas/store/types.ts';

/**
 * Capacidade de converter coordenadas do canvas para a tela.
 */
export interface CanvasScreenProjectionHandle {
  /** Converte um ponto do canvas para coordenadas de tela. */
  getCanvasPointScreenPosition(point: EditorScreenPoint): EditorScreenPoint | null;

  /** Converte um ponto local de grupo para coordenadas de tela. */
  getGroupLocalPointScreenPosition(
    group: CanvasGroup,
    localCanvasPoint: EditorScreenPoint,
  ): EditorScreenPoint | null;
}
