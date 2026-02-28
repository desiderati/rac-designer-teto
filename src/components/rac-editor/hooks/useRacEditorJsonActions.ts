import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas, Group} from 'fabric';
import {toast} from 'sonner';
import type {CanvasHandle, ContraventamentoCanvasSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {houseManager} from '@/components/lib/house-manager.ts';
import {refreshHouseGroupsOnCanvas, removeContraventamentosFromTopView, toCanvasObject} from '@/components/lib/canvas';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';

interface UseRacEditorJsonActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
  selectedContraventamento: ContraventamentoCanvasSelection | null;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  clearContraventamentoSelection: (group?: Group | null) => void;
  getTopViewGroup: () => Group | null;
}

export function useRacEditorJsonActions({
  canvasRef,
  getCanvas,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
  selectedContraventamento,
  setSelectedContraventamento,
  clearContraventamentoSelection,
  getTopViewGroup,
}: UseRacEditorJsonActionsArgs) {

  const handleExportJSON = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const json = canvas.toJSON();
    const blob = new Blob([JSON.stringify(json)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'RAC-TETO-Projeto.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setInfoMessage(EDITOR_INFO_MESSAGES.projectSavedAsJson);
    toast.success(TOAST_MESSAGES.projectExportedSuccessfully);
  }, [getCanvas, setInfoMessage]);

  const handleImportJSON = useCallback((file: File) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawContent = event.target?.result;
      if (typeof rawContent !== 'string') {
        toast.error(TOAST_MESSAGES.invalidJsonFile);
        return;
      }

      canvas.clear();
      canvas.loadFromJSON(rawContent).then(() => {
        resetContraventamentoFlow();
        refreshHouseGroupsOnCanvas(canvas);
        houseManager.rebuildFromCanvas();
        canvas.renderAll();
        syncContraventamentoElevations();
        canvasRef.current?.saveHistory();
        setInfoMessage(EDITOR_INFO_MESSAGES.projectLoaded);
        toast.success(TOAST_MESSAGES.projectLoadedSuccessfully);
      });
    };
    reader.readAsText(file);
  }, [canvasRef, getCanvas, resetContraventamentoFlow, setInfoMessage, syncContraventamentoElevations]);

  const handleDelete = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    if (selectedContraventamento) {
      const removed = removeContraventamentosFromTopView(
        selectedContraventamento.group,
        (object) => toCanvasObject(object)?.contraventamentoId === selectedContraventamento.contraventamentoId
      );
      if (removed > 0) {
        clearContraventamentoSelection(selectedContraventamento.group);
        syncContraventamentoElevations();
        canvas.requestRenderAll();
        canvasRef.current?.saveHistory();
        setInfoMessage(EDITOR_INFO_MESSAGES.contraventamentoRemoved);
        toast.success(TOAST_MESSAGES.contraventamentoRemovedSuccessfully);
        return;
      }
      setSelectedContraventamento(null);
    }

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    const topGroup = getTopViewGroup();
    clearContraventamentoSelection(topGroup);
    canvas.discardActiveObject();

    for (const object of activeObjects) {
      const typedObject = toCanvasObject(object);
      if (!typedObject) continue;

      if (typedObject.myType === 'house') {
        const rawView = typedObject.houseViewType ?? typedObject.houseView;

        if (rawView === 'top') {
          if (!houseManager.canDeletePlant()) {
            toast.error(TOAST_MESSAGES.removeOtherViewsBeforeDeletingTopView);
            canvas.setActiveObject(object);
            return;
          }
          houseManager.setHouseType(null);
        }
        houseManager.removeView(object as Group);
      }
      canvas.remove(object);
    }

    setInfoMessage('Objeto excluído.');
  }, [
    canvasRef,
    clearContraventamentoSelection,
    getCanvas,
    getTopViewGroup,
    selectedContraventamento,
    setInfoMessage,
    setSelectedContraventamento,
    syncContraventamentoElevations,
  ]);

  return {
    handleExportJSON,
    handleImportJSON,
    handleDelete,
  };
}

