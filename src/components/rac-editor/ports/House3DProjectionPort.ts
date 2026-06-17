import type {
  HousePiloti,
  HouseSide,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import type {ContraventamentoOrientation} from '@/shared/types/contraventamento.ts';

/**
 * Projeção serializável de um contraventamento da planta baixa para o viewer 3D.
 */
export interface House3DContraventamentoProjection {
  /** Identificador estável do contraventamento no canvas lógico. */
  id?: string;

  /** Orientação lógica do contraventamento. Ausente equivale a `vertical`. */
  orientation?: ContraventamentoOrientation | string;

  /** Coluna estrutural onde o contraventamento está ancorado. */
  col?: unknown;

  /** Linha estrutural onde o contraventamento horizontal está ancorado. */
  row?: unknown;

  /** Linha inicial informada pela representação 2D. */
  startRow?: unknown;

  /** Linha final informada pela representação 2D. */
  endRow?: unknown;

  /** Coluna inicial informada pela representação horizontal 2D. */
  startCol?: unknown;

  /** Coluna final informada pela representação horizontal 2D. */
  endCol?: unknown;

  /** Lado visual do contraventamento na coluna. */
  side?: ContraventamentoSide | string;

  /** Piloti usado como âncora da diagonal. */
  anchorPilotiId?: string;
}

/**
 * Projeção serializável da vista superior para consumo do viewer 3D.
 */
export interface House3DTopViewProjection {
  /** Contraventamentos presentes na planta baixa. */
  contraventamentos: House3DContraventamentoProjection[];
}

/**
 * Projeção serializável de uma escada automática encontrada em elevação.
 */
export interface House3DStairsProjection {
  /** Largura visual da escada em pixels de canvas. */
  width: number;

  /** Posição esquerda da escada no grupo de elevação. */
  left: number;

  /** Altura física da escada em metros. */
  heightMts: number;

  /** Quantidade de degraus calculada no canvas. */
  stepCount: number;
}

/**
 * Projeção serializável de uma elevação necessária para inferir a escada 3D.
 */
export interface House3DElevationViewProjection {
  /** Tipo lógico da vista de elevação. */
  viewType: HouseViewType;

  /** Identificador da instância de vista. */
  instanceId: string;

  /** Metadado visual de orientação herdado do grupo de canvas. */
  houseView?: string;

  /** Largura visual do grupo de elevação. */
  groupWidth: number;

  /** Largura do corpo da casa, quando presente na elevação. */
  bodyWidth?: number;

  /** Largura da porta, usada como fallback de escala. */
  doorWidth?: number;

  /** Escada automática encontrada na elevação. */
  stairs?: House3DStairsProjection;
}

/**
 * Snapshot serializável da casa para renderização do viewer 3D.
 */
export interface House3DProjection {
  /** Tipo de casa ativo. */
  houseType: HouseType;

  /** Pilotis conhecidos no estado lógico da casa. */
  pilotis: Record<string, HousePiloti>;

  /** Mapeamento entre lados do canvas e tipos de vista. */
  sideMappings: Record<HouseSide, HouseViewType | null>;

  /** Indica se existe ao menos uma vista registrada. */
  hasHouseViews: boolean;

  /** Vista superior projetada para leitura do viewer, quando existir. */
  topView: House3DTopViewProjection | null;

  /** Elevações projetadas para leitura do viewer. */
  elevationViews: House3DElevationViewProjection[];
}

/**
 * Porta que entrega ao viewer 3D uma projeção sem objetos de runtime do canvas.
 */
export interface House3DProjectionPort {
  /** Retorna a projeção 3D atual da casa, ou `null` quando não há casa ativa. */
  getProjection(): House3DProjection | null;
}
