import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimeViews, HouseState} from '@/shared/types/house.ts';

/**
 * Snapshot visual derivado do estado lógico da casa.
 *
 * O estado canônico guarda apenas referências lógicas de vista. Este tipo é
 * montado sob demanda para rotinas que ainda precisam operar nos grupos do
 * canvas, como efeitos visuais e sincronizações de runtime.
 */
export interface HouseRuntimeSnapshot extends Omit<HouseState, 'views'> {
  /** Vistas resolvidas para grupos concretos do canvas. */
  views: HouseRuntimeViews<CanvasGroup>;
}
