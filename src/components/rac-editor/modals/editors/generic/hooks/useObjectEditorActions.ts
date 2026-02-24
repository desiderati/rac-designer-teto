import {RefObject, useCallback} from 'react';
import type {CanvasHandle, ObjectCanvasSelection} from '@/components/rac-editor/Canvas.tsx';
import {Canvas as FabricCanvas, FabricObject, Group, IText} from "fabric";
import {CanvasRuntimeObject} from "@/components/rac-editor/hooks/canvas-fabric-runtime-types.ts";

interface UseObjectEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  objectSelection: ObjectCanvasSelection | null;
  setInfoMessage: (message: string) => void;
}

export function useObjectEditorActions({
  canvasRef,
  objectSelection,
  setInfoMessage,
}: UseObjectEditorActionsArgs) {

  const handleObjectApply = useCallback((
    newValue: string,
    newColor: string
  ) => {
    const canvas = canvasRef.current?.canvas;
    const object = objectSelection?.object;
    if (!canvas || !object) return;

    applyWallEditorChange({
      canvas,
      object,
      color: newColor,
      label: newValue,
    });

    canvasRef.current?.saveHistory();
    setInfoMessage('Objeto atualizado.');
    return;
  }, [canvasRef, objectSelection, setInfoMessage]);

  const resolveObjectEditorColor = useCallback(() => {
    const wall = objectSelection?.object as Group | undefined;
    if (!wall || wall.type !== 'group') return '#666666';

    const wallBody = (wall as CanvasRuntimeObject).getObjects().find(
      (child) => child.myType === 'wallBody'
    ) as CanvasRuntimeObject | undefined;

    return (wallBody?.stroke as string) || '#666666';
  }, [objectSelection?.object]);

  return {
    handleObjectApply,
    resolveObjectEditorColor,
  };
}

function applyWallEditorChange(params: {
  canvas: FabricCanvas;
  object: FabricObject;
  color: string;
  label: string;
}): void {

  const {canvas, object, color, label} = params;
  const group = object as Group;
  const groupChildren =
    group.getObjects().map(
      (child) => child as CanvasRuntimeObject
    );

  groupChildren.forEach((child) => {
    if (child.myType !== 'wallLabel') child.set({stroke: color});
  });

  const existingLabel =
    groupChildren.find(
      (child) => child.myType === 'wallLabel'
    ) as IText | undefined;

  if (existingLabel) {
    const normalizedTop = typeof existingLabel.top === 'number' ? existingLabel.top : 0;
    existingLabel.set({
      text: label,
      fill: color,
      visible: true,
      left: 0,
      top: normalizedTop,
      scaleX: 1,
      scaleY: 1,
    });
  }

  canvas.requestRenderAll();
}
