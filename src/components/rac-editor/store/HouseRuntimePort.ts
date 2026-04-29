import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';

/**
 * Porta de ciclo de vida do runtime lógico da casa.
 */
export interface HouseRuntimePort {
  initializeCanvas(canvasPort: HouseManagerCanvasPort): void;
}
