import type {Canvas as FabricCanvas} from 'fabric';
import type {HousePiloti, HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {getHouseViewStrategy} from '@/components/rac-editor/@canvas/lib';
import {applyPilotiDataToGroup} from './piloti-visual.ts';
import {createViewGroupMetadataPatch} from '@/components/rac-editor/lib/house-view.ts';

export function createHouseGroupForView(params: {
  canvas: FabricCanvas;
  viewType: HouseViewType;
  side?: HouseSide;
}): CanvasGroup {
  return getHouseViewStrategy(params.viewType).create(params.canvas, {side: params.side});
}

/** Construção visual compartilhada pelo editor e pela prévia isolada. */
export function createConfiguredHouseViewGroup(params: {
  canvas: FabricCanvas;
  viewType: HouseViewType;
  instanceId: string;
  side?: HouseSide;
  pilotis: Record<string, HousePiloti>;
  terrainType: number;
  showAllElevationNivelLabels?: boolean;
}): CanvasGroup {
  const group = createHouseGroupForView(params);
  Object.assign(group, createViewGroupMetadataPatch<HouseViewType, HouseSide>(params));
  group.groundTerrainType = params.terrainType;
  applyPilotiDataToGroup(group, params.pilotis, {showAllElevationNivelLabels: params.showAllElevationNivelLabels});
  return group;
}
