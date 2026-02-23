import {useCallback} from 'react';
import {
  Canvas as FabricCanvas,
  FabricObject,
  Group,
  Rect,
  util as fabricUtil,
} from 'fabric';
import {readLineArrowEditorState} from '@/lib/canvas/line-arrow-editor';
import type {
  CanvasMouseEvent,
  CanvasPointerPayload,
  CanvasRuntimeObject,
} from '@/components/rac-editor/hooks/canvas-fabric-runtime-types';

interface DistanceSelectionPayload {
  group: Group;
  currentValue: string;
  screenPosition: { x: number; y: number };
}

interface ObjectNameSelectionPayload {
  object: Rect;
  currentValue: string;
  screenPosition: { x: number; y: number };
}

interface LineArrowSelectionPayload {
  object: FabricObject;
  myType: 'line' | 'arrow';
  currentColor: string;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

type LineArrowReadableObject = Parameters<typeof readLineArrowEditorState>[0];

interface BindInlineEditorEventsArgs {
  canvas: FabricCanvas;
  toRuntimeObject: (object: FabricObject | null | undefined) => CanvasRuntimeObject | null;
  getEventPayload: (event: unknown) => CanvasPointerPayload;
  handlePilotiSelection: (subTarget: FabricObject, target: FabricObject) => void;
  onDistanceSelect: (selection: DistanceSelectionPayload) => void;
  onObjectNameSelect: (selection: ObjectNameSelectionPayload) => void;
  onLineArrowSelect: (selection: LineArrowSelectionPayload) => void;
  onSelectionChange: (message: string) => void;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  isEditorOpen: () => boolean;
}

export function useCanvasInlineEditorEvents() {
  const bindInlineEditorEvents = useCallback(({
    canvas,
    toRuntimeObject,
    getEventPayload,
    handlePilotiSelection,
    onDistanceSelect,
    onObjectNameSelect,
    onLineArrowSelect,
    onSelectionChange,
    getCurrentScreenPoint,
    isEditorOpen,
  }: BindInlineEditorEventsArgs) => {
    const getWallParentGroup = (wall: Rect): Group | null => {
      const runtimeWall = toRuntimeObject(wall);
      const runtimeGroup = runtimeWall?.group as Group | undefined;
      const internalGroup = (wall as unknown as {_group?: Group})._group;
      return runtimeGroup || internalGroup || null;
    };

    const resolveWallSelectionTarget = (target: FabricObject) => {
      const runtimeTarget = toRuntimeObject(target);

      if (target.type === 'rect' && runtimeTarget?.myType === 'wall') {
        const wall = target as Rect;
        const parentGroup = getWallParentGroup(wall);
        const groupedLabel = parentGroup
          ?.getObjects()
          .find((object) => toRuntimeObject(object)?.myType === 'wallLabel');
        const groupedLabelRuntime = toRuntimeObject(groupedLabel);

        const fallbackLabel = canvas.getObjects().find((object) => {
          const runtimeObject = toRuntimeObject(object);
          return runtimeObject?.myType === 'wallLabel' && runtimeObject.labelFor === wall;
        });
        const fallbackLabelRuntime = toRuntimeObject(fallbackLabel);

        const currentValue =
          groupedLabelRuntime?.text?.trim() ||
          fallbackLabelRuntime?.text?.trim() ||
          '';
        const center = target.getCenterPoint();

        return {
          wall,
          currentValue,
          anchorPoint: {x: center.x, y: center.y},
        };
      }

      if (target.type === 'group' && runtimeTarget?.myType === 'wall') {
        const group = target as Group;
        const wall = group.getObjects().find((object) => {
          const runtimeObject = toRuntimeObject(object);
          return object.type === 'rect' && runtimeObject?.myType === 'wall';
        }) as Rect | undefined;
        if (!wall) return null;

        const label = group
          .getObjects()
          .find((object) => toRuntimeObject(object)?.myType === 'wallLabel');
        const runtimeLabel = toRuntimeObject(label);
        const center = group.getCenterPoint();

        return {
          wall,
          currentValue: runtimeLabel?.text?.trim() || '',
          anchorPoint: {x: center.x, y: center.y},
        };
      }

      return null;
    };

    const handleDistanceSelection = (group: Group) => {
      const textObj = group.getObjects().find((object) => object.type === 'i-text');
      const runtimeText = toRuntimeObject(textObj);
      const currentValue = runtimeText?.text?.trim() || '';

      const screenPoint = getCurrentScreenPoint({
        x: group.left || 0,
        y: group.top || 0,
      });
      if (!screenPoint) return;

      onDistanceSelect({
        group,
        currentValue,
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando distância.');
    };

    const handleObjectNameSelection = (selection: {
      wall: Rect;
      currentValue: string;
      anchorPoint: {x: number; y: number};
    }) => {
      const screenPoint = getCurrentScreenPoint(selection.anchorPoint);
      if (!screenPoint) return;

      onObjectNameSelect({
        object: selection.wall,
        currentValue: selection.currentValue,
        screenPosition: screenPoint,
      });
      onSelectionChange('Editando nome do objeto.');
    };

    const handleLineArrowSelection = (object: FabricObject, myType: 'line' | 'arrow') => {
      const readableObject = object as LineArrowReadableObject;
      const {currentColor, currentLabel} = readLineArrowEditorState(readableObject, myType);

      const center = object.getCenterPoint();
      const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
      if (!screenPoint) return;

      onLineArrowSelect({
        object,
        myType,
        currentColor,
        currentLabel,
        screenPosition: screenPoint,
      });
    };

    const handleDesktopDoubleClick = (event: unknown) => {
      if (window.matchMedia('(max-width: 767px)').matches) return;

      const payload = getEventPayload(event);
      const target = payload.target ?? null;
      if (!target) return;
      const targetRuntime = toRuntimeObject(target);

      if (target.type === 'group' && targetRuntime?.myType === 'dimension') {
        payload.e?.preventDefault();
        payload.e?.stopPropagation();
        handleDistanceSelection(target as Group);
        return;
      }

      const wallSelection = resolveWallSelectionTarget(target);
      if (wallSelection) {
        handleObjectNameSelection(wallSelection);
        return;
      }

      if (targetRuntime?.myType === 'line') {
        handleLineArrowSelection(target, 'line');
        return;
      }

      if (target.type === 'group' && targetRuntime?.myType === 'arrow') {
        handleLineArrowSelection(target, 'arrow');
        return;
      }

      const subTargets = (payload.subTargets as CanvasRuntimeObject[] | undefined) ?? [];
      for (const subTarget of subTargets) {
        if (subTarget.type !== 'i-text') continue;
        const parent = subTarget.group;
        if (parent && toRuntimeObject(parent)?.myType === 'dimension') {
          payload.e?.preventDefault();
          payload.e?.stopPropagation();
          handleDistanceSelection(parent as Group);
          return;
        }
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
      const wallSelection = resolveWallSelectionTarget(target);
      if (wallSelection) {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleObjectNameSelection(wallSelection);
          }
        }, 300);
        return;
      }

      if (runtimeTarget?.myType === 'line') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLineArrowSelection(target, 'line');
          }
        }, 300);
        return;
      }

      if (target.type === 'group' && runtimeTarget?.myType === 'arrow') {
        setTimeout(() => {
          if (canvas.getActiveObject() === target) {
            handleLineArrowSelection(target, 'arrow');
          }
        }, 300);
        return;
      }

      if (target.type === 'group' && runtimeTarget?.myType === 'dimension') {
        if (!payload.e) return;
        const pointer = canvas.getPointer(payload.e);
        const group = target as Group;
        const groupCenterX = group.left || 0;
        const groupCenterY = group.top || 0;
        const distanceFromCenter = Math.sqrt(
          Math.pow(pointer.x - groupCenterX, 2) + Math.pow(pointer.y - groupCenterY, 2)
        );
        const centerThreshold = 30;
        if (distanceFromCenter <= centerThreshold) {
          setTimeout(() => {
            if (canvas.getActiveObject() === target) {
              handleDistanceSelection(group);
            }
          }, 300);
        }
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
