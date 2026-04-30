import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/canvas/ports/CanvasHouseRuntimePort.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

export interface HouseManagerCanvasRebuildInput {
  canvasGroups: CanvasGroup[];
  pilotisFromCanvas: Record<string, HousePiloti>;
  terrainTypeFromCanvas: number;
}

export class HouseManagerCanvasRuntime {
  private canvas: CanvasHouseRuntimePort | null = null;

  initialize(canvas: CanvasHouseRuntimePort): void {
    this.canvas = canvas;
  }

  includesGroup(group: CanvasGroup): boolean {
    return this.canvas?.includesGroup(group) ?? false;
  }

  requestRender(): void {
    this.canvas?.requestRenderAll();
  }

  createRebuildInput(params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }): HouseManagerCanvasRebuildInput | null {
    if (!this.canvas) return null;

    return {
      canvasGroups: this.canvas.getHouseGroups(),
      pilotisFromCanvas: this.canvas.readPilotis(params.currentPilotis),
      terrainTypeFromCanvas: this.canvas.resolveTerrainType(params.fallbackTerrainType),
    };
  }
}
