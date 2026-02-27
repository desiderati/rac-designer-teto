import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, util as fabricUtil} from 'fabric';
import {readLinearObjectState} from '@/components/rac-editor/modals/editors/generic/helpers/linear-object-state.ts';
import type {CanvasPointerPayload,} from '@/components/lib/canvas/canvas.ts';
import {toCanvasObject} from '@/components/lib/canvas';
import {LinearCanvasSelection, LinearCanvasSelectionType, WallCanvasSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {readWallObjectState} from '@/components/rac-editor/modals/editors/generic/helpers/wall-object-state.ts';
import {TIMINGS, VIEWPORT} from '@/shared/config.ts';

interface UseCanvasEditorEventsArgs {
  canvas: FabricCanvas;
  isAnyEditorOpen: () => boolean;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  handlePilotiSelection: (subTarget: FabricObject, target: FabricObject) => void;
  onWallSelect: (selection: WallCanvasSelection) => void;
  onLinearSelect: (selection: LinearCanvasSelection) => void;
  onSelectionChange: (message: string) => void;
}


export function useCanvasEditorEvents() {
  const bindInlineEditorEvents = useCallback(({
    canvas,
    isAnyEditorOpen,
    getEventPayload,
    getCurrentScreenPoint,
    handlePilotiSelection,
    onWallSelect,
    onLinearSelect,
    onSelectionChange,
  }: UseCanvasEditorEventsArgs) => {

    const handleWallSelection = (
      wall: FabricObject,
    ) => {
      const wallObject = toCanvasObject(wall);
      if (!wallObject) return;
      const {currentLabel} = readWallObjectState(wallObject);
      const center = wall.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onWallSelect({
        object: wall,
        currentLabel: currentLabel,
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando nome do objeto.');
    };

    const handleLinearSelection = (
      object: FabricObject,
      myType: LinearCanvasSelectionType
    ) => {
      const linearObject = toCanvasObject(object);
      if (!linearObject) return;
      const {currentColor, currentLabel} = readLinearObjectState(linearObject);
      const center = object.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onLinearSelect({
        object,
        myType,
        currentColor,
        currentLabel,
        screenPosition: screenPoint,
      });
    };

    const handleDesktopDoubleClick = (event: unknown) => {
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (isMobileDevice || !target) return;
      if (isAnyEditorOpen()) return;

      const targetRuntime = toCanvasObject(target);
      if (targetRuntime?.myType === 'wall') {
        handleWallSelection(target);
        return;
      }

      if (targetRuntime?.myType === 'line') {
        handleLinearSelection(target, 'line');
        return;
      }

      if (targetRuntime?.myType === 'arrow') {
        handleLinearSelection(target, 'arrow');
        return;
      }

      if (targetRuntime?.myType === 'distance') {
        handleLinearSelection(target, 'distance');
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
        const object = toCanvasObject(objects[i]);
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
      const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;
      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (!isMobileDevice || !target) return;
      if (isAnyEditorOpen()) return;

      const runtimeTarget = toCanvasObject(target);
      if (runtimeTarget?.myType === 'wall') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleWallSelection(target);
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget?.myType === 'line') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLinearSelection(target, 'line');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget?.myType === 'arrow') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLinearSelection(target, 'arrow');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
        return;
      }

      if (runtimeTarget?.myType === 'distance') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLinearSelection(target, 'distance');
          }
        }, TIMINGS.mobileTapToEditDelayMs);
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
