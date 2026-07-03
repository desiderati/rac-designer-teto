import {HouseSide, HouseSideMapping, HouseType, HouseViewType} from '@/shared/types/house.ts';

export interface ViewGroupMetadataPatch<TView extends string, TSide extends string> {
  houseViewType: TView;
  houseInstanceId: string;
  houseSide: TSide | undefined;
}

export interface ViewGroupControlsVisibilityPatch extends Record<string, boolean> {
  mt: false;
  mb: false;
  ml: false;
  mr: false;
}

export interface ViewGroupRemovalHints<TView extends string> {
  viewType?: TView;
  instanceId?: string;
}

export function createViewGroupMetadataPatch<TView extends string, TSide extends string>(params: {
  viewType: TView;
  instanceId: string;
  side?: TSide;
}): ViewGroupMetadataPatch<TView, TSide> {
  return {
    houseViewType: params.viewType,
    houseInstanceId: params.instanceId,
    houseSide: params.side,
  };
}

export function createViewGroupControlsVisibilityPatch(): ViewGroupControlsVisibilityPatch {
  return {mt: false, mb: false, ml: false, mr: false};
}

export function extractViewGroupRemovalHints<TView extends string>(params: {
  houseViewType?: unknown;
  houseInstanceId?: unknown;
}): ViewGroupRemovalHints<TView> {
  return {
    viewType: typeof params.houseViewType === 'string' ? (params.houseViewType as TView) : undefined,
    instanceId: typeof params.houseInstanceId === 'string' ? params.houseInstanceId : undefined,
  };
}

export function getViewLabelForHouseType(viewType: HouseViewType, houseType: HouseType): string {
  switch (viewType) {
    case 'top':
      return 'Planta';

    case 'front':
      return 'Frontal';

    case 'back':
      return houseType === 'tipo3' ? 'Lateral' : 'Posterior';

    case 'side1':
      return houseType === 'tipo6' ? 'Lateral' : 'Quadrado Fechado';

    case 'side2':
      return 'Quadrado Aberto';
  }
}

export function getElevationViewLabelForHouseType(params: {
  houseType: HouseType;
  side?: HouseSide;
  sideMappings?: HouseSideMapping;
  viewType: Exclude<HouseViewType, 'top'>;
}): string {
  if (params.houseType === 'tipo6') {
    if (params.viewType === 'front') return 'Frontal';
    if (params.viewType === 'back') return 'Posterior';
    if (params.viewType === 'side1') {
      return getRelativeLateralLabel({
        primaryViewType: 'front',
        side: params.side,
        sideMappings: params.sideMappings,
      });
    }
  }

  if (params.houseType === 'tipo3') {
    if (params.viewType === 'side2') return 'Quadrado Aberto';
    if (params.viewType === 'side1') return 'Quadrado Fechado';
    if (params.viewType === 'back') {
      return getRelativeLateralLabel({
        primaryViewType: 'side2',
        side: params.side,
        sideMappings: params.sideMappings,
      });
    }
  }

  return getViewLabelForHouseType(params.viewType, params.houseType);
}

const RELATIVE_LATERAL_SIDES_BY_PRIMARY_SIDE: Record<HouseSide, {
  left: HouseSide;
  right: HouseSide;
}> = {
  top: {left: 'right', right: 'left'},
  bottom: {left: 'left', right: 'right'},
  left: {left: 'top', right: 'bottom'},
  right: {left: 'bottom', right: 'top'},
};

function getRelativeLateralLabel(params: {
  primaryViewType: HouseViewType;
  side?: HouseSide;
  sideMappings?: HouseSideMapping;
}): string {
  if (!params.side || !params.sideMappings) return getLateralLabel(params.side);

  const primarySide =
    (Object.keys(params.sideMappings) as HouseSide[])
      .find((side) => params.sideMappings?.[side] === params.primaryViewType);
  if (!primarySide) return getLateralLabel(params.side);

  const relativeSides = RELATIVE_LATERAL_SIDES_BY_PRIMARY_SIDE[primarySide];
  if (params.side === relativeSides.left) return 'Lateral Esquerda';
  if (params.side === relativeSides.right) return 'Lateral Direita';
  return 'Lateral';
}

function getLateralLabel(side?: HouseSide): string {
  if (side === 'left' || side === 'top') return 'Lateral Esquerda';
  if (side === 'right' || side === 'bottom') return 'Lateral Direita';
  return 'Lateral';
}
