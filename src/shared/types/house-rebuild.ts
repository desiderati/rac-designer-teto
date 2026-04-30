import {
  HouseRuntimeViewInstance,
  HouseViews,
  HouseViewType
} from '@/shared/types/house.ts';

export interface RebuildGroupMetadata {
  houseInstanceId?: string;
  houseViewType?: string;
  houseView?: string;
  houseSide?: string;
  isFlippedHorizontally?: boolean;
  isRightSide?: boolean;
}

export interface RebuildViewSource<TGroup> {
  group: TGroup;
  metadata: RebuildGroupMetadata;
}

export type RebuildViews = HouseViews;

export interface RebuildNormalizedViewInstance<TGroup> extends HouseRuntimeViewInstance<TGroup> {
  viewType: HouseViewType;
}

export interface RebuildViewsResult<TGroup> {
  views: RebuildViews;
  normalizedItems: RebuildNormalizedViewInstance<TGroup>[];
}
