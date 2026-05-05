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
