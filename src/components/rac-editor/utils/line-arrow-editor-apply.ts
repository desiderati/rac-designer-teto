import {Canvas as FabricCanvas, FabricObject, Group, IText, Line} from "fabric";

type LineArrowRuntimeObject = FabricObject & {
  myType?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  visible?: boolean;
  angle?: number;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  scaleX?: number;
  scaleY?: number;
  baseWidth?: number;
  baseHeight?: number;
  getObjects?: () => LineArrowRuntimeObject[];
};

type LineArrowRuntimeGroup = Group & {
  myType?: string;
  _objects: LineArrowRuntimeObject[];
  addWithUpdate?: () => void;
  __normalizingScale?: boolean;
};

function toRuntimeObject(object: FabricObject): LineArrowRuntimeObject {
  return object as LineArrowRuntimeObject;
}

const LINE_ARROW_LABEL_TOP = -20;

function updateGroupBounds(group: Group, recompute = false): void {
  const runtimeGroup = group as LineArrowRuntimeGroup;
  if (recompute && typeof runtimeGroup.addWithUpdate === "function") {
    runtimeGroup.addWithUpdate();
  }
  group.setCoords();
}

export function applyLineArrowEditorChange(params: {
  canvas: FabricCanvas;
  object: FabricObject;
  myType: "line" | "arrow";
  color: string;
  label: string;
}): void {
  const {canvas, object: obj, myType, color, label} = params;
  const runtimeObject = toRuntimeObject(obj);

  const isGroupWithLabel =
    obj.type === "group" &&
    (obj as Group)
      .getObjects()
      .some((object) => toRuntimeObject(object).myType === "lineArrowLabel");

  if (isGroupWithLabel) {
    const group = obj as Group;
    const groupChildren = group
      .getObjects()
      .map((object) => toRuntimeObject(object));
    const existingLabel = groupChildren.find((object) => object.myType === "lineArrowLabel") as IText | undefined;

    groupChildren.forEach((child) => {
      if (child.myType === "lineArrowLabel") return;
      if (child.type === "line") child.set({stroke: color});
      if (child.type === "group" && child.getObjects) {
        child.getObjects().forEach((ac) => {
          if (ac.type === "rect") ac.set({fill: color});
          if (ac.type === "triangle") ac.set({fill: color});
        });
      }
      if (child.type === "rect") child.set({fill: color});
      if (child.type === "triangle") child.set({fill: color});
    });

    if (existingLabel) {
      existingLabel.set({
        text: label || " ",
        fill: color,
        visible: true,
        left: 0,
        top: LINE_ARROW_LABEL_TOP,
        scaleX: 1,
        scaleY: 1,
      });
      updateGroupBounds(group, true);
    }
  } else {
    if (myType === "line") {
      runtimeObject.set({stroke: color});
    } else {
      const grp = obj as Group;
      grp.getObjects().forEach((child) => {
        if (child.type === "rect") child.set({fill: color});
        if (child.type === "triangle") child.set({fill: color});
      });
    }

    if (label) {
      const textLabel = new IText(label, {
        fontSize: 14,
        fontFamily: "Arial",
        fill: color,
        originX: "center",
        originY: "center",
        textAlign: "center",
        selectable: false,
        evented: false,
        backgroundColor: "rgba(255,255,255,0.8)",
      });
      (textLabel as LineArrowRuntimeObject).myType = "lineArrowLabel";

      const objLeft = obj.left || 0;
      const objTop = obj.top || 0;
      canvas.remove(obj);

      if (obj.type === "line") {
        const lineObj = obj as Line;
        const lw = Math.abs((lineObj.x2 || 0) - (lineObj.x1 || 0));
        lineObj.set({
          x1: -lw / 2,
          y1: 0,
          x2: lw / 2,
          y2: 0,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
        });
      } else {
        obj.set({left: 0, top: 0, originX: "center", originY: "center"});
      }
      textLabel.set({left: 0, top: LINE_ARROW_LABEL_TOP});

      const newGroup = new Group([obj, textLabel], {
        left: objLeft,
        top: objTop,
        originX: "center",
        originY: "center",
        lockScalingY: true,
      });
      const newRuntimeGroup = newGroup as LineArrowRuntimeGroup;
      newRuntimeGroup.myType = runtimeObject.myType;
      newGroup.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

      const labelNormalizedTop = textLabel.top!;
      newGroup.on("scaling", function (this: Group) {
        const runtimeGroup = this as LineArrowRuntimeGroup;
        if (runtimeGroup.__normalizingScale) return;
        runtimeGroup.__normalizingScale = true;
        const totalLength = Math.max((this.width || 1) * (this.scaleX || 1), 1);
        try {
          runtimeGroup._objects.forEach((childObject) => {
            const child = toRuntimeObject(childObject);
            if (child.myType === "lineArrowLabel") {
              child.set({left: 0, top: labelNormalizedTop, scaleX: 1, scaleY: 1, visible: true});
            } else if (child.type === "line") {
              child.set({x1: -totalLength / 2, y1: 0, x2: totalLength / 2, y2: 0, scaleX: 1, scaleY: 1});
            } else if (child.type === "group" && child.myType !== "lineArrowLabel") {
              const arrowChildren = (child as Group)
                .getObjects()
                .map((arrowChild) => toRuntimeObject(arrowChild));
              const triangle = arrowChildren.find((arrowChild) => arrowChild.type === "triangle");
              const headWidth = triangle?.baseWidth || triangle?.width || 15;
              const headHeight = triangle?.baseHeight || triangle?.height || 15;
              const shaftWidth = Math.max(totalLength - headWidth, 1);
              const shaftCenterX = -headWidth / 2;
              const headCenterX = totalLength / 2 - headWidth / 2;

              arrowChildren.forEach((ac) => {
                if (ac.type === "rect") {
                  ac.set({
                    width: shaftWidth,
                    height: 2,
                    left: shaftCenterX,
                    top: 0,
                    scaleX: 1,
                    scaleY: 1,
                  });
                }
                if (ac.type === "triangle") {
                  if (!ac.baseWidth) ac.baseWidth = ac.width || 15;
                  if (!ac.baseHeight) ac.baseHeight = ac.height || 15;
                  ac.set({
                    left: headCenterX,
                    top: 0,
                    width: ac.baseWidth,
                    height: ac.baseHeight,
                    angle: 90,
                    scaleX: 1,
                    scaleY: 1,
                  });
                }
              });
              child.set({left: 0, top: 0, width: totalLength, scaleX: 1, scaleY: 1});
            }
          });

          this.set({width: totalLength, scaleX: 1, scaleY: 1});
          updateGroupBounds(this);
        } finally {
          runtimeGroup.__normalizingScale = false;
        }
      });

      updateGroupBounds(newGroup);
      canvas.add(newGroup);
      canvas.setActiveObject(newGroup);
    }
  }

  canvas.requestRenderAll();
}
