import type {HousePersistencePort} from '@/domain/house/house-persistence.port.ts';
import type {HouseState} from '@/shared/types/house.ts';

export class InMemoryHousePersistenceAdapter implements HousePersistencePort {
  private state: HouseState | null;

  constructor(initialState: HouseState | null = null) {
    this.state = initialState;
  }

  load(): HouseState | null {
    return this.state;
  }

  save(state: HouseState | null): void {
    this.state = state;
  }
}
