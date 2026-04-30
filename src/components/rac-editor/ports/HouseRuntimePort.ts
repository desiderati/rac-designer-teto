import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';

/**
 * Porta de ciclo de vida entre o estado lógico da casa e o runtime visual.
 *
 * A implementação atual inicializa o `houseManager` com uma porta de canvas,
 * mas consumidores de alto nível só conhecem esta capacidade de bootstrap.
 */
export interface HouseRuntimePort {
  /** Inicializa o runtime da casa com as capacidades mínimas do canvas. */
  initializeCanvas(canvasPort: CanvasHouseRuntimePort): void;
}
