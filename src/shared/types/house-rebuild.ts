import {HouseViewInstance, HouseViews, HouseViewType} from '@/shared/types/house.ts';

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

export type RebuildViews<TGroup> = HouseViews<TGroup>;
export type RebuildViewInstance<TGroup> = HouseViewInstance<TGroup>;

export interface RebuildNormalizedViewInstance<TGroup> extends RebuildViewInstance<TGroup> {
  viewType: HouseViewType;
}

export interface RebuildViewsResult<TGroup> {
  views: RebuildViews<TGroup>;
  normalizedItems: RebuildNormalizedViewInstance<TGroup>[];
}
