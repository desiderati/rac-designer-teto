import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, util as fabricUtil,} from 'fabric';
import {
  readLineArrowDistanceEditorState
} from '@/components/rac-editor/modals/editors/generic/helpers/line-arrow-distance-editor-state.ts';
import type {
  CanvasPointerPayload,
  CanvasRuntimeObject,
} from '@/components/rac-editor/hooks/canvas-fabric-runtime-types';
import {
  LineArrowDistanceCanvasSelection,
  LineArrowDistanceCanvasSelectionType,
  ObjectCanvasSelection
} from "@/components/rac-editor/Canvas.tsx";

interface BindInlineEditorEventsArgs {
  canvas: FabricCanvas;
  isEditorOpen: () => boolean;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  handlePilotiSelection: (subTarget: FabricObject, target: FabricObject) => void;
  onObjectSelect: (selection: ObjectCanvasSelection) => void;
  onLineArrowDistanceSelect: (selection: LineArrowDistanceCanvasSelection) => void;
  onSelectionChange: (message: string) => void;
}

function toRuntimeObject(object: FabricObject): CanvasRuntimeObject {
  return object as CanvasRuntimeObject;
}

export function useCanvasInlineEditorEvents() {
  const bindInlineEditorEvents = useCallback(({
    canvas,
    isEditorOpen,
    getEventPayload,
    getCurrentScreenPoint,
    handlePilotiSelection,
    onObjectSelect,
    onLineArrowDistanceSelect,
    onSelectionChange,
  }: BindInlineEditorEventsArgs) => {

    const handleObjectSelection = (
      wall: FabricObject,
    ) => {

      const center = wall.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      const wallLabel = (wall as CanvasRuntimeObject).getObjects()
        .find((child) => child.myType === 'wallLabel');

      onObjectSelect({
        object: wall,
        currentLabel: wallLabel?.text?.trim() || '',
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando nome do objeto.');
    };

    const handleLineArrowDistanceSelection = (
      object: FabricObject,
      myType: LineArrowDistanceCanvasSelectionType
    ) => {

      const {currentColor, currentLabel} = readLineArrowDistanceEditorState(object as CanvasRuntimeObject);
      const center = object.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onLineArrowDistanceSelect({
        object,
        myType,
        currentColor,
        currentLabel,
        screenPosition: screenPoint,
      });
    };

    const handleDesktopDoubleClick = (event: unknown) => {
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (isMobileDevice && !target) return;
      if (isEditorOpen()) return;

      const targetRuntime = toRuntimeObject(target);
      if (targetRuntime?.myType === 'wall') {
        handleObjectSelection(target);
        return;
      }

      if (targetRuntime?.myType === 'line') {
        handleLineArrowDistanceSelection(target, 'line');
        return;
      }

      if (targetRuntime?.myType === 'arrow') {
        handleLineArrowDistanceSelection(target, 'arrow');
        return;
      }

      if (targetRuntime?.myType === 'distance') {
        handleLineArrowDistanceSelection(target, 'distance');
        return;
      }

      if (target.type !== 'group' || !payload.e) return;
      const group = target as Group;
      const pointer = canvas.getPointer(payload.e);
      const groupMatrix = group.calcTransformMatrix();
      const invertedMatrix = fabricUtil.invertTransform(groupMatrix);
      const localPoint = fabricUtil.transformPoint(
        {x: pointer.x, y: pointer.y},
        invertedMatrix
      );

      const objects = group.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = toRuntimeObject(objects[i]);
        if (!object) continue;
        if (object.myType !== 'piloti' && object.myType !== 'pilotiHitArea') continue;

        if (object.isPilotiCircle || object.isPilotiHitArea) {
          const objectLeft = object.left || 0;
          const objectTop = object.top || 0;
          const radius = object.radius || ((object.width ?? 0) / 2) || 10;
          const distance = Math.sqrt(
            Math.pow(localPoint.x - objectLeft, 2) + Math.pow(localPoint.y - objectTop, 2)
          );
          if (distance <= radius) {
            handlePilotiSelection(object, target);
            return;
          }
        }

        if (object.isPilotiRect) {
          const left = object.left || 0;
          const top = object.top || 0;
          const width = (object.width || 0) * (object.scaleX || 1);
          const height = (object.height || 0) * (object.scaleY || 1);
          const withinX = localPoint.x >= left && localPoint.x <= left + width;
          const withinY = localPoint.y >= top && localPoint.y <= top + height;
          if (withinX && withinY) {
            handlePilotiSelection(object, target);
            return;
          }
        }
      }
    };

    const handleMobileTap = (event: unknown) => {
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (!isMobileDevice || !target) return;
      if (isEditorOpen()) return;

      const runtimeTarget = toRuntimeObject(target);
      if (runtimeTarget?.myType === 'wall') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleObjectSelection(target);
          }
        }, 300);
        return;
      }

      if (runtimeTarget?.myType === 'line') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLineArrowDistanceSelection(target, 'line');
          }
        }, 300);
        return;
      }

      if (runtimeTarget?.myType === 'arrow') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLineArrowDistanceSelection(target, 'arrow');
          }
        }, 300);
        return;
      }

      if (runtimeTarget?.myType === 'distance') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLineArrowDistanceSelection(target, 'distance');
          }
        }, 300);
        return;
      }
    };

    canvas.on('mouse:dblclick', handleDesktopDoubleClick);
    canvas.on('mouse:down', handleMobileTap);

    return () => {
      canvas.off('mouse:dblclick', handleDesktopDoubleClick);
      canvas.off('mouse:down', handleMobileTap);
    };
  }, []);

  return {bindInlineEditorEvents};
}
