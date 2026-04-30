import {useMemo} from 'react';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import {useHouseSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  type Contraventamento3DData,
  parseContraventamentosFromTopView,
} from '@/components/rac-editor/viewer3d/lib/contraventamento-parser.ts';
import {
  parseStairsFromElevationViews,
  type Stairs3DData,
} from '@/components/rac-editor/viewer3d/lib/stairs-parser.ts';

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

function collectElevationViews(house: HouseState<CanvasGroup>) {
  return [
    ...house.views.front.map(
      (view) =>
        ({viewType: 'front' as HouseViewType, group: view.group})
    ),
    ...house.views.back.map(
      (view) =>
        ({viewType: 'back' as HouseViewType, group: view.group})
    ),
    ...house.views.side1.map(
      (view) =>
        ({viewType: 'side1' as HouseViewType, group: view.group})
    ),
    ...house.views.side2.map(
      (view) =>
        ({viewType: 'side2' as HouseViewType, group: view.group})
    ),
  ];
}

/**
 * Deriva o modelo de leitura usado pelo visualizador 3D a partir do snapshot da casa.
 *
 * O viewer continua sendo projeção: ele não grava estado canônico e não decide regras
 * de domínio. Ele apenas transforma o snapshot atual em dados de renderização 3D.
 */
export function buildHouse3DViewerModel(house: HouseState<CanvasGroup> | null): House3DViewerModel {
  if (!house) return createEmptyModel();

  const hasHouseViews = Object.values(house.views).some((instances) => instances.length > 0);
  if (!hasHouseViews) {
    return {
      ...createEmptyModel(),
      houseType: house.houseType,
      pilotis: {...house.pilotis},
    };
  }

  const topGroup = house.views.top[0]?.group;
  const elevationViews = collectElevationViews(house);

  return {
    houseType: house.houseType,
    hasHouseViews,
    canRenderHouse: Boolean(house.houseType && hasHouseViews),
    pilotis: {...house.pilotis},
    tipo6FrontSide: house.houseType === 'tipo6' ? resolveTipo6FrontSide(house.sideMappings) : null,
    tipo3OpenSide: house.houseType === 'tipo3' ? resolveTipo3OpenSide(house.sideMappings) : null,
    contraventamentos: parseContraventamentosFromTopView(topGroup),
    stairs: parseStairsFromElevationViews({
      houseType: house.houseType,
      sideMappings: house.sideMappings,
      elevationViews,
    }),
  };
}

export function useHouse3DViewerModel(): House3DViewerModel {
  const houseSnapshot = useHouseSnapshot();
  return useMemo(() => buildHouse3DViewerModel(houseSnapshot), [houseSnapshot]);
}
