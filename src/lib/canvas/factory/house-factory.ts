import {Canvas as FabricCanvas, Circle, FabricObject, Group, IText, Line, Polygon, Polyline, Rect, Text,} from "fabric";
import {
  BASE_PILOTI_HEIGHT_PX,
  BASE_TOP_HEIGHT,
  BASE_TOP_WIDTH,
  CORNER_PILOTI_IDS,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE,
  MASTER_SHARED_STROKE_WIDTH,
} from "../constants.ts";
import {formatNivel, formatPilotiHeight} from "../piloti.ts";
import {createDiagonalStripePattern, createGroundElements, getPilotiVisualHeight} from "../piloti-ops.ts";

export function getHouseScaleFactors(canvas: FabricCanvas) {
  const objs = canvas.getObjects();

  // Find the top view (plant view) group
  const topViewGroup = objs.find((o: any) => o.myType === "house" && o.houseView === "top") as any;

  if (topViewGroup) {
    // Get the house body rect inside the group
    const houseBody = topViewGroup.getObjects?.().find((o: any) => o.isHouseBody === true) as any;
    if (houseBody) {
      // Calculate actual dimensions considering group scale and object scale
      const groupScaleX = topViewGroup.scaleX || 1;
      const groupScaleY = topViewGroup.scaleY || 1;
      const currentW = houseBody.width * (houseBody.scaleX || 1) * groupScaleX;
      const currentH = houseBody.height * (houseBody.scaleY || 1) * groupScaleY;
      return {
        widthFactor: currentW / BASE_TOP_WIDTH,
        depthFactor: currentH / BASE_TOP_HEIGHT,
        actualWidth: currentW,
        actualHeight: currentH,
      };
    }
  }

  // Fallback: look for standalone house body (legacy support)
  const houseBody = objs.find((o: any) => o.isHouseBody === true) as any;
  if (houseBody) {
    const currentW = houseBody.width * (houseBody.scaleX || 1);
    const currentH = houseBody.height * (houseBody.scaleY || 1);
    return {
      widthFactor: currentW / BASE_TOP_WIDTH,
      depthFactor: currentH / BASE_TOP_HEIGHT,
      actualWidth: currentW,
      actualHeight: currentH,
    };
  }

  const defaultS = 0.6;
  return {
    widthFactor: defaultS,
    depthFactor: defaultS,
    actualWidth: BASE_TOP_WIDTH * defaultS,
    actualHeight: BASE_TOP_HEIGHT * defaultS,
  };
}

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
  const markerStroke = MASTER_PILOTI_STROKE;

  const createDoorMarker = (side: "top" | "bottom" | "left" | "right"): Group => {
    const vertical = side === "left" || side === "right";
    const rect = new Rect({
      width: vertical ? markerShort : markerLong,
      height: vertical ? markerLong : markerShort,
      fill: markerFill,
      stroke: markerStroke,
      strokeWidth: MASTER_SHARED_STROKE_WIDTH,
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

// Create a stripe overlay rect for the bottom 2/3 of a piloti rect
function createPilotiStripeOverlay(
  pilotiId: string,
  left: number,
  top: number,
  width: number,
  fullHeight: number,
): Rect {
  const stripeHeight = (fullHeight * 2) / 3;
  const stripeTop = top + fullHeight / 3;

  const stripe = new Rect({
    width,
    height: stripeHeight,
    fill: createDiagonalStripePattern(),
    left,
    top: stripeTop,
    originY: "top",
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
    opacity: 0.5,
  });
  (stripe as any).isPilotiStripe = true;
  (stripe as any).pilotiId = pilotiId;
  return stripe;
}

export function createHouseFrontBack(canvas: FabricCanvas, isFront: boolean, flipHorizontal: boolean = false): Group {
  const factors = getHouseScaleFactors(canvas);

  // Front/Back views use the WIDTH of the plant view (horizontal side)
  // The body width should match the plant view's width exactly
  const plantWidth = factors.actualWidth;
  const s = factors.widthFactor;

  const bodyW = plantWidth; // Match the plant view width exactly
  const bodyH = 273 * s;

  const floorW = bodyW;
  const floorH = 10 * s;

  const floorBeanW = bodyW;
  const floorBeanH = 20 * s;

  const pilotW = 30 * s;

  const pilots: FabricObject[] = [];
  const margin = 55 * s;
  const step = (bodyW - 2 * margin - pilotW) / 3;

  // Position determines piloti IDs (not view type):
  // Top position (flipHorizontal=true): pilotis A4, A3, A2, A1 (row 0, reversed)
  // Bottom position (flipHorizontal=false): pilotis C1, C2, C3, C4 (row 2, normal order)
  const rowIndex = flipHorizontal ? 0 : 2;

  const pilotLabels: FabricObject[] = [];

  for (let i = 0; i < 4; i++) {
    // Top position: reversed order (A4, A3, A2, A1)
    // Bottom position: normal order (C1, C2, C3, C4)
    const colIndex = flipHorizontal ? 3 - i : i;
    const pilotiId = `piloti_${colIndex}_${rowIndex}`;
    const defaultHeight = 1.0;
    const pilotH = getPilotiVisualHeight(defaultHeight, s);

    const rect = new Rect({
      width: pilotW,
      height: pilotH,
      fill: "#ffffff",
      stroke: "#333",
      strokeWidth: 2,
      strokeUniform: true,
      left: margin + i * step,
      top: bodyH + floorH + floorBeanH,
      originY: "top",
      objectCaching: false,
    });
    (rect as any).myType = "piloti";
    (rect as any).pilotiId = pilotiId;
    (rect as any).pilotiHeight = defaultHeight;
    (rect as any).pilotiIsMaster = false;
    (rect as any).pilotiNivel = 0.2;
    (rect as any).isPilotiRect = true;
    (rect as any).pilotiBaseHeight = BASE_PILOTI_HEIGHT_PX * s;

    pilots.push(rect);

    // Add diagonal stripe overlay for bottom 2/3
    const stripeOverlay = createPilotiStripeOverlay(pilotiId, margin + i * step, bodyH + floorH + floorBeanH, pilotW, pilotH);
    pilots.push(stripeOverlay);

    // Create size label below piloti (font size 20 * scale for visibility)
    // Position at center of piloti rect (rect.left + pilotW/2)
    const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
      fontSize: 20 * s,
      fill: "#666",
      backgroundColor: "#ffffff",
      left: margin + i * step + pilotW / 2,
      top: bodyH + floorH + floorBeanH + pilotH + 8 * s,
      originX: "center",
      originY: "top",
      selectable: false,
      evented: false,
    });
    (sizeLabel as any).isPilotiSizeLabel = true;
    (sizeLabel as any).pilotiId = pilotiId;

    pilotLabels.push(sizeLabel);
  }

  const diagH1 = 213 * s;
  const diagH2 = 261 * s;
  const diagW = 244 * s;

  const leftDiagFill = new Polygon(
    [
      {x: 0, y: diagH2 - diagH1},
      {x: diagW, y: 0},
      {x: diagW, y: diagH2},
      {x: 0, y: diagH2},
    ],
    {fill: "#eeeeee", strokeWidth: 1, left: 0, top: bodyH - diagH2},
  );

  const chapelW = 122 * s;

  const chapelFill = new Polygon(
    [
      {x: 0, y: bodyH - diagH2},
      {x: chapelW / 2, y: 0},
      {x: chapelW, y: bodyH - diagH2},
      {x: chapelW, y: bodyH},
      {x: 0, y: bodyH},
    ],
    {fill: "#eeeeee", strokeWidth: 1, left: diagW, top: 0},
  );

  const rightDiagFill = new Polygon(
    [
      {x: 0, y: 0},
      {x: diagW, y: diagH2 - diagH1},
      {x: diagW, y: diagH2},
      {x: 0, y: diagH2},
    ],
    {fill: "#eeeeee", strokeWidth: 1, left: diagW + chapelW, top: bodyH - diagH2},
  );

  const bodyStroke = new Polyline(
    [
      {x: 0, y: bodyH - diagH1},
      {x: bodyW / 2, y: 0},
      {x: bodyW, y: bodyH - diagH1},
      {x: bodyW, y: bodyH},
      {x: 0, y: bodyH},
      {x: 0, y: bodyH - diagH1},
    ],
    {fill: "transparent", stroke: "#333", strokeWidth: 2, strokeUniform: true, left: 0, top: 0},
  );

  const elements: FabricObject[] = [leftDiagFill, chapelFill, rightDiagFill, bodyStroke];

  const floor = new Rect({
    width: floorW,
    height: floorH,
    fill: "#fff",
    stroke: "#333",
    strokeWidth: 2,
    strokeUniform: true,
    left: 0,
    top: bodyH,
  });
  elements.push(floor);

  const floorBean = new Rect({
    width: floorBeanW,
    height: floorBeanH,
    fill: "#fff",
    stroke: "#333",
    strokeWidth: 2,
    strokeUniform: true,
    left: 0,
    top: bodyH + floorH,
  });
  elements.push(floorBean);

  // Front view: door + 2 windows
  // Back view: only right window (w1), no door, no left window
  const doorW = 80 * s;
  const doorH = 191 * s;
  const doorShiftX = 30 * s;

  const windowW = 80 * s;
  const windowH = 70 * s;
  const windowShiftX = 30 * s;

  const doorX = bodyW - windowW - windowShiftX - doorW - doorShiftX;
  const doorY = bodyH - doorH;

  const window1FrontX = bodyW - windowW - windowShiftX;
  const window1FrontY = bodyH - doorH;

  const window1BackX = 95 * s;
  const window1BackY = bodyH - doorH;

  const window2X = 95 * s;
  const window2Y = bodyH - doorH;

  if (isFront) {
    // Front view: right window next to door
    const w1 = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: window1FrontX,
      top: window1FrontY,
    });
    elements.push(w1);
  } else {
    // Back view: window on the left side (mirrored from front)
    const w1 = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: window1BackX,
      top: window1BackY,
    });
    elements.push(w1);
  }

  if (isFront) {
    const doorObj = new Rect({
      width: doorW,
      height: doorH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: doorX,
      top: doorY,
    });

    const w2 = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: window2X,
      top: window2Y,
    });

    elements.push(doorObj, w2);
  }

  // Add ground line (behind house/pilotis) + markers/labels (in front)
  const defaultNivelVal = 0.2;
  const groundSeed = flipHorizontal ? 42 : 137;
  const leftX = -50;
  const leftCenterX = margin + pilotW / 2;
  const rightX = bodyW + 50;
  const rightCenterX = margin + 3 * step + pilotW / 2;
  const nivelY = bodyH + defaultNivelVal * 100 * s;
  const nivelStr = formatNivel(defaultNivelVal);
  const maxPilotiBottom = bodyH + getPilotiVisualHeight(1.0, s);
  const groundElems = createGroundElements(
    leftX,
    leftCenterX,
    nivelY,
    rightX,
    rightCenterX,
    nivelY,
    s,
    groundSeed,
    nivelStr,
    nivelStr,
    maxPilotiBottom,
  );
  const groundBack = groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(...pilots);
  elements.push(...pilotLabels);
  elements.push(...groundBack);
  elements.push(...groundFront);

  const group = new Group(elements, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
    objectCaching: false,
  });
  (group as any).myType = "house";
  (group as any).houseView = isFront ? "front" : "back";
  (group as any).isFlippedHorizontally = flipHorizontal;

  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}

