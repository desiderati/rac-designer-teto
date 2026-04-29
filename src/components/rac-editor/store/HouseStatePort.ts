import type {CanvasGroup} from '@/components/rac-editor/lib/canvas';
import type {HouseState} from '@/shared/types/house.ts';

/**
 * Porta de leitura reativa do estado lógico da casa.
 */
export interface HouseStatePort<TGroup = CanvasGroup> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): HouseState<TGroup> | null;
}
