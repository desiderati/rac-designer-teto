import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useHouseStoreVersion} from '@/components/rac-editor/lib/house-store.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {House3DProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import {
  type Contraventamento3DData,
  parseContraventamentosFromTopView,
} from '@/components/rac-editor/@viewer-3d/lib/parsers/contraventamento-parser.ts';
import {
  parseStairsFromElevationViews,
  type Stairs3DData,
} from '@/components/rac-editor/@viewer-3d/lib/parsers/stairs-parser.ts';

export interface House3DViewerModel {
  houseType: HouseType;
  hasHouseViews: boolean;
  canRenderHouse: boolean;
  pilotis: Record<string, HousePiloti>;
  tipo6FrontSide: 'top' | 'bottom' | null;
  tipo3OpenSide: 'left' | 'right' | null;
  contraventamentos: Contraventamento3DData[];
  stairs: Stairs3DData;
}

function createEmptyModel(): House3DViewerModel {
  return {
    houseType: null,
    hasHouseViews: false,
    canRenderHouse: false,
    pilotis: {},
    tipo6FrontSide: null,
    tipo3OpenSide: null,
    contraventamentos: [],
    stairs: null,
  };
}

function resolveTipo6FrontSide(sideMappings: Record<HouseSide, HouseViewType | null>): 'top' | 'bottom' | null {
  if (sideMappings.top === 'front') return 'top';
  if (sideMappings.bottom === 'front') return 'bottom';
  return null;
}

function resolveTipo3OpenSide(sideMappings: Record<HouseSide, HouseViewType | null>): 'left' | 'right' | null {
  // O eixo lateral da cena 3D é espelhado em relação à atribuição 2D.
  // Mantém o "quadrado aberto" (side2) no mesmo lado semântico selecionado no canvas.
  if (sideMappings.left === 'side2') return 'right';
  if (sideMappings.right === 'side2') return 'left';
  return null;
}

/**
 * Deriva o modelo de leitura usado pelo visualizador 3D a partir da projeção da casa.
 *
 * O viewer continua sendo projeção: ele não grava estado canônico e não decide
 * regras de domínio. Ele apenas transforma o snapshot projetado em dados de cena.
 */
export function buildHouse3DViewerModel(projection: House3DProjection | null): House3DViewerModel {
  if (!projection) return createEmptyModel();

  if (!projection.hasHouseViews) {
    return {
      ...createEmptyModel(),
      houseType: projection.houseType,
      pilotis: {...projection.pilotis},
    };
  }

  return {
    houseType: projection.houseType,
    hasHouseViews: projection.hasHouseViews,
    canRenderHouse: Boolean(projection.houseType && projection.hasHouseViews),
    pilotis: {...projection.pilotis},
    tipo6FrontSide: projection.houseType === 'tipo6' ? resolveTipo6FrontSide(projection.sideMappings) : null,
    tipo3OpenSide: projection.houseType === 'tipo3' ? resolveTipo3OpenSide(projection.sideMappings) : null,
    contraventamentos: parseContraventamentosFromTopView(projection.topView),
    stairs: parseStairsFromElevationViews({
      houseType: projection.houseType,
      sideMappings: projection.sideMappings,
      elevationViews: projection.elevationViews,
    }),
  };
}

export function useHouse3DViewerModel(): House3DViewerModel {
  const {house3DProjectionPort} = useEditorPorts();
  useHouseStoreVersion();
  return buildHouse3DViewerModel(house3DProjectionPort.getProjection());
}
