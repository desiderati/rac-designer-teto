import type {HousePersistencePort} from '@/domain/house/house-persistence.port.ts';
import type {HouseState} from '@/shared/types/house.ts';

export class InMemoryHousePersistenceAdapter<TGroup = unknown> implements HousePersistencePort<TGroup> {
  private state: HouseState<TGroup> | null;

  constructor(initialState: HouseState<TGroup> | null = null) {
    this.state = initialState;
  }

  load(): HouseState<TGroup> | null {
    return this.state;
  }

  save(state: HouseState<TGroup> | null): void {
    this.state = state;
  }
}
