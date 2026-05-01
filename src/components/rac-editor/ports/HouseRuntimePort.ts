import type {
  HouseRuntimeGroupRef,
  HouseVisualRuntimePort,
} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';

/**
 * Porta de ciclo de vida entre o estado lógico da casa e o runtime visual.
 *
 * A implementação atual inicializa o runtime da casa com uma porta de canvas,
 * mas consumidores de alto nível só conhecem esta capacidade de bootstrap.
 */
export interface HouseRuntimePort<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  /** Inicializa o runtime da casa com as capacidades mínimas do canvas. */
  initializeCanvas(canvasPort: HouseVisualRuntimePort<TGroup>): void;
}
