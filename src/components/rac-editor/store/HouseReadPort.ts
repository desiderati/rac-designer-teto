import type {
  HousePiloti,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';

export interface HouseViewCountSnapshot {
  current: number;
  max: number;
}

/**
 * Porta de leitura do estado lógico da casa para a UI do editor.
 *
 * Componentes e hooks de apresentação devem depender desta leitura
 * serializável em vez de consultar diretamente o manager de infraestrutura.
 */
export interface HouseReadPort {
  getCurrentHouseType(): HouseType;
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getTerrainType(): number;
  getPilotis(): Record<string, HousePiloti> | undefined;
  getViewCount(viewType: HouseViewType): HouseViewCountSnapshot;
}
