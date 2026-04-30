import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {refreshTopDoorMarkersInViews} from '@/components/rac-editor/@canvas/lib/house-top-view-door-marker.ts';
import {refreshAutoStairsInViews} from '@/components/rac-editor/@canvas/lib/house-auto-stairs.ts';
import {refreshAutoContraventamentoInAllViews} from '@/components/rac-editor/@canvas/lib/house-auto-contraventamento.ts';
import {getSettings} from '@/infra/settings.ts';
import {collectElevationViewInstances} from '@/components/rac-editor/lib/house-manager-terrain.ts';

function renderWhenChanged(changed: boolean, requestRender: () => void): void {
  if (changed) {
    requestRender();
  }
}

export function refreshTopDoorMarkers(params: {
  house: HouseRuntimeSnapshot | null;
  requestRender: () => void;
}): void {
  if (!params.house) return;

  renderWhenChanged(
    refreshTopDoorMarkersInViews({
      houseType: params.house.houseType,
      sideMappings: params.house.sideMappings,
      topViews: params.house.views.top,
    }),
    params.requestRender,
  );
}

export function refreshAutoStairs(params: {
  house: HouseRuntimeSnapshot | null;
  requestRender: () => void;
}): void {
  if (!params.house) return;

  renderWhenChanged(
    refreshAutoStairsInViews({
      houseType: params.house.houseType,
      sideMappings: params.house.sideMappings,
      pilotis: params.house.pilotis,
      topView: params.house.views.top,
      elevationViews: collectElevationViewInstances(params.house),
      showStairsOnTopView: getSettings().showStairsOnTopView,
    }),
    params.requestRender,
  );
}

export function refreshAutoContraventamento(params: {
  house: HouseRuntimeSnapshot | null;
  requestRender: () => void;
}): void {
  if (!params.house) return;

  renderWhenChanged(
    refreshAutoContraventamentoInAllViews({
      pilotis: params.house.pilotis,
      topViews: params.house.views.top,
      elevationViews: collectElevationViewInstances(params.house),
    }),
    params.requestRender,
  );
}
