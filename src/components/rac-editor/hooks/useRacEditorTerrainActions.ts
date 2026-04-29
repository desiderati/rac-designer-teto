import {RefObject, useCallback, useState} from 'react';
import {useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {legacyHouseReadPort} from '@/infra/house/legacy-house-read-adapter.ts';
import {legacyHouseWritePort} from '@/infra/house/legacy-house-write-adapter.ts';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';
import type {
  CanvasHandle,
  TerrainCanvasSelection,
} from '@/components/rac-editor/ui/canvas/Canvas.tsx';

interface UseRacEditorTerrainActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  editorStore: ReturnType<typeof useEditorStore>;
  setInfoMessage: (message: string) => void;
}

/**
 * Coordena seleção, edição e persistência do tipo de terreno.
 */
export function useRacEditorTerrainActions({
  canvasRef,
  editorStore,
  setInfoMessage,
}: UseRacEditorTerrainActionsArgs) {
  const [terrainSelection, setTerrainSelection] = useState<TerrainCanvasSelection | null>(null);
  const [isTerrainEditorOpen, setIsTerrainEditorOpen] = useState(false);

  const handleTerrainSelect = useCallback((selection: TerrainCanvasSelection | null) => {
    if (!selection) return;
    editorStore.dispatch({
      type: 'SELECT_EDITOR_TARGET',
      selection: selection.editorSelection,
    });
    setTerrainSelection({
      ...selection,
      terrainType: legacyHouseReadPort.getTerrainType(),
    });
    setIsTerrainEditorOpen(true);
  }, [editorStore]);

  const handleTerrainEditorClose = useCallback(() => {
    setIsTerrainEditorOpen(false);
    setTerrainSelection(null);
    editorStore.dispatch({type: 'CLEAR_EDITOR_SELECTION'});
  }, [editorStore]);

  const handleTerrainApply = useCallback((terrainType: number) => {
    const normalized = legacyHouseWritePort.setTerrainType(terrainType);
    canvasRef.current?.saveHistory();

    setTerrainSelection(
      (current) =>
        current ? {...current, terrainType: normalized} : null,
    );
    setInfoMessage(`Terreno atualizado para "${TERRAIN_SOLIDITY.levels[normalized].label}".`);
  }, [canvasRef, setInfoMessage]);

  return {
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
  };
}
