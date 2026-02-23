import {RefObject, useCallback} from 'react';
import {FabricObject, Group, IText} from 'fabric';
import type {CanvasHandle, LineArrowDistanceCanvasSelection} from '@/components/rac-editor/Canvas.tsx';
import {CanvasRuntimeObject, LINE_ARROW_LABEL_TOP} from '@/lib/canvas';

interface useLineArrowDistanceEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  lineArrowDistanceSelection: LineArrowDistanceCanvasSelection | null;
  setInfoMessage: (message: string) => void;
}

export function useLineArrowDistanceEditorActions({
  canvasRef,
  lineArrowDistanceSelection,
  setInfoMessage,
}: useLineArrowDistanceEditorActionsArgs) {

  const handleLineArrowDistanceApply =
    useCallback((newValue: string, newColor: string) => {
      const canvas = canvasRef.current?.canvas;
      if (!canvas) return;

      applyLineArrowDistanceEditorChange({
        object: lineArrowDistanceSelection.object,
        color: newColor,
        label: newValue,
      });

      canvasRef.current?.saveHistory();
      setInfoMessage(getInfoMessage(lineArrowDistanceSelection.myType));
    }, [canvasRef, lineArrowDistanceSelection, setInfoMessage]);

  return {
    handleLineArrowDistanceApply,
  };
}

function applyLineArrowDistanceEditorChange(params: {
  object: FabricObject;
  color: string;
  label: string;
}): void {
  const {object, color, label} = params;
  const group = object as Group;
  const groupChildren =
    group.getObjects().map(
      (child) => child as CanvasRuntimeObject
    );

  groupChildren.forEach((child) => {
    (child.type === 'line') ? child.set({stroke: color}) : child.set({fill: color});
  });

  const existingLabel =
    groupChildren.find(
      (child) => child.myType === 'objLabel'
    ) as IText | undefined;

  if (existingLabel) {
    const normalizedTop = typeof existingLabel.top === 'number' ? existingLabel.top : LINE_ARROW_LABEL_TOP;
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
}

const getInfoMessage = (myType: string): string => {
  switch (myType) {
    case 'line':
      return 'Linha atualizada.';

    case 'arrow':
      return 'Seta atualizada.';

    case 'distance':
      return 'Distância atualizada.';
  }
};
