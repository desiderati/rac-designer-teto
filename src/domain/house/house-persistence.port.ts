import type {HouseState} from '@/shared/types/house.ts';

export interface HousePersistencePort {
  /** Carrega o estado persistido da casa, ou `null` quando não houver estado. */
  load(): HouseState | null;

  /** Persiste o estado atual da casa, ou limpa a persistência quando recebe `null`. */
  save(state: HouseState | null): void;
}
