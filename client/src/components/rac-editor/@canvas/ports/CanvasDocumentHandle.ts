import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';

/**
 * Capacidade documental do canvas para importação, exportação e imagem.
 */
export interface CanvasDocumentHandle {
  createDocumentPort(): CanvasDocumentPort | null;
}
