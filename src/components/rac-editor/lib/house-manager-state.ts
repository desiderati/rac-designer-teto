import {createHouseId} from '@/components/rac-editor/lib/house-identity.ts';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HousePersistencePort} from '@/domain/house/house-persistence.port.ts';
import {InMemoryHousePersistenceAdapter} from '@/infra/persistence/in-memory-house-persistence.adapter.ts';
import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {DEFAULT_HOUSE_PILOTI, type HouseState} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

export class HouseManagerState<TGroup> {
  private readonly persistence: HousePersistencePort<TGroup> = new InMemoryHousePersistenceAdapter<TGroup>();
  private houseAggregate: HouseAggregate<TGroup> | null = null;

  constructor() {
    this.houseAggregate = HouseAggregate.fromState(this.loadInitialHouse());
  }

  get house(): HouseState<TGroup> | null {
    return this.houseAggregate?.toState() ?? null;
  }

  set house(nextHouse: HouseState<TGroup> | null) {
    this.houseAggregate = nextHouse ? HouseAggregate.fromState(nextHouse) : null;
    this.persistence.save(nextHouse);
  }

  get aggregate(): HouseAggregate<TGroup> | null {
    return this.houseAggregate;
  }

  persist(): void {
    this.persistence.save(this.houseAggregate?.toState() ?? null);
  }

  reset(): void {
    this.house = HouseAggregate.createInitialHouseState<TGroup>({
      id: createHouseId(),
      pilotiIds: getAllPilotiIds(),
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      defaultTerrainType: this.getDefaultTerrainType(),
    });
  }

  getDefaultTerrainType(): number {
    return normalizeTerrainSolidityLevel(TERRAIN_SOLIDITY.defaultLevel);
  }

  private loadInitialHouse(): HouseState<TGroup> {
    const persisted = this.persistence.load();

    if (!persisted) {
      return HouseAggregate.createInitialHouseState<TGroup>({
        id: createHouseId(),
        pilotiIds: getAllPilotiIds(),
        defaultPiloti: DEFAULT_HOUSE_PILOTI,
        defaultTerrainType: this.getDefaultTerrainType(),
      });
    }

    persisted.terrainType = normalizeTerrainSolidityLevel(
      persisted.terrainType ?? this.getDefaultTerrainType(),
    );
    return persisted;
  }
}
