import type {EditorSelection} from '@/components/rac-editor/canvas/types.ts';

export interface SelectEditorTargetCommand {
  type: 'SELECT_EDITOR_TARGET';
  selection: EditorSelection | null;
}

export interface ClearEditorSelectionCommand {
  type: 'CLEAR_EDITOR_SELECTION';
}

/**
 * Intenção serializável disparada pela UI ou por bindings do canvas.
 *
 * Commands representam o que o usuário ou uma borda externa pediu; eles não
 * carregam objetos Fabric nem executam efeitos visuais diretamente.
 */
export type EditorCommand =
  | SelectEditorTargetCommand
  | ClearEditorSelectionCommand;
