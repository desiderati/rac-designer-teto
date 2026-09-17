import type {EditorSelection} from './editor-selection.ts';

export type {
  EditorObjectId,
  EditorPilotiId,
  EditorScreenPoint,
  EditorViewId,
} from './editor-ids.ts';
export type {
  EditorContraventamentoSelection,
  EditorContraventamentoSide,
  EditorHouseViewKind,
  EditorLinearSelection,
  EditorLinearSelectionKind,
  EditorPilotiSelection,
  EditorSelection,
  EditorSelectionKind,
  EditorTerrainSelection,
  EditorWallSelection,
} from './editor-selection.ts';
export {EDITOR_SELECTION_KINDS, isEditorSelection} from './editor-selection.ts';
export type {EditorContraventamentoDraft} from './editor-contraventamento.ts';
export {isEditorContraventamentoDraft} from './editor-contraventamento.ts';
export type {EditorViewRef} from './editor-view.ts';
export {isEditorViewRef} from './editor-view.ts';

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
