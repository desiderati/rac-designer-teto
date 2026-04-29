import type {EditorSelection} from '@/components/rac-editor/canvas/types.ts';

export type CanvasSelectionHandler = (selection: EditorSelection | null) => void;

/**
 * Porta de eventos emitidos pelo canvas para o editor.
 *
 * Implementações podem usar Fabric ou outro runtime visual internamente, mas
 * consumidores recebem apenas eventos serializáveis do editor.
 */
export interface CanvasEventPort {
  onSelectionChange(handler: CanvasSelectionHandler): () => void;
}
