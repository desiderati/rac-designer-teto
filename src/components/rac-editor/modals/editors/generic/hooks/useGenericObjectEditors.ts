import {useState} from 'react';
import type {linearSelection, wallSelection,} from '@/components/rac-editor/canvas/Canvas.tsx';

export function useGenericObjectEditors() {

  const [wallSelection, setWallSelection] =
    useState<wallSelection | null>(null);

  const [isWallEditorOpen, setIsWallEditorOpen] =
    useState(false);

  const [linearSelection, setLinearSelection] =
    useState<linearSelection | null>(null);

  const [isLinearEditorOpen, setIsLinearEditorOpen] =
    useState(false);

  const handleWallSelect = (
    selection: wallSelection | null
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
    selection: linearSelection | null
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
