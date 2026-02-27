import {useState} from 'react';
import type {LinearCanvasSelection, WallCanvasSelection,} from '@/components/rac-editor/canvas/Canvas.tsx';

export function useGenericObjectEditors() {

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
    if (selection) {
      setWallSelection(selection);
      setIsWallEditorOpen(true);
    }
  };

  const closeWallEditor = () => {
    setIsWallEditorOpen(false);
    setWallSelection(null);
  };

  const handleLinearSelect = (
    selection: LinearCanvasSelection | null
  ) => {
    if (selection) {
      setLinearSelection(selection);
      setIsLinearEditorOpen(true);
    }
  };

  const closeLinearEditor = () => {
    setIsLinearEditorOpen(false);
    setLinearSelection(null);
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
