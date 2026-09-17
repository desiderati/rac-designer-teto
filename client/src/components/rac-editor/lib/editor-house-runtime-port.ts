/**
 * Referência mínima que o runtime da casa precisa conhecer sobre um grupo visual.
 */
export interface HouseRuntimeGroupRef {
  /** Identificador lógico da instância de vista associada ao grupo, quando existir. */
  houseInstanceId?: unknown;
}

/**
 * Porta visual mínima exigida pelo runtime da casa.
 */
export interface HouseVisualRuntimePort<TGroup extends HouseRuntimeGroupRef> {
  /** Solicita uma nova renderização do runtime visual. */
  requestRenderAll(): void;

  /** Retorna se o grupo informado ainda pertence ao runtime visual atual. */
  includesGroup(group: TGroup): boolean;

  /** Retorna os grupos de casa atualmente presentes no runtime visual. */
  getHouseGroups(): TGroup[];
}
