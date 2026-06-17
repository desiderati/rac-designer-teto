import {HouseSide, HouseType, HouseViewType} from '@/shared/types/house.ts';

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
  viewType: Exclude<HouseViewType, 'top'>;
}): string {
  if (params.houseType === 'tipo6') {
    if (params.viewType === 'front') return 'Frontal';
    if (params.viewType === 'back') return 'Posterior';
    if (params.viewType === 'side1') return getLateralLabel(params.side);
  }

  if (params.houseType === 'tipo3') {
    if (params.viewType === 'side2') return 'Quadrado Aberto';
    if (params.viewType === 'side1') return 'Quadrado Fechado';
    if (params.viewType === 'back') return getLateralLabel(params.side);
  }

  return getViewLabelForHouseType(params.viewType, params.houseType);
}

function getLateralLabel(side?: HouseSide): string {
  if (side === 'left' || side === 'top') return 'Lateral Esquerda';
  if (side === 'right' || side === 'bottom') return 'Lateral Direita';
  return 'Lateral';
}
