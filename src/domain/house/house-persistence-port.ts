import type {HouseState} from '@/shared/types/house.ts';

export interface HousePersistencePort<TGroup = unknown> {
  load(): HouseState<TGroup> | null;

  save(state: HouseState<TGroup> | null): void;
}
