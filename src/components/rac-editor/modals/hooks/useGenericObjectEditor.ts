import {useState} from 'react';
import type {LinearCanvasSelection, WallCanvasSelection,} from '@/components/rac-editor/canvas/store/CanvasSelectionPort.ts';
import {useEditorStore} from '@/bootstrap/editor-bootstrap.ts';

export function useGenericObjectEditor() {
  const editorStore = useEditorStore();

  const [wallSelection, setWallSelection] =
    useState<WallCanvasSelection | null>(null);

  const [isWallEditorOpen, setIsWallEditorOpen] =
    useState(false);

  const [linearSelection, setLinearSelection] =
    useState<LinearCanvasSelection | null>(null);

  const [isLinearEditorOpen, setIsLinearEditorOpen] =
    useState(false);

  const handleWallSelect = (
    selection: WallCanvasSelection | null
  ) => {
    editorStore.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: selection?.editorSelection ?? null,
    });
    if (selection) {
      setWallSelection(selection);
      setIsWallEditorOpen(true);
    }
  };

  const closeWallEditor = () => {
    setIsWallEditorOpen(false);
    setWallSelection(null);
    editorStore.dispatch({type: 'CLEAR_EDITOR_SELECTION'});
  };

  const handleLinearSelect = (
    selection: LinearCanvasSelection | null
  ) => {
    editorStore.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: selection?.editorSelection ?? null,
    });
    if (selection) {
      setLinearSelection(selection);
      setIsLinearEditorOpen(true);
    }
  };

  const closeLinearEditor = () => {
    setIsLinearEditorOpen(false);
    setLinearSelection(null);
    editorStore.dispatch({type: 'CLEAR_EDITOR_SELECTION'});
  };

  return {
    wallSelection,
    isWallEditorOpen,
    handleWallSelect,
    closeWallEditor,

    linearSelection,
    isLinearEditorOpen,
    handleLinearSelect,
    closeLinearEditor,
  };
}
