import {
  Canvas as FabricCanvas,
  Circle,
  FabricObject,
  Group,
  IText,
  Line,
  Pattern,
  Polygon,
  Rect,
  Text,
  Triangle,
} from "fabric";
import {MASTER_PILOTI_FILL, MASTER_PILOTI_STROKE, MASTER_SHARED_STROKE_WIDTH,} from "../constants.ts";

export type CanvasRuntimeObject = FabricObject & {
  myType?: string;
  type?: string;
  text?: string;

  width?: number;
  height?: number;
  left?: number;
  top?: number;
  angle?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  baseWidth?: number;
  baseHeight?: number;

  fill?: string;
  stroke?: string;

  getObjects?: () => CanvasRuntimeObject[];
};

export const LINE_ARROW_LABEL_TOP = -20;

export function setCanvasRuntimeObjectMyType(object: object, myType: string): void {
  (object as {myType?: string}).myType = myType;
}

export function normalizeLineGroupToLength(
  group: Group,
  totalLength: number,
  labelTop: number = LINE_ARROW_LABEL_TOP
): void {
  const newWidth = Math.max(totalLength, 1);

  group.getObjects().forEach((childObject) => {
    const child = childObject as CanvasRuntimeObject;
    if (child.myType === "lineBody") {
      child.set({
        x1: -newWidth / 2,
        y1: 0,
        x2: newWidth / 2,
        y2: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === "objLabel") {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1, visible: true});
    }
  });

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}

export function normalizeLineGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  const runtimeGroup = group as Group & {__normalizingScale?: boolean};
  if (runtimeGroup.__normalizingScale) return;
  runtimeGroup.__normalizingScale = true;

  try {
    normalizeLineGroupToLength(group, (group.width || 1) * (group.scaleX || 1), labelTop);
  } finally {
    runtimeGroup.__normalizingScale = false;
  }
}

export function bindLineGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  group.on("scaling", function (this: Group) {
    normalizeLineGroupScaling(this, labelTop);
  });
}

export function normalizeArrowGroupToLength(
  group: Group,
  totalLength: number,
  labelTop: number = LINE_ARROW_LABEL_TOP
): void {
  const newWidth = Math.max(totalLength, 1);

  const children =
    group.getObjects().map(
      (childObject) =>
        childObject as CanvasRuntimeObject
    );

  const arrowHead =
    children.find((child) => child.myType === "arrowHead");

  let headWidth = 15;
  let headHeight = 15;
  if (arrowHead) {
    if (!arrowHead.baseWidth) arrowHead.baseWidth = arrowHead.width || headWidth;
    if (!arrowHead.baseHeight) arrowHead.baseHeight = arrowHead.height || headHeight;
    headWidth = arrowHead.baseWidth;
    headHeight = arrowHead.baseHeight;
  }

  const shaftWidth = Math.max(newWidth - headWidth, 1);
  const shaftCenterX = -headWidth / 2;
  const headCenterX = newWidth / 2 - headWidth / 2;

  children.forEach((child) => {
    if (child.myType === "arrowBody") {
      child.set({
        width: shaftWidth,
        height: 2,
        left: shaftCenterX,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === "arrowHead") {
      child.set({
        left: headCenterX,
        top: 0,
        width: headWidth,
        height: headHeight,
        angle: 90,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === "objLabel") {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1, visible: true});
    }
  });

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}

export function normalizeArrowGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  const runtimeGroup = group as Group & {__normalizingScale?: boolean};
  if (runtimeGroup.__normalizingScale) return;
  runtimeGroup.__normalizingScale = true;

  try {
    normalizeArrowGroupToLength(group, (group.width || 1) * (group.scaleX || 1), labelTop);
  } finally {
    runtimeGroup.__normalizingScale = false;
  }
}

export function bindArrowGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  group.on("scaling", function (this: Group) {
    normalizeArrowGroupScaling(this, labelTop);
  });
}

export function normalizeDistanceGroupToLength(
  group: Group,
  newWidth: number,
  labelTop: number = LINE_ARROW_LABEL_TOP
): void {
  const tickHeight = 10;

  group.getObjects().forEach((childObject) => {
    const child = childObject as CanvasRuntimeObject;
    if (child.myType === "distanceMainLine") {
      child.set({x1: -newWidth / 2, y1: 0, x2: newWidth / 2, y2: 0, scaleX: 1, scaleY: 1});

    } else if (child.myType === "distanceTickStart") {
      child.set({
        x1: 0,
        y1: -tickHeight / 2,
        x2: 0,
        y2: tickHeight / 2,
        left: -newWidth / 2,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });

    } else if (child.myType === "distanceTickEnd") {
      child.set({
        x1: 0,
        y1: -tickHeight / 2,
        x2: 0,
        y2: tickHeight / 2,
        left: newWidth / 2,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });

    } else if (child.myType === "objLabel") {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1});
    }
  });

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}

