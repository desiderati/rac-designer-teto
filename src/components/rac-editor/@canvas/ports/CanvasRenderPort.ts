import type {EditorSelection} from '@/components/rac-editor/store/types.ts';
import type {EditorState} from '@/components/rac-editor/store/editor-state-store.ts';

/**
 * Porta de renderização do canvas.
 *
 * A porta descreve capacidades do editor, não métodos do Fabric. O adapter
 * concreto decide como projetar o estado no runtime gráfico.
 */
export interface CanvasRenderPort {
  /** Projeta o estado serializável do editor no runtime visual do canvas. */
  renderEditorState(state: EditorState): void;

  /** Projeta a seleção lógica atual no runtime visual do canvas. */
  renderSelection(selection: EditorSelection | null): void;
}