export function createHouseSide(canvas: FabricCanvas, hasDoor: boolean, isRightSide: boolean = false): Group {
  const factors = getHouseScaleFactors(canvas);

  // Side views use the HEIGHT/DEPTH of the plant view (vertical side)
  // The side width should match the plant view's height exactly
  const plantHeight = factors.actualHeight;
  const s = factors.depthFactor;

  const sideWidth = plantHeight; // Match the plant view height exactly
  const wallHeight = 213 * s;

  const floorW = sideWidth;
  const floorH = 10 * s;

  const floorBeanW = 10 * s;
  const floorBeanH = 20 * s;

  const pilotW = 30 * s;

  // Left side: pilotis correspond to column 0 (A1, B1, C1)
  // Right side: pilotis correspond to column 3 (C4, B4, A4 - reversed order)
  const colIndex = isRightSide ? 3 : 0;

  const pilotLabels: FabricObject[] = [];

  // Create pilotis with tracking
  const createPilotiRect = (rowIndex: number, left: number) => {
    const pilotiId = `piloti_${colIndex}_${rowIndex}`;
    const defaultHeight = 1.0;
    const pilotH = getPilotiVisualHeight(defaultHeight, s);

    const rect = new Rect({
      width: pilotW,
      height: pilotH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 2,
      strokeUniform: true,
      left,
      top: wallHeight + floorH + floorBeanH,
      originY: "top",
      objectCaching: false,
    });
    (rect as any).myType = "piloti";
    (rect as any).pilotiId = pilotiId;
    (rect as any).pilotiHeight = defaultHeight;
    (rect as any).pilotiIsMaster = false;
    (rect as any).pilotiNivel = 0.2;
    (rect as any).isPilotiRect = true;
    (rect as any).pilotiBaseHeight = BASE_PILOTI_HEIGHT_PX * s;

    // Create size label below piloti
    const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
      fontSize: 20 * s,
      fill: "#666",
      backgroundColor: "#ffffff",
      left: left + pilotW / 2,
      top: wallHeight + floorH + floorBeanH + pilotH + 8 * s,
      originX: "center",
      originY: "top",
      selectable: false,
      evented: false,
    });
    (sizeLabel as any).isPilotiSizeLabel = true;
    (sizeLabel as any).pilotiId = pilotiId;

    pilotLabels.push(sizeLabel);

    return rect;
  };

  // For right side: C4, B4, A4 (row 2, 1, 0 from left to right)
  // For left side: A1, B1, C1 (row 0, 1, 2 from left to right)
  const p1 = createPilotiRect(isRightSide ? 2 : 0, 0);
  const p2 = createPilotiRect(1, (sideWidth - pilotW) / 2);
  const p3 = createPilotiRect(isRightSide ? 0 : 2, sideWidth - pilotW);

  const wall = new Rect({
    width: sideWidth,
    height: wallHeight,
    fill: "#eeeeee",
    stroke: "#333",
    strokeWidth: 2,
    strokeUniform: true,
    left: 0,
    top: 0,
  });

  const elements: FabricObject[] = [wall];

  const floor = new Rect({
    width: floorW,
    height: floorH,
    fill: "#fff",
    stroke: "#333",
    strokeWidth: 2,
    strokeUniform: true,
    left: 0,
    top: wallHeight,
  });
  elements.push(floor);

  const createFloorBeanRect = (left: number) => {
    const floorBean = new Rect({
      width: floorBeanW,
      height: floorBeanH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 2,
      strokeUniform: true,
      left: left,
      top: wallHeight + floorH,
    });
    elements.push(floorBean);
  };

  createFloorBeanRect(0);
  createFloorBeanRect((sideWidth - floorBeanW) / 2);
  createFloorBeanRect(sideWidth - floorBeanW);

  if (hasDoor) {
    const doorW = 80 * s;
    const doorH = 191 * s;
    const doorShiftX = 45 * s;

    const windowW = 80 * s;
    const windowH = 70 * s;
    const windowShiftX = 45 * s;

    const doorX = sideWidth - doorW - doorShiftX;
    const doorY = wallHeight - doorH;

    const windowX = sideWidth - doorW - doorShiftX - windowW - windowShiftX;
    const windowY = wallHeight - doorH;

    const doorObj = new Rect({
      width: doorW,
      height: doorH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: doorX,
      top: doorY,
    });

    const windowObj = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: windowX,
      top: windowY,
    });

    elements.push(windowObj, doorObj);
  }

  // Add ground line (behind) + markers/labels (in front)
  const defaultNivelVal = 0.2;
  const groundSeed = isRightSide ? 314 : 217;
  const leftX = -50;
  const leftCenterX = pilotW / 2;
  const rightX = sideWidth + 50;
  const rightCenterX = sideWidth - pilotW / 2;
  const nivelY = wallHeight + floorH + floorBeanH + defaultNivelVal * 100 * s;
  const nivelStr = formatNivel(defaultNivelVal);
  const maxPilotiBottom = wallHeight + getPilotiVisualHeight(1.0, s);
  const groundElems = createGroundElements(
    leftX,
    leftCenterX,
    nivelY,
    rightX,
    rightCenterX,
    nivelY,
    s,
    groundSeed,
    nivelStr,
    nivelStr,
    maxPilotiBottom,
  );
  const groundBack = groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(p1, p2, p3);

  // Add diagonal stripe overlays for each piloti
  const pilotiRects = [p1, p2, p3];
  for (const pr of pilotiRects) {
    const prAny = pr as any;
    const stripeOverlay = createPilotiStripeOverlay(prAny.pilotiId, pr.left ?? 0, pr.top ?? 0, pilotW, pr.height ?? 0);
    elements.push(stripeOverlay);
  }
  elements.push(...pilotLabels);
  elements.push(...groundBack);
  elements.push(...groundFront);

  const group = new Group(elements, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
    objectCaching: false,
  });
  (group as any).myType = "house";
  (group as any).houseView = "side";
  (group as any).isRightSide = isRightSide;
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}
