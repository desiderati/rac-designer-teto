import {RefObject, useCallback, useState} from 'react';
import {useEditorPorts, useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';
import type {TerrainCanvasSelection} from '@/components/rac-editor/canvas/ports/CanvasSelectionPort.ts';
import type {CanvasHandle} from '@/components/rac-editor/canvas/ports/CanvasInteractionPort.ts';

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
  const {houseReadPort, houseWritePort} = useEditorPorts();
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
      terrainType: houseReadPort.getTerrainType(),
    });
    setIsTerrainEditorOpen(true);
  }, [editorStore, houseReadPort]);

  const handleTerrainEditorClose = useCallback(() => {
    setIsTerrainEditorOpen(false);
    setTerrainSelection(null);
    editorStore.dispatch({type: 'CLEAR_EDITOR_SELECTION'});
  }, [editorStore]);

  const handleTerrainApply = useCallback((terrainType: number) => {
    const normalized = houseWritePort.setTerrainType(terrainType);
    canvasRef.current?.saveHistory();

    setTerrainSelection(
      (current) =>
        current ? {...current, terrainType: normalized} : null,
    );
    setInfoMessage(`Terreno atualizado para "${TERRAIN_SOLIDITY.levels[normalized].label}".`);
  }, [canvasRef, houseWritePort, setInfoMessage]);

  return {
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
  };
}
