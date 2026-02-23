import {RefObject, useCallback} from 'react';
import type {CanvasHandle, ObjectCanvasSelection} from '@/components/rac-editor/Canvas.tsx';
import {Canvas as FabricCanvas, FabricObject, Group, IText, Rect} from "fabric";

type WallRuntimeRect = Rect & {
  _group?: Group;
  group?: Group;
  myType?: string;
  wallId?: string;
};

type WallRuntimeLabel = IText & {
  myType?: string;
  labelFor?: Rect;
};

type WallRuntimeGroup = Group & {
  myType?: string;
  wallId?: string;
  add: (object: IText) => Group;
};

type WallRuntimeObject = {
  myType?: string;
  type?: string;
};

type WallMetaObject = FabricObject & {
  stroke?: string;
}

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
    if (!canvas) return;

    applyWallEditorChange({
      canvas,
      wall: objectSelection.object,
      color: newColor,
      name: newValue,
    });

    canvasRef.current?.saveHistory();
    setInfoMessage('Objeto atualizado.');
    return;
  }, [canvasRef, objectSelection, setInfoMessage]);

  const resolveWallEditorColor = useCallback(() => {
    const wall = objectSelection?.object;
    if (!wall) return '#00000';

    return ((wall as WallMetaObject).stroke as string) || '#00000';
  }, [objectSelection?.object]);

  return {
    handleObjectApply,
    resolveWallEditorColor,
  };
}

function applyWallEditorChange(params: {
  canvas: FabricCanvas;
  wall: Rect;
  color: string;
  name: string;
}): void {

  const {canvas, wall: obj, name, color} = params;
  const runtimeWall = obj as WallRuntimeRect;
  const parentGroup = runtimeWall._group || runtimeWall.group;
  const existingLabel = parentGroup ? getWallLabel(parentGroup) : undefined;

  if (parentGroup) {
    obj.set({stroke: color});

    if (existingLabel) {
      existingLabel.set({
        text: name,
        fill: color,
        visible: true,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });

      parentGroup.setCoords();
      if (typeof existingLabel.setCoords === "function") existingLabel.setCoords();
      if (typeof obj.setCoords === "function") obj.setCoords();

    } else if (name) {
      const label = createWallLabel(name, color);
      label.myType = "wallLabel";
      label.labelFor = obj;
      label.set({left: 0, top: 0, visible: true});
      const runtimeParentGroup = parentGroup as unknown as WallRuntimeGroup & {
        addWithUpdate?: (object: IText) => Group;
      };

      if (typeof runtimeParentGroup.addWithUpdate === "function") {
        runtimeParentGroup.addWithUpdate(label);
      } else if (typeof runtimeParentGroup.add === "function") {
        runtimeParentGroup.add(label);
      }

      parentGroup.setCoords();
      if (typeof label.setCoords === "function") label.setCoords();
      if (typeof obj.setCoords === "function") obj.setCoords();
    }

  } else if (name && !parentGroup) {
    const label = createWallLabel(name, color);
    label.myType = "wallLabel";
    label.labelFor = obj;

    canvas.remove(obj);
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;
    obj.set({left: 0, top: 0, originX: "center", originY: "center", stroke: color});
    label.set({left: 0, top: 0});

    const group = new Group([obj, label], {
      left: objLeft,
      top: objTop,
      originX: "center",
      originY: "center",
    });

    const runtimeGroup = group as WallRuntimeGroup;
    runtimeGroup.myType = runtimeWall.myType;
    runtimeGroup.wallId = runtimeWall.wallId;
    group.setCoords();

    if (typeof obj.setCoords === "function") obj.setCoords();
    if (typeof label.setCoords === "function") label.setCoords();

    canvas.add(group);
    canvas.setActiveObject(group);

  } else if (!name && !parentGroup) {
    obj.set({stroke: color});
  }

  canvas.renderAll();
}

function getWallLabel(group: Group): WallRuntimeLabel | undefined {
  const children = group.getObjects();

  const typedLabel =
    children.find(
      (object) => (object as WallRuntimeObject).myType === "wallLabel"
    );
  if (typedLabel) return typedLabel as WallRuntimeLabel;

  const fallbackLabel =
    children.find(
      (object) => (object as WallRuntimeObject).type === "i-text"
    );
  return fallbackLabel as WallRuntimeLabel | undefined;
}

function createWallLabel(name: string, color: string): WallRuntimeLabel {
  return new IText(name, {
    fontSize: 14,
    fontFamily: "Arial",
    fill: color,
    originX: "center",
    originY: "center",
    textAlign: "center",
    selectable: false,
    evented: false,
  }) as WallRuntimeLabel;
}
