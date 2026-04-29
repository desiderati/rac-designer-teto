import type {EditorSelection} from '@/components/rac-editor/canvas/types.ts';
import type {EditorState} from '@/components/rac-editor/store/EditorStateStore.ts';

/**
 * Porta de renderização do canvas.
 *
 * A porta descreve capacidades do editor, não métodos do Fabric. O adapter
 * concreto decide como projetar o estado no runtime gráfico.
 */
export interface CanvasRenderPort {
  renderEditorState(state: EditorState): void;
  renderSelection(selection: EditorSelection | null): void;
}
