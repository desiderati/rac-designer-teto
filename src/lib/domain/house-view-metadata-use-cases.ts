export interface ViewGroupMetadataPatch<TView extends string, TSide extends string> {
  houseViewType: TView;
  houseInstanceId: string;
  houseSide: TSide | undefined;
}

export interface ViewGroupControlsVisibilityPatch {
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
    viewType: typeof params.houseViewType === "string" ? (params.houseViewType as TView) : undefined,
    instanceId: typeof params.houseInstanceId === "string" ? params.houseInstanceId : undefined,
  };
}
