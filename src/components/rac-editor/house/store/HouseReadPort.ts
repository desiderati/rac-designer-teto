import type {
  HousePiloti,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';

export interface HouseViewCountSnapshot {
  /** Quantidade de vistas já registradas para o tipo solicitado. */
  current: number;
  /** Limite permitido para o tipo de vista no modelo de casa atual. */
  max: number;
}

/**
 * Porta de leitura do estado lógico da casa para a UI do editor.
 *
 * Componentes e hooks de apresentação devem depender desta leitura
 * serializável em vez de consultar diretamente o manager de infraestrutura.
 * O contrato não expõe objetos do runtime gráfico; quando a implementação
 * atual ainda depende do `houseManager`, essa dependência fica isolada no adapter.
 */
export interface HouseReadPort {
  /** Nome da família em edição. */
  getFamilyName(): string;
  /** Tipo de casa ativo, ou `null` quando nenhuma casa foi selecionada. */
  getCurrentHouseType(): HouseType;
  /** Retorna a contagem atual e o limite para uma vista da casa. */
  getViewCount(viewType: HouseViewType): HouseViewCountSnapshot;
  /** Snapshot serializável dos pilotis conhecidos pela casa atual. */
  getPilotis(): Record<string, HousePiloti> | undefined;
  /** Alturas de piloti disponíveis para a família selecionada. */
  getSelectedPilotiHeights(): readonly number[];
  /** Tipo de terreno ativo, já normalizado pela regra de domínio/infra atual. */
  getTerrainType(): number;
}
