export type {
  EditorObjectId,
  EditorPilotiId,
  EditorScreenPoint,
  EditorViewId,
} from './types/editor-ids.ts';
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
} from './types/editor-selection.ts';
export {EDITOR_SELECTION_KINDS, isEditorSelection} from './types/editor-selection.ts';
export type {EditorContraventamentoDraft} from './types/editor-contraventamento.ts';
export {isEditorContraventamentoDraft} from './types/editor-contraventamento.ts';
export type {EditorViewRef} from './types/editor-view.ts';
export {isEditorViewRef} from './types/editor-view.ts';
