import {Dispatch, RefObject, SetStateAction, useState} from 'react';
import {ActiveSelection, Canvas as FabricCanvas, Group} from 'fabric';
import type {CanvasHandle} from '@/components/rac-editor/canvas/Canvas.tsx';
import {CanvasObject} from "@/components/lib/canvas/canvas.ts";

interface UseCanvasGroupingActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setShowUngroupConfirm: Dispatch<SetStateAction<boolean>>;
}

export function useCanvasGroupingActions({
  canvasRef,
  getCanvas,
  setInfoMessage,
  setShowUngroupConfirm,
}: UseCanvasGroupingActionsArgs) {
  const [groupToUngroup, setGroupToUngroup] = useState<Group | null>(null);

  const performUngroup = (group: Group) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const items = group.removeAll();
    canvas.remove(group);
    if (items.length === 0) {
      canvas.requestRenderAll();
      return;
    }

    canvas.add(...items);
    const selection = new ActiveSelection(items, {canvas});
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
    canvasRef.current?.saveHistory();
    setInfoMessage('Grupo macro desagrupado.');
  };

  const handleUngroup = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'group') {
      setInfoMessage('Selecione um grupo para desbloquear.');
      return;
    }

    const group = activeObject as Group;
    if (!(group as CanvasObject).isMacroGroup) {
      setInfoMessage('Desagrupar só é permitido para grupos macro (objetos inteiros).');
      return;
    }

    performUngroup(group);
  };

  const confirmUngroup = () => {
    if (groupToUngroup) {
      performUngroup(groupToUngroup);
    }
    setShowUngroupConfirm(false);
    setGroupToUngroup(null);
  };

  const closeUngroupConfirm = () => {
    setShowUngroupConfirm(false);
    setGroupToUngroup(null);
  };

  const handleGroup = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }

    const isActiveSelection = activeObject.type === 'activeSelection' || activeObject.type === 'activeselection';
    if (!isActiveSelection) {
      setInfoMessage('Selecione vários itens para bloquear (agrupar).');
      return;
    }

    const activeSelection = activeObject as ActiveSelection;
    const objects = activeSelection.getObjects();
    if (objects.length < 2) {
      setInfoMessage('Selecione pelo menos 2 itens para agrupar.');
      return;
    }

    const canvasObjects = canvas.getObjects();
    const hasNonTopLevelObject = objects.some((object) => !canvasObjects.includes(object));
    if (hasNonTopLevelObject) {
      setInfoMessage('Agrupamento permitido apenas para objetos inteiros (macro), não para elementos internos.');
      return;
    }

    const selectionLeft = activeSelection.left;
    const selectionTop = activeSelection.top;

    canvas.discardActiveObject();
    objects.forEach((object) => canvas.remove(object));

    const group = new Group(objects, {
      left: selectionLeft ?? 0,
      top: selectionTop ?? 0,
    });
    const typedGroup = group as CanvasObject;
    typedGroup.isMacroGroup = true;
    typedGroup.myType = 'macroGroup';
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    canvasRef.current?.saveHistory();
    setInfoMessage('Objetos macro agrupados.');
  };

  return {
    handleGroup,
    handleUngroup,
    confirmUngroup,
    closeUngroupConfirm,
  };
}

