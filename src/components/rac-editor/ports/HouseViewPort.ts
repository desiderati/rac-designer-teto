import type {
  HousePreAssignedSideDisplay,
  HouseSide,
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
 * Par de grupos usado enquanto as vistas da casa ainda carregam uma referência
 * visual de runtime.
 *
 * `TGroup` deve permanecer genérico para impedir que os Ports dependam de
 * Fabric ou de outra implementação visual concreta.
 */
export interface HouseStackedViewGroups<TGroup = unknown> {
  /** Grupo da planta baixa usada como referência para empilhamento. */
  topGroup: TGroup | null;

  /** Grupo da vista elevada correspondente ao tipo/lado solicitado. */
  viewGroup: TGroup | null;
}

/**
 * Consultas necessárias para decidir se uma vista pode ser criada, removida ou
 * empilhada no canvas.
 */
export interface HouseViewReadPort<TGroup = unknown> {
  /** Retorna a contagem atual e o limite para uma vista da casa. */
  getViewCount(viewType: HouseViewType): HouseViewCountSnapshot;

  /** Retorna se a vista superior pode ser removida no estado atual da casa. */
  canDeleteTopView(): boolean;

  /** Retorna se o tipo de vista informado já atingiu o limite permitido. */
  isViewAtLimit(viewType: HouseViewType): boolean;

  /** Retorna o tipo de casa atualmente selecionado. */
  getCurrentHouseType(): HouseType;

  /** Retorna os lados pré-atribuídos que ainda orientam a criação da vista. */
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];

  /** Retorna os lados disponíveis para criar uma nova vista do tipo informado. */
  getAvailableSides(viewType: HouseViewType): HouseSide[];

  /** Retorna se ainda existem lados pré-atribuídos pendentes no fluxo atual. */
  hasPreAssignedSides(): boolean;

  /** Retorna os grupos usados para empilhar planta e vista elevada no canvas. */
  getStackedViewGroups(viewType: HouseViewType, side?: HouseSide): HouseStackedViewGroups<TGroup>;
}

/**
 * Comandos que alteram o registro lógico de vistas da casa.
 */
export interface HouseViewWritePort<TGroup = unknown> {
  /** Remove do estado lógico a vista associada ao grupo informado. */
  removeView(group: TGroup): void;

  /** Registra uma vista criada no canvas no estado lógico da casa. */
  registerView(viewType: HouseViewType, group: TGroup, side?: HouseSide): void;

  /** Pré-atribui automaticamente todos os lados a partir da vista inicial. */
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
}
