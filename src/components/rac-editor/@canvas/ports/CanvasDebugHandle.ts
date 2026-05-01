import type {CanvasDebugPort} from '@/components/rac-editor/@canvas/ports/CanvasDebugPort.ts';

/**
 * Capacidade de diagnóstico usada apenas por ferramentas de desenvolvimento.
 */
export interface CanvasDebugHandle {
  createDebugPort(): CanvasDebugPort | null;
}
