import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {
  refreshAutoContraventamento,
  refreshAutoStairs,
  refreshTopDoorMarkers,
} from '@/components/rac-editor/lib/house-manager-auto-effects.ts';

interface HouseManagerEffectsArgs {
  getHouse: () => HouseRuntimeSnapshot | null;
  requestCanvasRender: () => void;
}

/**
 * Coordena efeitos gráficos derivados do estado da casa.
 */
export class HouseManagerEffects {
  constructor(private readonly args: HouseManagerEffectsArgs) {
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
    });
  }

  refreshAutoContraventamento(): void {
    refreshAutoContraventamento({
      house: this.args.getHouse(),
      requestRender: () => this.args.requestCanvasRender(),
    });
  }
}
