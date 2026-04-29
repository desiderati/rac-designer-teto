import type {
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';

/**
 * Dados necessários para iniciar ou atualizar a configuração humana da casa.
 */
export interface HouseSetup {
  /** Nome da família associado ao projeto em edição. */
  familyName: string;
  /** Alturas de piloti habilitadas para essa família. */
  selectedPilotiHeights: readonly number[];
}

/**
 * Par de grupos usado durante a transição em que vistas ainda carregam uma
 * referência visual de runtime.
 *
 * `TGroup` deve continuar genérico para impedir que a UI dependa de Fabric.
 */
export interface HouseStackedViewGroups<TGroup = unknown> {
  topGroup: TGroup | null;
  viewGroup: TGroup | null;
}

/**
 * Comandos de configuração da família e dos parâmetros iniciais da casa.
 */
export interface HouseSetupWritePort {
  applyHouseSetup(setup: HouseSetup): void;
  renameFamily(name: string): void;
}

/**
 * Comandos de ciclo de vida da casa no editor.
 */
export interface HouseLifecycleWritePort {
  setHouseType(type: HouseType): void;
  refreshAutoStairsForCurrentSettings(): void;
  resetHouse(): void;
  rebuildHouseFromCanvas(): void;
  insert3DSnapshotOnCanvas(dataUrl: string): Promise<boolean>;
}

/**
 * Comandos ligados ao terreno da casa.
 */
export interface HouseTerrainWritePort {
  setTerrainType(terrainType: number): number;
}

/**
 * Consultas necessárias para decidir se uma vista pode ser criada, removida ou
 * empilhada no canvas.
 *
 * Elas permanecem aqui por enquanto porque o fluxo de criação de vistas ainda
 * é uma fatia vertical entre UI, estado lógico e runtime visual.
 */
export interface HouseViewReadPort<TGroup = unknown> {
  canDeleteTopView(): boolean;
  isViewAtLimit(viewType: HouseViewType): boolean;
  getCurrentHouseType(): HouseType;
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];
  getAvailableSides(viewType: HouseViewType): HouseSide[];
  hasPreAssignedSides(): boolean;
  getStackedViewGroups(viewType: HouseViewType, side?: HouseSide): HouseStackedViewGroups<TGroup>;
}

/**
 * Comandos que alteram o registro lógico de vistas da casa.
 */
export interface HouseViewWritePort<TGroup = unknown> {
  removeView(group: TGroup): void;
  registerView(viewType: HouseViewType, group: TGroup, side?: HouseSide): void;
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
}

/**
 * Comandos ligados aos pilotis da casa.
 */
export interface HousePilotiWritePort {
  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void;
  calculateAndApplyRecommendedHeights(): void;
}

/**
 * Porta agregadora de escrita para os fluxos de casa usados pelo editor.
 *
 * Esta porta ainda pode ser implementada por adapters de infraestrutura, mas a
 * UI passa a depender de comandos explícitos em vez de conhecer diretamente o
 * `houseManager`.
 *
 * A divisão em subinterfaces é deliberada: ela deixa claro quais métodos são
 * comandos, quais leituras ainda vivem junto do fluxo de vistas e quais partes
 * devem migrar depois para use cases ou read ports mais específicos.
 */
export interface HouseWritePort<TGroup = unknown>
  extends HouseSetupWritePort,
    HouseLifecycleWritePort,
    HouseTerrainWritePort,
    HouseViewReadPort<TGroup>,
    HouseViewWritePort<TGroup>,
    HousePilotiWritePort {
}
