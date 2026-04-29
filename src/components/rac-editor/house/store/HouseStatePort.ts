import type {HouseState} from '@/shared/types/house.ts';

/**
 * Porta de leitura reativa do estado lógico da casa.
 *
 * O tipo de referência visual é genérico para que o contrato não dependa de
 * Fabric. Durante a transição, adapters podem usar grupos de canvas concretos.
 */
export interface HouseStatePort<TGroup = unknown> {
  /** Assina mudanças no snapshot lógico da casa. */
  subscribe(listener: () => void): () => void;
  /** Retorna o snapshot lógico atual da casa, quando existir. */
  getSnapshot(): HouseState<TGroup> | null;
}
