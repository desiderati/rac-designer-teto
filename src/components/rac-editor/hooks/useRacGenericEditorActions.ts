import {RefObject, useCallback, useMemo} from 'react';
import {FabricObject} from 'fabric';
import type {CanvasHandle, DistanceSelection, LineArrowCanvasSelection, ObjectNameSelection} from '@/components/rac-editor/Canvas';
import {GenericEditorType} from '@/components/rac-editor/modals/editors/GenericEditor';
import {applyLineArrowEditorChange} from '@/components/rac-editor/utils/line-arrow-editor-apply';
import {applyWallEditorChange} from '@/components/rac-editor/utils/wall-editor-apply';
import {applyDimensionEditorPatch} from '@/lib/canvas/dimension-editor';

type WallMetaObject = FabricObject & {
  stroke?: string;
};

interface UseRacGenericEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  distanceSelection: DistanceSelection | null;
  objectNameSelection: ObjectNameSelection | null;
  lineArrowSelection: LineArrowCanvasSelection | null;
  setInfoMessage: (message: string) => void;
}

export function useRacGenericEditorActions({
  canvasRef,
  distanceSelection,
  objectNameSelection,
  lineArrowSelection,
  setInfoMessage,
}: UseRacGenericEditorActionsArgs) {
  const handleGenericApply = useCallback((
    editorType: GenericEditorType,
    newValue: string,
    newColor: string
  ) => {
    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    if (editorType === 'wall' && objectNameSelection) {
      applyWallEditorChange({
        canvas,
        wall: objectNameSelection.object,
        name: newValue,
        color: newColor,
      });
      canvasRef.current?.saveHistory();
      setInfoMessage('Objeto atualizado.');
      return;
    }

    if ((editorType === 'line' || editorType === 'arrow') && lineArrowSelection) {
      applyLineArrowEditorChange({
        canvas,
        object: lineArrowSelection.object,
        myType: lineArrowSelection.myType,
        color: newColor,
        label: newValue,
      });
      canvasRef.current?.saveHistory();
      setInfoMessage('Linha/seta atualizada.');
      return;
    }

    if (editorType === 'dimension' && distanceSelection) {
      type DimensionPatchArgs = Parameters<typeof applyDimensionEditorPatch>[0];
      applyDimensionEditorPatch({
        group: distanceSelection.group as DimensionPatchArgs['group'],
        value: newValue,
        color: newColor,
      });
      canvas.requestRenderAll();
      canvasRef.current?.saveHistory();
      setInfoMessage(`Distância atualizada para: ${newValue || '(vazio)'}.`);
    }
  }, [canvasRef, distanceSelection, lineArrowSelection, objectNameSelection, setInfoMessage]);

  const resolveDimensionEditorColor = useCallback(() => {
    const group = distanceSelection?.group;
    if (!group) return '#000000';
    const text = group.getObjects().find((object) => object.type === 'i-text') as (FabricObject & {fill?: string}) | undefined;
    return (text?.fill as string) || '#000000';
  }, [distanceSelection?.group]);

  const resolveWallEditorColor = useCallback(() => {
    const wall = objectNameSelection?.object;
    if (!wall) return '#333333';
    return ((wall as WallMetaObject).stroke as string) || '#333333';
  }, [objectNameSelection?.object]);

  const lineArrowEditorType: GenericEditorType = useMemo(() => {
    return lineArrowSelection?.myType === 'arrow' ? 'arrow' : 'line';
  }, [lineArrowSelection?.myType]);

  return {
    handleGenericApply,
    resolveDimensionEditorColor,
    resolveWallEditorColor,
    lineArrowEditorType,
  };
}
