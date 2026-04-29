import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseState} from '@/shared/types/house.ts';
import {
  refreshAutoContraventamento,
  refreshAutoStairs,
  refreshTopDoorMarkers,
} from '@/components/rac-editor/lib/house-manager-auto-effects.ts';

interface HouseManagerEffectsArgs {
  getHouse: () => HouseState<CanvasGroup> | null;
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
