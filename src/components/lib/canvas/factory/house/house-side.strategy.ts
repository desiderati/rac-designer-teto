import {Canvas as FabricCanvas, FabricObject, Group, Rect, Text} from "fabric";
import {BASE_PILOTI_HEIGHT_PX} from "../../constants.ts";

import {createGroundElements, formatNivel, formatPilotiHeight, getPilotiVisualHeight} from "../../piloti.ts";
import {createPilotiStripeOverlay, getHouseScaleFactors} from "@/components/lib/canvas/factory/house/shared.ts";

export function createHouseSide(
  canvas: FabricCanvas,
  hasDoor: boolean,
  isRightSide: boolean = false
): Group {
  const factors = getHouseScaleFactors(canvas);

  // Side views use the HEIGHT/DEPTH of the plant view (vertical side)
  // The side width should match the plant view's height exactly
  const plantHeight = factors.actualHeight;
  const s = factors.depthFactor;

  // Match the plant view height exactly
  const sideWidth = plantHeight;
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
  const createPilotiRect =
    (rowIndex: number, left: number) => {
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
  const groundBack =
    groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);

  const groundFront =
    groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(p1, p2, p3);

  // Add diagonal stripe overlays for each piloti
  const pilotiRects = [p1, p2, p3];
  for (const pr of pilotiRects) {
    const prAny = pr as any;
    const stripeOverlay =
      createPilotiStripeOverlay(prAny.pilotiId, pr.left ?? 0, pr.top ?? 0, pilotW, pr.height ?? 0);
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
