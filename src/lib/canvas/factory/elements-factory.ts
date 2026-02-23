import {
  Canvas as FabricCanvas,
  Circle,
  Group,
  IText,
  Line,
  Pattern,
  Polygon,
  Rect,
  Text,
  Triangle,
} from "fabric";
import {
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE,
  MASTER_SHARED_STROKE_WIDTH,
} from "../constants.ts";

type RuntimeTypedObject = {
  myType?: string;
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  angle?: number;
  text?: string;
  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  set: (patch: Record<string, unknown>) => void;
};

const LINE_ARROW_LABEL_TOP = -20;

type UpdatableGroup = Group & {
  addWithUpdate?: () => void;
};

function setRuntimeMyType(object: object, myType: string): void {
  (object as {myType?: string}).myType = myType;
}

function updateGroupBounds(group: Group, recompute = false): void {
  const runtimeGroup = group as UpdatableGroup;
  if (recompute && typeof runtimeGroup.addWithUpdate === "function") {
    runtimeGroup.addWithUpdate();
  }
  group.setCoords();
}

export function createLine(canvas: FabricCanvas): Group {
  const w = 200;
  const line = new Line([-w / 2, 0, w / 2, 0], {
    stroke: "black",
    strokeWidth: 2,
    strokeLineCap: "round",
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(line, "lineBody");

  const label = new IText(" ", {
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    originX: "center",
    originY: "center",
    textAlign: "center",
    selectable: false,
    evented: false,
    backgroundColor: "rgba(255,255,255,0.8)",
    left: 0,
    top: LINE_ARROW_LABEL_TOP,
  });
  setRuntimeMyType(label, "lineArrowLabel");

  const group = new Group([line, label], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  setRuntimeMyType(group, "line");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

  group.on("scaling", function (this: Group) {
    const runtimeGroup = this as Group & {__normalizingScale?: boolean};
    if (runtimeGroup.__normalizingScale) return;
    runtimeGroup.__normalizingScale = true;

    const totalLength = Math.max((this.width || 1) * (this.scaleX || 1), 1);
    try {
      this.getObjects().forEach((childObject) => {
        const child = childObject as unknown as RuntimeTypedObject;
        if (child.myType === "lineBody" && child.type === "line") {
          child.set({
            x1: -totalLength / 2,
            y1: 0,
            x2: totalLength / 2,
            y2: 0,
            scaleX: 1,
            scaleY: 1,
          });
          return;
        }

        if (child.myType === "lineArrowLabel") {
          child.set({left: 0, top: LINE_ARROW_LABEL_TOP, scaleX: 1, scaleY: 1, visible: true});
        }
      });

      this.set({width: totalLength, scaleX: 1, scaleY: 1});
      updateGroupBounds(this);
    } finally {
      runtimeGroup.__normalizingScale = false;
    }
  });

  line.setCoords();
  label.setCoords();
  updateGroupBounds(group);
  return group;
}

export function createArrow(canvas: FabricCanvas): Group {
  const w = 150;
  const h = 15;

  const headSize = h;
  const initialShaftWidth = Math.max(w - headSize, 1);

  const line = new Rect({
    width: initialShaftWidth,
    height: 2,
    fill: "#333",
    originX: "center",
    originY: "center",
    left: -headSize / 2,
  });
  setRuntimeMyType(line, "arrowBody");

  const head = new Triangle({
    width: headSize,
    height: headSize,
    fill: "#333",
    angle: 90,
    left: w / 2 - headSize / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(head, "arrowHead");

  const label = new IText(" ", {
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    originX: "center",
    originY: "center",
    textAlign: "center",
    selectable: false,
    evented: false,
    backgroundColor: "rgba(255,255,255,0.8)",
    left: 0,
    top: LINE_ARROW_LABEL_TOP,
  });
  setRuntimeMyType(label, "lineArrowLabel");

  const group = new Group([line, head, label], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  setRuntimeMyType(group, "arrow");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

  const originalHeadW = headSize;
  const originalHeadH = headSize;

  group.on("scaling", function (this: Group) {
    const runtimeGroup = this as Group & {__normalizingScale?: boolean};
    if (runtimeGroup.__normalizingScale) return;
    runtimeGroup.__normalizingScale = true;

    const totalLength = this.width! * this.scaleX!;
    const shaftWidth = Math.max(totalLength - originalHeadW, 1);
    const shaftCenterX = -originalHeadW / 2;
    const headCenterX = totalLength / 2 - originalHeadW / 2;

    try {
      this.getObjects().forEach((childObject) => {
        const child = childObject as unknown as RuntimeTypedObject;
        if (child.myType === "arrowBody" && child.type === "rect") {
          child.set({
            width: shaftWidth,
            height: 2,
            left: shaftCenterX,
            top: 0,
            scaleX: 1,
            scaleY: 1,
          });
        } else if (child.myType === "arrowHead" && child.type === "triangle") {
          child.set({
            left: headCenterX,
            top: 0,
            width: originalHeadW,
            height: originalHeadH,
            angle: 90,
            scaleX: 1,
            scaleY: 1,
          });
        } else if (child.myType === "lineArrowLabel") {
          child.set({left: 0, top: LINE_ARROW_LABEL_TOP, scaleX: 1, scaleY: 1, visible: true});
        }
      });
      this.set({width: totalLength, scaleX: 1, scaleY: 1});
      updateGroupBounds(this);
    } finally {
      runtimeGroup.__normalizingScale = false;
    }
  });

  line.setCoords();
  head.setCoords();
  label.setCoords();
  updateGroupBounds(group);
  return group;
}

export function createDimension(canvas: FabricCanvas, position?: { x: number; y: number }): Group {
  const w = 200;
  const tickHeight = 10;
  const color = "#C94C4C"; // Softer red

  const line = new Line([-w / 2, 0, w / 2, 0], {
    stroke: color,
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(line, "dimensionMainLine");

  // Left transversal tick
  const tick1 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: color,
    strokeWidth: 2,
    left: -w / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(tick1, "dimensionTickStart");

  // Right transversal tick
  const tick2 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: color,
    strokeWidth: 2,
    left: w / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(tick2, "dimensionTickEnd");

  const text = new IText(" ", {
    fontSize: 16,
    fontFamily: "Arial",
    fill: color,
    backgroundColor: "rgba(255,255,255,0.8)",
    top: -20,
    originX: "center",
    originY: "center",
    editable: false,
    selectable: false,
  });
  setRuntimeMyType(text, "dimensionLabel");

  // Use provided position or default to canvas center
  const posX = position?.x ?? canvas.width! / 2;
  const posY = position?.y ?? canvas.height! / 2;

  const group = new Group([line, tick1, tick2, text], {
    left: posX,
    top: posY,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
    lockScalingY: true,
  });
  setRuntimeMyType(group, "dimension");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

  group.on("scaling", function (this: Group) {
    const runtimeGroup = this as Group & {__normalizingScale?: boolean};
    if (runtimeGroup.__normalizingScale) return;
    runtimeGroup.__normalizingScale = true;

    const nw = this.width! * this.scaleX!;
    try {
      this.getObjects().forEach((childObject) => {
        const child = childObject as unknown as RuntimeTypedObject;
        if (child.myType === "dimensionMainLine" && child.type === "line") {
          child.set({x1: -nw / 2, y1: 0, x2: nw / 2, y2: 0, scaleX: 1, scaleY: 1});
          return;
        }

        if (child.myType === "dimensionTickStart" && child.type === "line") {
          child.set({
            x1: 0,
            y1: -tickHeight / 2,
            x2: 0,
            y2: tickHeight / 2,
            left: -nw / 2,
            top: 0,
            scaleX: 1,
            scaleY: 1,
          });
          return;
        }

        if (child.myType === "dimensionTickEnd" && child.type === "line") {
          child.set({
            x1: 0,
            y1: -tickHeight / 2,
            x2: 0,
            y2: tickHeight / 2,
            left: nw / 2,
            top: 0,
            scaleX: 1,
            scaleY: 1,
          });
          return;
        }

        if (child.myType === "dimensionLabel") {
          child.set({left: 0, top: LINE_ARROW_LABEL_TOP, scaleX: 1, scaleY: 1});
        }
      });

      this.set({width: nw, scaleX: 1, scaleY: 1});
      updateGroupBounds(this);
    } finally {
      runtimeGroup.__normalizingScale = false;
    }
  });

  line.setCoords();
  tick1.setCoords();
  tick2.setCoords();
  text.setCoords();
  updateGroupBounds(group);
  return group;
}

export function createWaterPatternSource(): HTMLCanvasElement {
  const patternCanvas = document.createElement("canvas");
  const ctx = patternCanvas.getContext("2d")!;
  patternCanvas.width = 40;
  patternCanvas.height = 50;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#0092DD";
  ctx.lineCap = "round";

  const drawWave = (y: number) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(10, y - 5, 30, y + 5, 40, y);
    ctx.stroke();
  };

  drawWave(15);
  drawWave(25);
  drawWave(35);

  return patternCanvas;
}

export function createWater(canvas: FabricCanvas): Group {
  const rect = new Rect({
    width: 200,
    height: 50,
    originX: "center",
    originY: "center",
    fill: new Pattern({
      source: createWaterPatternSource(),
      repeat: "repeat-x",
    }),
    transparentCorners: false,
  });

  const text = new Text("Água", {
    fontSize: 12,
    fontFamily: "Arial",
    fill: "#0092DD",
    originX: "center",
    originY: "center",
    fontWeight: "bold",
    stroke: "white",
    strokeWidth: 3,
    paintFirst: "stroke",
  });

  const group = new Group([rect, text], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(group, "water");
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}

export function createStairsPatternSource(s = 1): HTMLCanvasElement {
  const stepSpacing = Math.max(2, Math.round(18 * s));
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = stepSpacing;
  patternCanvas.height = stepSpacing;
  const ctx = patternCanvas.getContext("2d")!;
  ctx.fillStyle = "#C89B6D";
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8B4513";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(stepSpacing, 0);
  ctx.stroke();
  return patternCanvas;
}

export function createWall(canvas: FabricCanvas): Rect {
  const wall = new Rect({
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    width: 200,
    height: 50,
    fill: "rgba(128, 128, 128, 0.3)",
    stroke: "#666666",
    strokeWidth: 2,
    strokeDashArray: [10, 5],
    originX: "center",
    originY: "center",
    lockScalingFlip: true,
  });
  setRuntimeMyType(wall, "wall");

  wall.on("scaling", function (this: Rect) {
    this.set({
      width: this.width! * this.scaleX!,
      height: this.height! * this.scaleY!,
      scaleX: 1,
      scaleY: 1,
    });
  });

  return wall;
}

export function createDoor(canvas: FabricCanvas): Group {
  const rect = new Rect({
    width: 100,
    height: 20,
    fill: MASTER_PILOTI_FILL,
    stroke: MASTER_PILOTI_STROKE,
    strokeWidth: MASTER_SHARED_STROKE_WIDTH,
    originX: "center",
    originY: "center",
    top: -10,
  });

  const text = new Text("Porta", {
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    originX: "center",
    originY: "center",
    top: 10,
  });

  const group = new Group([rect, text], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(group, "gate");
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}

export function createFossa(canvas: FabricCanvas): Group {
  // Fossa séptica - irregular blob shape using Polygon
  const numPoints = 10;
  const baseRadiusX = 60;
  const baseRadiusY = 40;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const variation = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    const rx = baseRadiusX * variation;
    const ry = baseRadiusY * variation;
    points.push({
      x: rx * Math.cos(angle),
      y: ry * Math.sin(angle),
    });
  }

  const blob = new Polygon(points, {
    fill: "rgba(139, 90, 43, 0.3)",
    stroke: "#5D4037",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
  });

  const text = new Text("Fossa", {
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#5D4037",
    fontWeight: "bold",
    originX: "center",
    originY: "center",
  });

  const group = new Group([blob, text], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(group, "fossa");
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}

export function createTree(canvas: FabricCanvas): Group {
  const top = new Circle({
    radius: 35,
    fill: "rgba(46, 204, 113, 0.6)",
    stroke: "#27ae60",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
    top: -10,
  });

  const trunk = new Circle({
    radius: 3,
    fill: "#5d4037",
    originX: "center",
    originY: "center",
    top: -10,
  });

  const text = new Text("Árvore", {
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    originX: "center",
    originY: "center",
    top: 35,
  });

  const group = new Group([top, trunk, text], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
  });
  setRuntimeMyType(group, "tree");
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}

export function createText(canvas: FabricCanvas): IText {
  const text = new IText("Texto", {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    fontFamily: "Arial",
    fill: "#333",
    fontSize: 18,
  });
  text.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  return text;
}