export function normalizeDistanceGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  const runtimeGroup = group as Group & {__normalizingScale?: boolean};
  if (runtimeGroup.__normalizingScale) return;
  runtimeGroup.__normalizingScale = true;

  try {
    normalizeDistanceGroupToLength(group, group.width! * group.scaleX!, labelTop);
  } finally {
    runtimeGroup.__normalizingScale = false;
  }
}

export function bindDistanceGroupScaling(group: Group, labelTop: number = LINE_ARROW_LABEL_TOP): void {
  group.on("scaling", function (this: Group) {
    normalizeDistanceGroupScaling(this, labelTop);
  });
}

export function createLine(canvas: FabricCanvas): Group {
  const lineColor = "#000000";
  const objLabel = "";
  const w = 200;
  const line = new Line([-w / 2, 0, w / 2, 0], {
    stroke: lineColor,
    strokeWidth: 2,
    strokeLineCap: "round",
    originX: "center",
    originY: "center",
  });
  setCanvasRuntimeObjectMyType(line, "lineBody");

  const textLabel = new IText(objLabel, {
    fontSize: 14,
    fontFamily: 'Arial',
    fill: lineColor,
    originX: 'center',
    originY: 'center',
    textAlign: 'center',
    selectable: false,
    evented: false
  });
  setCanvasRuntimeObjectMyType(textLabel, "objLabel");
  textLabel.set({left: 0, top: LINE_ARROW_LABEL_TOP});

  const group = new Group([line, textLabel], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  setCanvasRuntimeObjectMyType(group, "line");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
  bindLineGroupScaling(group, LINE_ARROW_LABEL_TOP);
  return group;
}

export function createArrow(canvas: FabricCanvas): Group {
  const arrowColor = "#000000";
  const objLabel = "";
  const w = 200;
  const headSize = 15;
  const initialShaftWidth = Math.max(w - headSize, 1);

  const line = new Rect({
    width: initialShaftWidth,
    height: 2,
    fill: arrowColor,
    originX: "center",
    originY: "center",
    left: -headSize / 2,
  });
  setCanvasRuntimeObjectMyType(line, "arrowBody");

  const head = new Triangle({
    width: headSize,
    height: headSize,
    fill: arrowColor,
    angle: 90,
    left: w / 2 - headSize / 2,
    originX: "center",
    originY: "center",
  });
  setCanvasRuntimeObjectMyType(head, "arrowHead");

  const textLabel = new IText(objLabel, {
    fontSize: 14,
    fontFamily: 'Arial',
    fill: arrowColor,
    originX: 'center',
    originY: 'center',
    textAlign: 'center',
    selectable: false,
    evented: false,
  });
  setCanvasRuntimeObjectMyType(textLabel, "objLabel");
  textLabel.set({left: 0, top: LINE_ARROW_LABEL_TOP});

  const group = new Group([line, head, textLabel], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  setCanvasRuntimeObjectMyType(group, "arrow");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
  bindArrowGroupScaling(group, LINE_ARROW_LABEL_TOP);
  return group;
}

export function createDistance(canvas: FabricCanvas, position?: { x: number; y: number }): Group {
  const distanceColor = "#000000";
  const objLabel = "";
  const w = 200;
  const tickHeight = 10;

  const line = new Line([-w / 2, 0, w / 2, 0], {
    stroke: distanceColor,
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    originX: "center",
    originY: "center",
  });
  setCanvasRuntimeObjectMyType(line, "distanceMainLine");

  // Left transversal tick
  const tick1 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: distanceColor,
    strokeWidth: 2,
    left: -w / 2,
    originX: "center",
    originY: "center",
  });
  setCanvasRuntimeObjectMyType(tick1, "distanceTickStart");

  // Right transversal tick
  const tick2 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: distanceColor,
    strokeWidth: 2,
    left: w / 2,
    originX: "center",
    originY: "center",
  });
  setCanvasRuntimeObjectMyType(tick2, "distanceTickEnd");

  const textLabel = new IText(objLabel, {
    fontSize: 14,
    fontFamily: 'Arial',
    fill: distanceColor,
    originX: 'center',
    originY: 'center',
    textAlign: 'center',
    selectable: false,
    evented: false,
  });
  setCanvasRuntimeObjectMyType(textLabel, "objLabel");
  textLabel.set({left: 0, top: LINE_ARROW_LABEL_TOP});

  // Use provided position or default to canvas center.
  const posX = position?.x ?? canvas.width! / 2;
  const posY = position?.y ?? canvas.height! / 2;

  const group = new Group([line, tick1, tick2, textLabel], {
    left: posX,
    top: posY,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
    lockScalingY: true,
  });
  setCanvasRuntimeObjectMyType(group, "distance");
  group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
  bindDistanceGroupScaling(group, LINE_ARROW_LABEL_TOP);
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
  setCanvasRuntimeObjectMyType(group, "water");
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
  setCanvasRuntimeObjectMyType(wall, "wall");

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
  setCanvasRuntimeObjectMyType(group, "gate");
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
  setCanvasRuntimeObjectMyType(group, "fossa");
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
  setCanvasRuntimeObjectMyType(group, "tree");
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
