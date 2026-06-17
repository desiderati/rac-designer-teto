import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {refreshTopDoorMarkersInViews} from '@/components/rac-editor/@canvas/lib/house-top-view-door-marker.ts';
import {refreshAutoStairsInViews} from '@/components/rac-editor/@canvas/lib/house-auto-stairs.ts';
import {refreshAutoContraventamentoInAllViews} from '@/components/rac-editor/@canvas/lib/house-auto-contraventamento.ts';
import {collectElevationViewInstances} from '@/components/rac-editor/lib/editor-house-terrain.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';
import {refreshHouseViewReferenceMarkersInViews} from '@/components/rac-editor/@canvas/lib/factory/house/house-view-reference-marker.ts';

function renderWhenChanged(changed: boolean, requestRender: () => void): void {
  if (changed) {
    requestRender();
  }
}

export function refreshTopDoorMarkers(params: {
  house: HouseRuntimeSnapshot<CanvasGroup> | null;
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
  house: HouseRuntimeSnapshot<CanvasGroup> | null;
  requestRender: () => void;
  settingsPort: SettingsPort;
}): void {
  if (!params.house) return;

  renderWhenChanged(
    refreshAutoStairsInViews({
      houseType: params.house.houseType,
      sideMappings: params.house.sideMappings,
      pilotis: params.house.pilotis,
      topView: params.house.views.top,
      elevationViews: collectElevationViewInstances(params.house),
      showStairsOnTopView: params.settingsPort.getSettings().showStairsOnTopView,
    }),
    params.requestRender,
  );
}

export function refreshAutoContraventamento(params: {
  house: HouseRuntimeSnapshot<CanvasGroup> | null;
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

export function refreshHouseViewReferenceMarkers(params: {
  house: HouseRuntimeSnapshot<CanvasGroup> | null;
  requestRender: () => void;
}): void {
  if (!params.house) return;

  renderWhenChanged(
    refreshHouseViewReferenceMarkersInViews({
      houseType: params.house.houseType,
      topViews: params.house.views.top,
      elevationViews: {
        front: params.house.views.front,
        back: params.house.views.back,
        side1: params.house.views.side1,
        side2: params.house.views.side2,
      },
    }),
    params.requestRender,
  );
}

interface HouseVisualEffectsArgs {
  getHouse: () => HouseRuntimeSnapshot<CanvasGroup> | null;
  requestCanvasRender: () => void;
  settingsPort: SettingsPort;
}

/**
 * Coordena efeitos gráficos derivados do estado da casa.
 */
export class HouseVisualEffects {
  constructor(private readonly args: HouseVisualEffectsArgs) {
  }

  refreshTopDoorMarkers(): void {
    refreshTopDoorMarkers({
      house: this.args.getHouse(),
      requestRender: () => this.args.requestCanvasRender(),
    });
  }

  refreshAutoStairs(): void {
    refreshAutoStairs({
      house: this.args.getHouse(),
      requestRender: () => this.args.requestCanvasRender(),
      settingsPort: this.args.settingsPort,
    });
  }

  refreshAutoContraventamento(): void {
    refreshAutoContraventamento({
      house: this.args.getHouse(),
      requestRender: () => this.args.requestCanvasRender(),
    });
  }

  refreshHouseViewReferenceMarkers(): void {
    refreshHouseViewReferenceMarkers({
      house: this.args.getHouse(),
      requestRender: () => this.args.requestCanvasRender(),
    });
  }
}
