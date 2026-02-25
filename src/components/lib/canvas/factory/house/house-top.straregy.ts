import {Canvas as FabricCanvas, Circle, FabricObject, Group, IText, Line, Rect, Text} from "fabric";
import {
  BASE_TOP_HEIGHT,
  BASE_TOP_WIDTH,
  CORNER_PILOTI_IDS,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE_COLOR,
  MASTER_PILOTI_STROKE_WIDTH,
} from "../../constants.ts";

import {formatNivel, formatPilotiHeight} from "../../piloti.ts";

export function createHouseTop(canvas: FabricCanvas): Group {
  const s = 0.6;
  const w = BASE_TOP_WIDTH * s;
  const h = BASE_TOP_HEIGHT * s;
  const rad = 15 * s;
  const cD = 155 * s;
  const rD = 135 * s;

  // Main rect with NO stroke (we'll use 4 separate border lines instead)
  const rect = new Rect({
    width: w,
    height: h,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    originX: "center",
    originY: "center",
  });
  (rect as any).isHouseBody = true;

  const houseObjects: FabricObject[] = [rect];

  // Create 4 border lines for individual side highlighting
  const borderStyle = {
    stroke: "black",
    strokeWidth: 2 * s,
    strokeUniform: true,
    selectable: false,
    evented: false,
  };

  const borderTop = new Line([-w / 2, -h / 2, w / 2, -h / 2], {...borderStyle});
  (borderTop as any).isHouseBorderEdge = true;
  (borderTop as any).edgeSide = "top";

  const borderBottom = new Line([-w / 2, h / 2, w / 2, h / 2], {...borderStyle});
  (borderBottom as any).isHouseBorderEdge = true;
  (borderBottom as any).edgeSide = "bottom";

  const borderLeft = new Line([-w / 2, -h / 2, -w / 2, h / 2], {...borderStyle});
  (borderLeft as any).isHouseBorderEdge = true;
  (borderLeft as any).edgeSide = "left";

  const borderRight = new Line([w / 2, -h / 2, w / 2, h / 2], {...borderStyle});
  (borderRight as any).isHouseBorderEdge = true;
  (borderRight as any).edgeSide = "right";

  houseObjects.push(borderTop, borderBottom, borderLeft, borderRight);

  // Door markers on top view (hidden by default, positioned by HouseManager based on side assignments)
  const markerLong = 80 * s;
  const markerShort = 20 * s;
  const markerFill = MASTER_PILOTI_FILL;
  const markerStroke = MASTER_PILOTI_STROKE_COLOR;

  const createDoorMarker = (side: "top" | "bottom" | "left" | "right"): Group => {
    const vertical = side === "left" || side === "right";
    const rect = new Rect({
      width: vertical ? markerShort : markerLong,
      height: vertical ? markerLong : markerShort,
      fill: markerFill,
      stroke: markerStroke,
      strokeWidth: MASTER_PILOTI_STROKE_WIDTH,
      strokeUniform: true,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });

    const label = new Text("Porta", {
      fontSize: 15 * s,
      fontFamily: "Arial",
      fill: "#333",
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      angle: vertical ? 90 : 0,
    });

    const basePos: Record<typeof side, { left: number; top: number }> = {
      top: {left: 0, top: -h / 2},
      bottom: {left: 0, top: h / 2},
      left: {left: -w / 2, top: 0},
      right: {left: w / 2, top: 0},
    };

    const marker = new Group([rect, label], {
      ...basePos[side],
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      visible: false,
      objectCaching: false,
    });
    (marker as any).isTopDoorMarker = true;
    (marker as any).markerSide = side;
    return marker;
  };

  houseObjects.push(
    createDoorMarker("top"),
    createDoorMarker("bottom"),
    createDoorMarker("left"),
    createDoorMarker("right"),
  );

  let pilotiIndex = 0;
  [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD].forEach((x, colIdx) => {
    [-rD, 0, rD].forEach((y, rowIdx) => {
      const pilotiId = `piloti_${colIdx}_${rowIdx}`;
      const defaultHeight = 1.0;
      const defaultIsMaster = false;
      const defaultNivel = 0.2;

      // Invisible hit area for mobile (larger touch target)
      const hitArea = new Circle({
        radius: Math.max(rad * 2.5, 20), // At least 40px diameter
        fill: "transparent",
        stroke: "transparent",
        strokeWidth: 0,
        left: x,
        top: y,
        originX: "center",
        originY: "center",
      });
      (hitArea as any).myType = "pilotiHitArea";
      (hitArea as any).pilotiId = pilotiId;
      (hitArea as any).isPilotiHitArea = true;

      const circle = new Circle({
        radius: rad,
        fill: "white",
        stroke: "black",
        strokeWidth: 1.5 * s,
        left: x,
        top: y,
        originX: "center",
        originY: "center",
      });
      (circle as any).myType = "piloti";
      (circle as any).pilotiId = pilotiId;
      (circle as any).pilotiHeight = defaultHeight;
      (circle as any).pilotiIsMaster = defaultIsMaster;
      (circle as any).pilotiNivel = defaultNivel;
      (circle as any).isPilotiCircle = true;

      const text = new IText(formatPilotiHeight(defaultHeight), {
        fontSize: 15 * s,
        fontFamily: "Arial",
        fill: "#333",
        originX: "center",
        originY: "center",
        left: x,
        top: y,
        editable: false,
        selectable: false,
      });
      (text as any).myType = "pilotiText";
      (text as any).pilotiId = pilotiId;
      (text as any).isPilotiText = true;

      // Text for nivel (always visible for corner pilotis)
      const isCorner = CORNER_PILOTI_IDS.includes(pilotiId);
      const isTopCorner = pilotiId === "piloti_0_0" || pilotiId === "piloti_3_0";
      const nivelText = new IText(isCorner ? `Nível = ${formatNivel(defaultNivel)}` : "", {
        fontSize: 11 * s,
        fontFamily: "Arial",
        fontWeight: "bold",
        fill: "#8B4513",
        originX: "center",
        originY: "center",
        left: x,
        top: isTopCorner ? y - rad - 12 * s : y + rad + 12 * s,
        editable: false,
        selectable: false,
        visible: isCorner,
      });
      (nivelText as any).myType = "pilotiNivelText";
      (nivelText as any).pilotiId = pilotiId;
      (nivelText as any).isPilotiNivelText = true;

      // Add hit area first (behind), then circle, then text, then nivel text
      houseObjects.push(hitArea);
      houseObjects.push(circle);
      houseObjects.push(text);
      houseObjects.push(nivelText);
      pilotiIndex++;
    });
  });

  const group = new Group(houseObjects, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
  });
  (group as any).myType = "house";
  (group as any).houseView = "top";
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}
