import type {
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';

export interface HouseViewCountSnapshot {
  /** Quantidade de vistas já registradas para o tipo solicitado. */
  current: number;

  /** Limite permitido para o tipo de vista no modelo de casa atual. */
  max: number;
}

/**
 * Par de instâncias usado para posicionar uma planta e uma vista elevada no canvas.
 */
export interface HouseViewRegistrationRequest {
  /** Tipo da vista que será registrada no estado lógico da casa. */
  viewType: HouseViewType;

  /** Identidade lógica já atribuída à instância de vista. */
  instanceId: HouseViewInstanceId;

  /** Lado da casa associado à vista, quando aplicável. */
  side?: HouseSide;
}

export interface HouseViewRegistration {
  /** Tipo da vista efetivamente registrada. */
  viewType: HouseViewType;

  /** Identidade lógica da instância registrada. */
  instanceId: HouseViewInstanceId;

  /** Lado da casa associado à vista, quando aplicável. */
  side?: HouseSide;

  /** Indica se a vista registrada é a planta baixa. */
  registeredTopView: boolean;
}

/**
 * Consultas necessárias para decidir se uma vista pode ser criada, removida ou
 * empilhada no canvas.
 */
export interface HouseViewReadPort {
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

}

/**
 * Comandos que alteram o registro lógico de vistas da casa.
 */
export interface HouseViewWritePort {
  /** Remove do estado lógico a vista associada à identidade informada. */
  removeView(instanceId: HouseViewInstanceId): void;

  /** Registra uma vista criada no canvas no estado lógico da casa. */
  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null;

  /** Pré-atribui automaticamente todos os lados a partir da vista inicial. */
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
}
