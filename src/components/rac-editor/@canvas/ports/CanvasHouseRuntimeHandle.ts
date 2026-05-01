import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';

/**
 * Capacidade de inicializar o runtime visual da casa a partir do canvas atual.
 */
export interface CanvasHouseRuntimeHandle {
  createCanvasHouseRuntimePort(): CanvasHouseRuntimePort | null;
}
