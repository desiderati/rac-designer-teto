import {HouseSide, HouseTypeExcludeNull, HouseViewType} from '@/shared/types/house.ts';
import {getHouseViewStrategy} from '@/components/lib/canvas';
import {Canvas as FabricCanvas, Group} from 'fabric';

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

export function getViewLabelForHouseType(viewType: HouseViewType, houseType: HouseTypeExcludeNull | null): string {
  switch (viewType) {
    case 'top':
      return 'Planta';

    case 'front':
      return 'Frontal';

    case 'back':
      return houseType === 'tipo3' ? 'Lateral' : 'Traseira';

    case 'side1':
      return 'Quadrado Fechado';

    case 'side2':
      return 'Quadrado Aberto';
  }
}

export function createHouseGroupForView(params: {
  canvas: FabricCanvas;
  viewType: HouseViewType;
  side?: HouseSide;
}): Group {
  return getHouseViewStrategy(params.viewType).create(params.canvas, {side: params.side});
}
