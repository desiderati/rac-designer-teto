import type {HouseState} from '@/shared/types/house.ts';

/**
 * Porta de leitura reativa do estado lógico da casa.
 *
 * Este contrato não expõe grupos visuais nem detalhes do canvas. Fluxos que
 * precisam do snapshot com runtime devem usar `HouseRuntimeSnapshotPort`.
 */
export interface HouseStatePort {
  /** Assina mudanças no estado lógico da casa. */
  subscribe(listener: () => void): () => void;

  /** Retorna o estado lógico atual da casa, quando existir. */
  getStateSnapshot(): HouseState | null;
}
