import {
  Canvas as FabricCanvas,
  Rect,
  Circle,
  IText,
  Group,
  Line,
  Triangle,
  Polygon,
  Polyline,
  Text,
  Pattern,
  FabricObject,
} from "fabric";

export const CANVAS_WIDTH = 1300;
export const CANVAS_HEIGHT = 1300;
export const BASE_TOP_WIDTH = 610;
export const BASE_TOP_HEIGHT = 300;

export const customProps = [
  "myType",
  "lockScalingFlip",
  "subTargetCheck",
  "id",
  "selectable",
  "lockScalingY",
  "houseView",
  "houseViewType",
  "houseInstanceId",
  "houseSide",
  "isHouseBody",
  "pilotiId",
  "pilotiHeight",
  "pilotiIsMaster",
  "pilotiNivel",
  "isPilotiCircle",
  "isPilotiText",
  "isPilotiHitArea",
  "isPilotiNivelText",
  "isPilotiRect",
  "pilotiBaseHeight",
  "isPilotiSizeLabel",
  "isHouseBorderEdge",
  "edgeSide",
  "isGroundElement",
  "isGroundLine",
  "isGroundSegment",
  "isNivelMarker",
  "isNivelLabel",
  "isGroundFill",
  "groundSeed",
  "isRightSide",
  "isFlippedHorizontally",
  "isPilotiStripe",
  "isTopDoorMarker",
  "markerSide",
  "isContraventamento",
  "isContraventamentoElevation",
  "contraventamentoId",
  "contraventamentoCol",
  "contraventamentoStartRow",
  "contraventamentoEndRow",
  "contraventamentoSide",
  "contraventamentoAnchorPilotiId",
  "contraventamentoSourcePilotiId",
];

// Extend FabricObject prototype to include custom properties in serialization
const originalToObject = FabricObject.prototype.toObject;
FabricObject.prototype.toObject = function (propertiesToInclude: string[] = []) {
  return originalToObject.call(this, [...customProps, ...propertiesToInclude]);
};

export const PILOTI_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0];

// Colors for master piloti (same as door - light brown)
export const MASTER_PILOTI_FILL = "#D4A574";
export const MASTER_PILOTI_STROKE = "#8B4513";
const MASTER_SHARED_STROKE_WIDTH = 2;

// Corner piloti IDs (A1, A4, C1, C4) - only these can be master and have nivel
export const CORNER_PILOTI_IDS = ["piloti_0_0", "piloti_3_0", "piloti_0_2", "piloti_3_2"];

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

  const borderTop = new Line([-w / 2, -h / 2, w / 2, -h / 2], { ...borderStyle });
  (borderTop as any).isHouseBorderEdge = true;
  (borderTop as any).edgeSide = "top";

  const borderBottom = new Line([-w / 2, h / 2, w / 2, h / 2], { ...borderStyle });
  (borderBottom as any).isHouseBorderEdge = true;
  (borderBottom as any).edgeSide = "bottom";

  const borderLeft = new Line([-w / 2, -h / 2, -w / 2, h / 2], { ...borderStyle });
  (borderLeft as any).isHouseBorderEdge = true;
  (borderLeft as any).edgeSide = "left";

  const borderRight = new Line([w / 2, -h / 2, w / 2, h / 2], { ...borderStyle });
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
      top: { left: 0, top: -h / 2 },
      bottom: { left: 0, top: h / 2 },
      left: { left: -w / 2, top: 0 },
      right: { left: w / 2, top: 0 },
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
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

  return group;
}

export function formatPilotiHeight(height: number): string {
  return height.toFixed(1).replace(".", ",");
}

export function formatNivel(nivel: number): string {
  return nivel.toFixed(2).replace(".", ",");
}

// Get piloti name from ID (e.g., "piloti_0_0" -> "A1")
export function getPilotiName(pilotiId: string): string {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return pilotiId;

  const col = parseInt(match[1], 10);
  const row = parseInt(match[2], 10);

  const rowLetter = String.fromCharCode(65 + row); // 0 -> A, 1 -> B, 2 -> C
  const colNumber = col + 1; // 0 -> 1, 1 -> 2, etc.

  return `${rowLetter}${colNumber}`;
}

// Get ordered list of all piloti IDs
export function getAllPilotiIds(): string[] {
  const ids: string[] = [];
  // Order: A1, A2, A3, A4, B1, B2, B3, B4, C1, C2, C3, C4
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ids.push(`piloti_${col}_${row}`);
    }
  }
  return ids;
}

// Get piloti IDs that actually exist inside a given house group, ordered like getAllPilotiIds()
export function getPilotiIdsFromGroup(group: Group): string[] {
  const present = new Set<string>();
  group.getObjects().forEach((obj: any) => {
    if ((obj.isPilotiCircle || obj.isPilotiRect) && typeof obj.pilotiId === "string") {
      present.add(obj.pilotiId);
    }
  });

  return getAllPilotiIds().filter((id) => present.has(id));
}

// Get next/previous piloti ID
export function getAdjacentPilotiId(currentId: string, direction: "next" | "prev"): string | null {
  const allIds = getAllPilotiIds();
  const currentIndex = allIds.indexOf(currentId);

  if (currentIndex === -1) return null;

  if (direction === "next" && currentIndex < allIds.length - 1) {
    return allIds[currentIndex + 1];
  }
  if (direction === "prev" && currentIndex > 0) {
    return allIds[currentIndex - 1];
  }

  return null;
}

// Get piloti data from group (works for both circles in top view and rects in front/back/side views)
export function getPilotiFromGroup(
  group: Group,
  pilotiId: string,
): {
  circle: FabricObject;
  height: number;
  isMaster: boolean;
  nivel: number;
} | null {
  const objects = group.getObjects();

  for (const obj of objects) {
    if ((obj as any).pilotiId === pilotiId && ((obj as any).isPilotiCircle || (obj as any).isPilotiRect)) {
      return {
        circle: obj,
        height: (obj as any).pilotiHeight || 1.0,
        isMaster: (obj as any).pilotiIsMaster || false,
        nivel: (obj as any).pilotiNivel ?? 0.2,
      };
    }
  }

  return null;
}

export function updatePilotiHeight(group: Group, pilotiId: string, newHeight: number): void {
  const objects = group.getObjects();

  // Fabric caching note:
  // Groups can cache to an offscreen canvas; when a child grows, the cached bounds can clip the new geometry.
  // We disable caching + force a refresh to guarantee the new rect is actually redrawn.
  (group as any).objectCaching = false;

  // Track delta to keep the house centered while piloti rect grows downwards.
  // (Rects in front/back/side use originY="top", so growth increases maxY only.)
  let rectHeightDelta = 0;

  objects.forEach((obj: any) => {
    if (obj.pilotiId !== pilotiId) return;

    if (obj.isPilotiCircle) {
      obj.pilotiHeight = newHeight;
      (obj as any).dirty = true;
      return;
    }

    if (obj.isPilotiRect) {
      // Disable caching for the rect itself as well (prevents "corte" after resize)
      obj.objectCaching = false;

      const oldHeight = (obj.getScaledHeight?.() ?? obj.height ?? 0) as number;
      obj.pilotiHeight = newHeight;

      const baseHeight = obj.pilotiBaseHeight || 60; // fallback
      const s = baseHeight / BASE_PILOTI_HEIGHT_PX;
      const newVisualHeight = baseHeight * newHeight;
      rectHeightDelta = newVisualHeight - oldHeight;

      // IMPORTANT: reset scaling so height is the real source of truth
      obj.set({ height: newVisualHeight, scaleY: 1 });
      obj.setCoords();
      (obj as any).dirty = true;

      // Update size label position using the *same* computed height (no guessing)
      const sizeLabel = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiSizeLabel) as any;
      if (sizeLabel) {
        const offset = 8 * s;
        const rectWidth = (obj.width ?? 0) as number;
        sizeLabel.set("left", (obj.left ?? 0) + rectWidth / 2);
        sizeLabel.set("top", (obj.top ?? 0) + newVisualHeight + offset);
        sizeLabel.set("text", formatPilotiHeight(newHeight));
        sizeLabel.setCoords();
        (sizeLabel as any).dirty = true;
      }

      return;
    }

    if (obj.isPilotiStripe) {
      // Update stripe overlay to cover bottom 2/3 of the new piloti height
      const pilotiRect = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiRect) as any;
      if (pilotiRect) {
        const newVisualHeight = (pilotiRect.height ?? 0) as number;
        const stripeHeight = (newVisualHeight * 2) / 3;
        obj.set({ height: stripeHeight, top: (pilotiRect.top ?? 0) + newVisualHeight / 3 });
        obj.set("fill", createDiagonalStripePattern());
        obj.objectCaching = false;
        obj.setCoords();
        (obj as any).dirty = true;
      }
      return;
    }

    if (obj.isPilotiText) {
      obj.set("text", formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
    }

    if (obj.isPilotiSizeLabel) {
      obj.set("text", formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
    }
  });

  // Keep the house centered in the canvas when the piloti grows (avoid bottom cut by viewport).
  if (rectHeightDelta !== 0) {
    group.set("top", (group.top || 0) - rectHeightDelta / 2);
  }

  group.canvas?.requestRenderAll();
}

/**
 * Forces Fabric to rebuild caches/bounds for house groups so resized pilotis are actually redrawn.
 * This also fixes Ctrl+Z restore cases where the group comes back "cortado" due to stale cache.
 * IMPORTANT: We must remove and re-add children to force the group to recalculate its bounding box
 * correctly in Fabric v6.
 */
export function refreshHouseGroupRendering(group: Group): void {
  (group as any).objectCaching = false;

  // Keep house interaction constraints stable after JSON restore/undo.
  if ((group as any).myType === "house") {
    group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
  }

  const objects = group.getObjects();

  objects.forEach((obj: any) => {
    obj.objectCaching = false;
    (obj as any).dirty = true;
    obj.setCoords?.();
  });

  // Z-order sort: normal objects (pilotis, walls, roof) -> ground fill/line -> markers/labels
  // Ground elements render IN FRONT of pilotis
  const groundBack = objects.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = objects.filter((o: any) => o.isNivelMarker || o.isNivelLabel);
  const normal = objects.filter((o: any) => !o.isGroundElement);
  const sorted = [...normal, ...groundBack, ...groundFront];

  // Replace _objects array in-place to reorder Z without remove/add coordinate transforms
  const internalObjects = (group as any)._objects;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.length = 0;
    internalObjects.push(...sorted);
  }

  // Polyline/Polygon need pathOffset recalculation
  objects.forEach((obj: any) => {
    if (obj instanceof Polyline || obj instanceof Polygon) {
      obj.setDimensions?.();
    }
  });

  // Recalculate bounds without triggering object coordinate transforms
  (group as any)._clearCache?.();
  (group as any)._calcBounds?.();
  group.setCoords();
  (group as any).dirty = true;
}

export function refreshHouseGroupsOnCanvas(canvas: FabricCanvas): void {
  canvas.getObjects().forEach((obj: any) => {
    if (obj?.type === "group" && obj?.myType === "house") {
      refreshHouseGroupRendering(obj as Group);
    }
  });
}

export function updatePilotiMaster(group: Group, pilotiId: string, isMaster: boolean, nivel: number): void {
  const objects = group.getObjects();

  if (isMaster) {
    objects.forEach((obj: any) => {
      if (obj.pilotiId !== pilotiId) {
        if ((obj.isPilotiCircle || obj.isPilotiRect) && obj.pilotiIsMaster) {
          obj.pilotiIsMaster = false;
          obj.set("fill", obj.isPilotiRect ? "#fff" : "white");
          obj.set("stroke", obj.isPilotiRect ? "#333" : "black");
          obj.set("strokeWidth", obj.isPilotiRect ? 2 : 1.5 * 0.6);
        }
        // Keep nivel text visible for corner pilotis even when losing master status
        if (obj.isPilotiNivelText && !CORNER_PILOTI_IDS.includes(obj.pilotiId)) {
          obj.set("text", "");
          obj.set("visible", false);
        }
      }
    });
  }

  // Now update the target piloti
  objects.forEach((obj: any) => {
    if (obj.pilotiId === pilotiId) {
      if (obj.isPilotiCircle || obj.isPilotiRect) {
        obj.pilotiIsMaster = isMaster;
        obj.pilotiNivel = nivel;

        // Update visual style based on isMaster
        if (isMaster) {
          obj.set("fill", MASTER_PILOTI_FILL);
          obj.set("stroke", MASTER_PILOTI_STROKE);
          obj.set("strokeWidth", obj.isPilotiRect ? 3 : 2);
        } else {
          obj.set("fill", obj.isPilotiRect ? "#fff" : "white");
          obj.set("stroke", obj.isPilotiRect ? "#333" : "black");
          obj.set("strokeWidth", obj.isPilotiRect ? 2 : 1.5 * 0.6);
        }
      }
      if (obj.isPilotiNivelText) {
        const isCorner = CORNER_PILOTI_IDS.includes(pilotiId);
        if (isCorner) {
          const pilotiCircle = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiCircle) as any;
          const centerX = Number(pilotiCircle?.left ?? obj.left ?? 0);
          const centerY = Number(pilotiCircle?.top ?? obj.top ?? 0);
          const radius = Number(pilotiCircle?.radius ?? 15 * 0.6);
          const offset = 12 * 0.6;
          const isTopCorner = pilotiId === "piloti_0_0" || pilotiId === "piloti_3_0";

          obj.set("text", `Nível = ${formatNivel(nivel)}`);
          obj.set("left", centerX);
          obj.set("top", isTopCorner ? centerY - radius - offset : centerY + radius + offset);
          obj.set("visible", true);
        } else {
          obj.set("text", "");
          obj.set("visible", false);
        }
      }
    }
  });

  group.dirty = true;
}

export function updatePilotiAll(
  group: Group,
  pilotiId: string,
  newHeight: number,
  isMaster: boolean,
  nivel: number,
): void {
  updatePilotiHeight(group, pilotiId, newHeight);
  updatePilotiMaster(group, pilotiId, isMaster, nivel);
}

// Base piloti height in pixels for height=1.0
export const BASE_PILOTI_HEIGHT_PX = 100;

// Create a diagonal stripe pattern for piloti fill (bottom 2/3)
export function createDiagonalStripePattern(): Pattern {
  const size = 10; // pattern tile size
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.2;
  // Draw diagonal line across the tile
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.stroke();
  // Extra line for seamless tiling
  ctx.beginPath();
  ctx.moveTo(-size, size);
  ctx.lineTo(size, -size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 2 * size);
  ctx.lineTo(2 * size, 0);
  ctx.stroke();

  return new Pattern({
    source: canvas,
    repeat: "repeat",
  });
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

// Calculate piloti visual height based on pilotiHeight value
export function getPilotiVisualHeight(pilotiHeight: number, scale: number): number {
  return BASE_PILOTI_HEIGHT_PX * pilotiHeight * scale;
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
      { x: 0, y: diagH2 - diagH1 },
      { x: diagW, y: 0 },
      { x: diagW, y: diagH2 },
      { x: 0, y: diagH2 },
    ],
    { fill: "#eeeeee", strokeWidth: 1, left: 0, top: bodyH - diagH2 },
  );

  const chapelW = 122 * s;

  const chapelFill = new Polygon(
    [
      { x: 0, y: bodyH - diagH2 },
      { x: chapelW / 2, y: 0 },
      { x: chapelW, y: bodyH - diagH2 },
      { x: chapelW, y: bodyH },
      { x: 0, y: bodyH },
    ],
    { fill: "#eeeeee", strokeWidth: 1, left: diagW, top: 0 },
  );

  const rightDiagFill = new Polygon(
    [
      { x: 0, y: 0 },
      { x: diagW, y: diagH2 - diagH1 },
      { x: diagW, y: diagH2 },
      { x: 0, y: diagH2 },
    ],
    { fill: "#eeeeee", strokeWidth: 1, left: diagW + chapelW, top: bodyH - diagH2 },
  );

  const bodyStroke = new Polyline(
    [
      { x: 0, y: bodyH - diagH1 },
      { x: bodyW / 2, y: 0 },
      { x: bodyW, y: bodyH - diagH1 },
      { x: bodyW, y: bodyH },
      { x: 0, y: bodyH },
      { x: 0, y: bodyH - diagH1 },
    ],
    { fill: "transparent", stroke: "#333", strokeWidth: 2, strokeUniform: true, left: 0, top: 0 },
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
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

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
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

  return group;
}

// Seeded random number generator for deterministic ground line variation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate irregular ground line points with 3 segments:
// 1. leftX → leftCenterX: flat at leftY
// 2. leftCenterX → rightCenterX: slope from leftY to rightY
// 3. rightCenterX → rightX: flat at rightY
function generateGroundLinePoints(
  leftX: number,
  leftY: number,
  rightX: number,
  rightY: number,
  seed: number,
  leftCenterX?: number,
  rightCenterX?: number,
): { x: number; y: number }[] {
  const rng = seededRandom(seed);
  const lcx = leftCenterX ?? leftX;
  const rcx = rightCenterX ?? rightX;

  const addSegment = (
    pts: { x: number; y: number }[],
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    segs: number,
    includeEnd: boolean,
  ) => {
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const bx = x0 + (x1 - x0) * t;
      const by = y0 + (y1 - y0) * t;
      pts.push({ x: bx, y: by + (rng() - 0.5) * 6 });
    }
    if (includeEnd) pts.push({ x: x1, y: y1 });
  };

  const points: { x: number; y: number }[] = [{ x: leftX, y: leftY }];

  // Segment 1: flat left (leftX → leftCenterX)
  const leftLen = lcx - leftX;
  const centerLen = rcx - lcx;
  const rightLen = rightX - rcx;
  const totalLen = rightX - leftX;

  const totalSegs = 16;
  const seg1 = Math.max(3, Math.round(totalSegs * (leftLen / totalLen)));
  const seg3 = Math.max(3, Math.round(totalSegs * (rightLen / totalLen)));
  const seg2 = Math.max(3, totalSegs - seg1 - seg3);

  addSegment(points, leftX, leftY, lcx, leftY, seg1, true);
  addSegment(points, lcx, leftY, rcx, rightY, seg2, true);
  addSegment(points, rcx, rightY, rightX, rightY, seg3, false);

  points.push({ x: rightX, y: rightY });
  return points;
}

// Create all ground visualization elements: X markers, nivel labels, ground polyline, and fill polygon
function createGroundElements(
  leftX: number,
  leftCenterX: number,
  leftNivelY: number,
  rightX: number,
  rightCenterX: number,
  rightNivelY: number,
  s: number,
  seed: number,
  leftNivelStr: string,
  rightNivelStr: string,
  maxPilotiBottomY: number,
): FabricObject[] {
  const elements: FabricObject[] = [];
  const xSize = 5 * s;
  const lineColor = "#8B6914";
  const markerWidth = 1.5;

  // X marker on left corner piloti
  const xL1 = new Line([leftCenterX - xSize, leftNivelY - xSize, leftCenterX + xSize, leftNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xL1 as any).isGroundElement = true;
  (xL1 as any).isNivelMarker = true;

  const xL2 = new Line([leftCenterX - xSize, leftNivelY + xSize, leftCenterX + xSize, leftNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xL2 as any).isGroundElement = true;
  (xL2 as any).isNivelMarker = true;

  // X marker on right corner piloti
  const xR1 = new Line([rightCenterX - xSize, rightNivelY - xSize, rightCenterX + xSize, rightNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xR1 as any).isGroundElement = true;
  (xR1 as any).isNivelMarker = true;

  const xR2 = new Line([rightCenterX - xSize, rightNivelY + xSize, rightCenterX + xSize, rightNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xR2 as any).isGroundElement = true;
  (xR2 as any).isNivelMarker = true;

  // Nivel labels next to the X markers
  const labelFontSize = 10 * s;
  const lLabel = new Text(leftNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    fontFamily: "Arial",
    fontWeight: "bold",
    left: leftCenterX + xSize + 5,
    top: leftNivelY + xSize + 10 * s,
    originX: "right",
    originY: "center",
    selectable: false,
    evented: false,
  });
  (lLabel as any).isGroundElement = true;
  (lLabel as any).isNivelLabel = true;

  const rLabel = new Text(rightNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    fontFamily: "Arial",
    fontWeight: "bold",
    left: rightCenterX - xSize - 3,
    top: rightNivelY + xSize + 10 * s,
    originX: "left",
    originY: "center",
    selectable: false,
    evented: false,
  });
  (rLabel as any).isGroundElement = true;
  (rLabel as any).isNivelLabel = true;

  // --- Polyline + Polygon: terreno irregular ---
  const groundPtsAbs = generateGroundLinePoints(
    leftX,
    leftNivelY,
    rightX,
    rightNivelY,
    seed,
    leftCenterX,
    rightCenterX,
  );

  const gMinX = Math.min(...groundPtsAbs.map((p) => p.x));
  const gMinY = Math.min(...groundPtsAbs.map((p) => p.y));

  const groundLine = new Polyline(groundPtsAbs, {
    left: gMinX,
    top: gMinY,
    fill: "transparent",
    stroke: lineColor,
    strokeWidth: 2.5,
    strokeUniform: true,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  (groundLine as any).isGroundElement = true;
  (groundLine as any).isGroundLine = true;
  (groundLine as any).groundSeed = seed;

  const fillBottomY = maxPilotiBottomY + 50 * s;
  const fillPtsAbs = [...groundPtsAbs, { x: rightX, y: fillBottomY }, { x: leftX, y: fillBottomY }];

  const fMinX = Math.min(...fillPtsAbs.map((p) => p.x));
  const fMinY = Math.min(...fillPtsAbs.map((p) => p.y));

  const groundFill = new Polygon(fillPtsAbs, {
    left: fMinX,
    top: fMinY,
    fill: "rgba(139, 105, 20, 0.10)",
    stroke: "transparent",
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  (groundFill as any).isGroundElement = true;
  (groundFill as any).isGroundFill = true;

  elements.push(groundFill, groundLine, xL1, xL2, xR1, xR2, lLabel, rLabel);
  return elements;
}

// Get corner piloti IDs for a given elevation view
function getViewCornerPilotiIds(group: Group): { leftId: string; rightId: string } | null {
  const houseView = (group as any).houseView;

  if (houseView === "front" || houseView === "back") {
    const isFlipped = (group as any).isFlippedHorizontally;
    if (isFlipped) {
      return { leftId: "piloti_3_0", rightId: "piloti_0_0" };
    }
    return { leftId: "piloti_0_2", rightId: "piloti_3_2" };
  }

  if (houseView === "side") {
    const isRight = (group as any).isRightSide;
    if (isRight) {
      return { leftId: "piloti_3_2", rightId: "piloti_3_0" };
    }
    return { leftId: "piloti_0_0", rightId: "piloti_0_2" };
  }

  return null;
}

// Update ground elements in an elevation view group based on corner piloti nivel values
export function updateGroundInGroup(group: Group): void {
  const corners = getViewCornerPilotiIds(group);
  if (!corners) return;

  const objects = group.getObjects();
  const leftRect = objects.find((o: any) => o.pilotiId === corners.leftId && o.isPilotiRect) as any;
  const rightRect = objects.find((o: any) => o.pilotiId === corners.rightId && o.isPilotiRect) as any;
  if (!leftRect || !rightRect) return;

  const leftNivel = leftRect.pilotiNivel ?? 0.2;
  const rightNivel = rightRect.pilotiNivel ?? 0.2;
  const baseHeight = leftRect.pilotiBaseHeight || 60;
  const scale = baseHeight / BASE_PILOTI_HEIGHT_PX;

  // Find seed from existing ground
  const oldSeed = (objects.find((o: any) => o.groundSeed) as any)?.groundSeed ?? 42;

  // Remove all existing ground elements directly from _objects to avoid coordinate transforms
  const groundElements = objects.filter((o: any) => o.isGroundElement);
  if (groundElements.length) {
    const internalObjects = (group as any)._objects as any[];
    if (internalObjects && Array.isArray(internalObjects)) {
      (group as any)._objects = internalObjects.filter((o: any) => !o.isGroundElement);
      groundElements.forEach((o: any) => {
        o.group = undefined;
      });
    } else {
      group.remove(...(groundElements as any));
    }
  }

  // Re-read objects after removal
  const remainingObjects = group.getObjects();

  // Calculate anchor positions (center of each corner piloti rect)
  const leftRectAfter = remainingObjects.find((o: any) => o.pilotiId === corners.leftId && o.isPilotiRect) as any;
  const rightRectAfter = remainingObjects.find((o: any) => o.pilotiId === corners.rightId && o.isPilotiRect) as any;
  if (!leftRectAfter || !rightRectAfter) return;

  const leftCenterX = (leftRectAfter.left ?? 0) + (leftRectAfter.width ?? 30) / 2;
  const rightCenterX = (rightRectAfter.left ?? 0) + (rightRectAfter.width ?? 30) / 2;

  // Derive view limits from structural objects (walls, roof) instead of piloti positions
  const structuralObjs = remainingObjects.filter((o: any) => !o.isGroundElement && !o.isPilotiRect && !o.isPilotiLabel);
  let viewLeftX = Infinity;
  let viewRightX = -Infinity;
  for (const o of structuralObjs) {
    const oLeft = (o as any).left ?? 0;
    const oWidth = (o as any).width ?? 0;
    if (oLeft < viewLeftX) viewLeftX = oLeft;
    if (oLeft + oWidth > viewRightX) viewRightX = oLeft + oWidth;
  }
  if (!isFinite(viewLeftX)) viewLeftX = 0;
  if (!isFinite(viewRightX)) viewRightX = rightCenterX + (rightRectAfter.width ?? 30) / 2;

  const leftX = viewLeftX - 50;
  const rightX = viewRightX + 50;
  const leftNivelY = (leftRectAfter.top ?? 0) + leftNivel * 100 * scale;
  const rightNivelY = (rightRectAfter.top ?? 0) + rightNivel * 100 * scale;

  // Find the max bottom Y of all pilotis in this view
  const allPilotis = remainingObjects.filter((o: any) => o.isPilotiRect);
  let maxPilotiBottomY = 0;
  for (const p of allPilotis) {
    const pTop = (p as any).top ?? 0;
    const pH = (p as any).height ?? 0;
    const bottom = pTop + pH;
    if (bottom > maxPilotiBottomY) maxPilotiBottomY = bottom;
  }

  // Create new ground elements (Polyline/Polygon + markers/labels)
  const newElements = createGroundElements(
    leftX,
    leftCenterX,
    leftNivelY,
    rightX,
    rightCenterX,
    rightNivelY,
    scale,
    oldSeed,
    formatNivel(leftNivel),
    formatNivel(rightNivel),
    maxPilotiBottomY,
  );

  const groundBack = newElements.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = newElements.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  // Add new ground elements directly to _objects to avoid coordinate transforms
  const currentObjects = (group as any)._objects as any[];
  if (currentObjects && Array.isArray(currentObjects)) {
    const allNew = [...groundBack, ...groundFront];
    allNew.forEach((o: any) => {
      o.group = group;
      currentObjects.push(o);
    });
  } else {
    if (groundBack.length) group.add(...(groundBack as any));
    if (groundFront.length) group.add(...(groundFront as any));
  }
}

export function createLine(canvas: FabricCanvas): Line {
  const line = new Line([50, 50, 250, 50], {
    stroke: "black",
    strokeWidth: 2,
    strokeLineCap: "round",
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  (line as any).myType = "line";
  line.setControlsVisibility({ mt: false, mb: false, tl: false, tr: false, bl: false, br: false });
  return line;
}

export function createArrow(canvas: FabricCanvas): Group {
  const w = 150;
  const h = 15;

  const line = new Rect({
    width: w,
    height: 2,
    fill: "#333",
    originX: "center",
    originY: "center",
    left: 0,
  });

  const head = new Triangle({
    width: h,
    height: h,
    fill: "#333",
    angle: 90,
    left: w / 2,
    originX: "center",
    originY: "center",
  });

  const group = new Group([line, head], {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: "center",
    originY: "center",
    lockScalingY: true,
  });
  (group as any).myType = "arrow";
  group.setControlsVisibility({ mt: false, mb: false });

  const originalHeadW = h;
  const originalHeadH = h;

  group.on("scaling", function (this: Group) {
    const nw = this.width! * this.scaleX!;
    this._objects.forEach((child: any) => {
      if (child.type === "rect") {
        child.set({ width: nw });
      } else if (child.type === "triangle") {
        child.set({
          left: nw / 2,
          width: originalHeadW,
          height: originalHeadH,
          scaleX: 1,
          scaleY: 1,
        });
      } else if (child.myType === "lineArrowLabel") {
        child.set({ left: 0, top: -20, scaleX: 1, scaleY: 1 });
      }
    });
    this.set({ width: nw, scaleX: 1, scaleY: 1 });
  });

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

  // Left transversal tick
  const tick1 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: color,
    strokeWidth: 2,
    left: -w / 2,
    originX: "center",
    originY: "center",
  });

  // Right transversal tick
  const tick2 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
    stroke: color,
    strokeWidth: 2,
    left: w / 2,
    originX: "center",
    originY: "center",
  });

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
  (group as any).myType = "dimension";
  group.setControlsVisibility({ mt: false, mb: false });

  group.on("scaling", function (this: Group) {
    const nw = this.width! * this.scaleX!;
    (this._objects[0] as Line).set({ x1: -nw / 2, x2: nw / 2 });
    (this._objects[1] as Line).set({ left: -nw / 2 });
    (this._objects[2] as Line).set({ left: nw / 2 });
    // Keep text label undeformed and at fixed offset
    const textObj = this._objects[3];
    if (textObj) {
      textObj.set({ top: -20, scaleX: 1, scaleY: 1 });
    }
    this.set({ width: nw, scaleX: 1, scaleY: 1 });
  });

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
  (group as any).myType = "water";
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

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

export function createStairs(canvas: FabricCanvas): Rect {
  const factors = getHouseScaleFactors(canvas);
  const s = factors.widthFactor;

  const rect = new Rect({
    width: 80 * s,
    height: 75 * s,
    originX: "center",
    originY: "center",
    fill: new Pattern({
      source: createStairsPatternSource(s),
      repeat: "repeat",
    }),
    stroke: "#8B4513",
    strokeWidth: 3,
    transparentCorners: false,
    left: canvas.width! / 2,
    top: canvas.height! / 2,
  });
  (rect as any).myType = "stairs";

  rect.on("scaling", function (this: Rect) {
    this.set({
      width: this.width! * this.scaleX!,
      height: this.height! * this.scaleY!,
      scaleX: 1,
      scaleY: 1,
    });
  });

  return rect;
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
  (wall as any).myType = "wall";

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
  (group as any).myType = "gate";
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

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
  (group as any).myType = "fossa";
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

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
  (group as any).myType = "tree";
  group.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

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
  text.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
  return text;
}

export function getHintForObject(obj: FabricObject | null): string {
  if (!obj) {
    return "Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)";
  }

  const myType = (obj as any).myType;

  switch (myType) {
    case "house":
      return "<b>Casa:</b> Clique em um piloti para editar sua altura. Para mover a casa inteira, arraste.";
    case "piloti":
      return "<b>Piloti:</b> Clique para editar a altura.";
    case "gate":
      return "<b>Porta:</b> Posicione na lateral da casa.";
    case "wall":
      return "<b>Objeto:</b> Puxe as laterais para aumentar.";
    case "stairs":
      return "<b>Escada:</b> Redimensione para ajustar. Os degraus se ajustam automaticamente.";
    case "tree":
      return "<b>Árvore:</b> Escala proporcional.";
    case "water":
      return "<b>Água:</b> Escala proporcional.";
    case "line":
      return "<b>Reta:</b> Rotação livre e redimensionamento lateral.";
    case "arrow":
      return "<b>Seta:</b> Redimensiona no comprimento.";
    case "dimension":
      return "<b>Distância:</b> Clique duas vezes no meio para digitar a medida.";
    default:
      if (obj.type === "i-text") {
        return "<b>Texto:</b> Clique duas vezes para editar.";
      } else if (obj.type === "activeSelection") {
        return 'Múltiplos itens selecionados. Use "Bloquear" para Agrupar.';
      } else if (obj.type === "group") {
        return '<b>Grupo:</b> Use "Desbloquear" para editar partes.';
      }
      return "Objeto selecionado.";
  }
}

// ─── Contraventamento ──────────────────────────────────────────────────────

/** Constants matching createHouseTop (s = 0.6) */
const CONTRAV_S = 0.6;
const CONTRAV_CD = 155 * CONTRAV_S; // 93  — column distance
const CONTRAV_RD = 135 * CONTRAV_S; // 81  — row distance
const CONTRAV_RAD = 15 * CONTRAV_S; // 9   — piloti radius
const CONTRAV_BEAM_WIDTH = 5;
const CONTRAV_FILL = MASTER_PILOTI_FILL;
const CONTRAV_STROKE = MASTER_PILOTI_STROKE;
const CONTRAV_SELECTED_FILL = MASTER_PILOTI_FILL;
const CONTRAV_SELECTED_STROKE = MASTER_PILOTI_STROKE;
const CONTRAV_STROKE_WIDTH = MASTER_SHARED_STROKE_WIDTH;
const CONTRAV_ELEVATION_WIDTH = 10;

/** Local-space X of each column (0-3) in the top-view group */
const CONTRAV_COL_X = [
  -1.5 * CONTRAV_CD, // col 0: -139.5
  -0.5 * CONTRAV_CD, // col 1:  -46.5
   0.5 * CONTRAV_CD, // col 2:   46.5
   1.5 * CONTRAV_CD, // col 3:  139.5
];

/** Local-space Y of each row (0-2) in the top-view group */
const CONTRAV_ROW_Y = [
  -CONTRAV_RD, // row 0 (A): -81
   0,          // row 1 (B):   0
   CONTRAV_RD, // row 2 (C):  81
];

export interface ContraventamentoSelection {
  group: Group;
  contraventamentoId: string;
}

export type ContraventamentoSide = "left" | "right";

function getOrCreateContraventamentoId(obj: any): string {
  if (obj.contraventamentoId) return String(obj.contraventamentoId);
  const id = `contrav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  obj.contraventamentoId = id;
  return id;
}

function getNearestContraventamentoCol(x: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAV_COL_X.length; i += 1) {
    const centerX = CONTRAV_COL_X[i];
    const dist = Math.abs(x - centerX);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

function getNearestContraventamentoRow(y: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAV_ROW_Y.length; i += 1) {
    const dist = Math.abs(y - CONTRAV_ROW_Y[i]);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

function getContraventamentoMeta(obj: any): {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
} {
  const id = getOrCreateContraventamentoId(obj);

  const left = Number(obj.left ?? 0);
  const top = Number(obj.top ?? 0);
  const width = Number(obj.width ?? CONTRAV_BEAM_WIDTH);
  const height = Number(obj.height ?? 0);
  const centerX = left + width / 2;
  const bottom = top + height;

  const inferredCol = getNearestContraventamentoCol(centerX);
  const inferredStartRow = getNearestContraventamentoRow(top);
  const inferredEndRow = getNearestContraventamentoRow(bottom);

  const col = Number.isFinite(obj.contraventamentoCol) ? Number(obj.contraventamentoCol) : inferredCol;
  const startRowRaw = Number.isFinite(obj.contraventamentoStartRow) ? Number(obj.contraventamentoStartRow) : inferredStartRow;
  const endRowRaw = Number.isFinite(obj.contraventamentoEndRow) ? Number(obj.contraventamentoEndRow) : inferredEndRow;
  const startRow = Math.min(startRowRaw, endRowRaw);
  const endRow = Math.max(startRowRaw, endRowRaw);
  const side: ContraventamentoSide =
    obj.contraventamentoSide === "left" || obj.contraventamentoSide === "right" ?
      obj.contraventamentoSide :
      centerX < CONTRAV_COL_X[col] ? "left" : "right";
  const anchorPilotiId = String(obj.contraventamentoAnchorPilotiId ?? `piloti_${col}_${startRow}`);

  obj.contraventamentoId = id;
  obj.contraventamentoCol = col;
  obj.contraventamentoStartRow = startRow;
  obj.contraventamentoEndRow = endRow;
  obj.contraventamentoSide = side;
  obj.contraventamentoAnchorPilotiId = anchorPilotiId;

  return { id, col, startRow, endRow, side, anchorPilotiId };
}

/**
 * Add a bracing beam (contraventamento) to a top-view house group.
 * The beam is a thin rectangle connecting the tangent points of two piloti circles
 * that belong to the same column.
 */
export function addContraventamentoBeam(
  group: Group,
  piloti1: { col: number; row: number },
  piloti2: { col: number; row: number },
  options?: { anchorPilotiId?: string; side?: ContraventamentoSide },
): string | null {
  const col = piloti1.col;
  const colX = CONTRAV_COL_X[col];
  if (!Number.isFinite(colX)) return null;

  const y1 = CONTRAV_ROW_Y[piloti1.row];
  const y2 = CONTRAV_ROW_Y[piloti2.row];
  if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;

  const topY = Math.min(y1, y2);
  const botY = Math.max(y1, y2);
  const beamHeight = botY - topY;

  if (beamHeight <= 0) return null; // pilotis too close / same row

  const side: ContraventamentoSide = options?.side === "left" ? "left" : "right";
  const tangentX = side === "right" ? colX + CONTRAV_RAD : colX - CONTRAV_RAD;
  const beamLeft = side === "right"
    ? tangentX
    : tangentX - CONTRAV_BEAM_WIDTH;

  const beam = new Rect({
    width: CONTRAV_BEAM_WIDTH,
    height: beamHeight,
    // Beam edge opposite to the selected side touches the piloti tangent.
    left: beamLeft,
    top: topY,
    fill: CONTRAV_FILL,
    stroke: CONTRAV_STROKE,
    strokeWidth: CONTRAV_STROKE_WIDTH,
    originX: "left",
    originY: "top",
    selectable: false,
    evented: true,
    objectCaching: false,
  });
  const beamAny = beam as any;
  beamAny.isContraventamento = true;
  beamAny.contraventamentoId = `contrav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  beamAny.contraventamentoCol = col;
  beamAny.contraventamentoStartRow = Math.min(piloti1.row, piloti2.row);
  beamAny.contraventamentoEndRow = Math.max(piloti1.row, piloti2.row);
  beamAny.contraventamentoSide = side;
  beamAny.contraventamentoAnchorPilotiId =
    options?.anchorPilotiId ?? `piloti_${col}_${Math.min(piloti1.row, piloti2.row)}`;

  // Insert into the group's internal object list
  const internalObjects = (group as any)._objects as FabricObject[];
  internalObjects.push(beam);
  (beam as any).group = group;

  (group as any).dirty = true;
  group.setCoords();
  group.canvas?.requestRenderAll();
  return beamAny.contraventamentoId as string;
}

export function removeContraventamentosFromGroup(
  group: Group,
  predicate?: (obj: FabricObject) => boolean,
): number {
  const internalObjects = (group as any)._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const objAny = obj as any;
    const isContrav = objAny?.isContraventamento === true;
    const shouldRemove = isContrav && (!predicate || predicate(obj));
    if (shouldRemove) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    (group as any)._objects = nextObjects;
    (group as any).dirty = true;
    group.setCoords();
    group.canvas?.requestRenderAll();
  }

  return removed;
}

export function removeContraventamentoElevationsFromGroup(
  group: Group,
  contraventamentoId?: string,
): number {
  const internalObjects = (group as any)._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const objAny = obj as any;
    const isElevation = objAny?.isContraventamentoElevation === true;
    const matches = !contraventamentoId || String(objAny.contraventamentoId) === contraventamentoId;
    if (isElevation && matches) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    (group as any)._objects = nextObjects;
    (group as any).dirty = true;
    group.setCoords();
  }

  return removed;
}

export function setContraventamentoSelection(
  group: Group,
  contraventamentoId: string | null,
): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isContraventamento) return;
    const id = getOrCreateContraventamentoId(obj);
    const isSelected = !!contraventamentoId && id === contraventamentoId;
    obj.set({
      fill: isSelected ? CONTRAV_SELECTED_FILL : CONTRAV_FILL,
      stroke: isSelected ? CONTRAV_SELECTED_STROKE : CONTRAV_STROKE,
      strokeWidth: CONTRAV_STROKE_WIDTH,
    });
    obj.dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

export function syncContraventamentoElevationsFromTop(
  topGroup: Group | null,
  targetGroups: Group[],
  getPilotiNivel: (pilotiId: string) => number,
): void {
  targetGroups.forEach((group) => {
    removeContraventamentoElevationsFromGroup(group);
  });

  if (!topGroup) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  const contravs = topGroup
    .getObjects()
    .filter((obj: any) => obj.isContraventamento)
    .map((obj: any) => ({ obj, ...getContraventamentoMeta(obj) }));

  if (contravs.length === 0) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  for (const group of targetGroups) {
    const houseView = String((group as any).houseView ?? "");
    // Only project contraventamento on square views (side elevations).
    if (houseView !== "side") continue;

    const pilotiRects = group.getObjects().filter((obj: any) => obj.isPilotiRect && obj.pilotiId) as any[];
    if (pilotiRects.length === 0) continue;

    const rectByPilotiId = new Map<string, any>();
    pilotiRects.forEach((rect) => rectByPilotiId.set(String(rect.pilotiId), rect));

    const internalObjects = (group as any)._objects as FabricObject[];
    const CONTRAV_OFFSET_M = 0.2;

    const getPilotiRow = (pilotiId: string): number | null => {
      const match = pilotiId.match(/^piloti_\d+_(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };

    const getRectTop = (rect: any): number => Number(rect?.top ?? 0);
    const getRectWidth = (rect: any): number => Number(rect?.width ?? 0) * Number(rect?.scaleX ?? 1);
    const getRectCenterX = (rect: any): number => Number(rect?.left ?? 0) + getRectWidth(rect) / 2;
    const getRectBaseHeight = (rect: any): number =>
      Number(rect?.pilotiBaseHeight ?? BASE_PILOTI_HEIGHT_PX * CONTRAV_S);

    // Origem: 20cm acima do terreno local do piloti de origem.
    const getOriginY = (rect: any, originPilotiId: string): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
      return top + (originNivel - CONTRAV_OFFSET_M) * base;
    };

    // Destino: 20cm abaixo da viga de piso (na projeção, referência = topo do piloti).
    const getDestinationY = (rect: any): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      return top + CONTRAV_OFFSET_M * base;
    };

    const isRightSideView = (group as any).isRightSide === true;
    const visibleCol = isRightSideView ? 3 : 0;
    const externalSide: ContraventamentoSide = isRightSideView ? "right" : "left";
    const oppositeSide: ContraventamentoSide = isRightSideView ? "left" : "right";

    for (const contrav of contravs) {
      // For square views:
      // - external side is rendered normally
      // - opposite side is also rendered when present, but behind everything (lower z-index)
      if (contrav.col !== visibleCol) continue;
      const isExternal = contrav.side === externalSide;
      const isOpposite = contrav.side === oppositeSide;
      if (!isExternal && !isOpposite) continue;

      const originPilotiId = String(contrav.anchorPilotiId);
      const originRow = getPilotiRow(originPilotiId);
      const normalizedOriginRow =
        originRow !== null && Number.isFinite(originRow) ? originRow : contrav.startRow;
      const targetRow = normalizedOriginRow === contrav.startRow ? contrav.endRow : contrav.startRow;
      const targetPilotiId = `piloti_${contrav.col}_${targetRow}`;

      const originRect = rectByPilotiId.get(originPilotiId);
      const targetRect = rectByPilotiId.get(targetPilotiId);
      if (!originRect || !targetRect) continue;

      const x1 = getRectCenterX(originRect);
      const y1 = getOriginY(originRect, originPilotiId);
      const x2 = getRectCenterX(targetRect);
      const y2 = getDestinationY(targetRect);

      if (
        !Number.isFinite(x1) ||
        !Number.isFinite(y1) ||
        !Number.isFinite(x2) ||
        !Number.isFinite(y2) ||
        (Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) < 1)
      ) {
        continue;
      }

      // Border (behind) + fill (front) to keep visible outline on square views.
      const borderLine = new Line([x1, y1, x2, y2], {
        stroke: CONTRAV_STROKE,
        strokeWidth: CONTRAV_ELEVATION_WIDTH + 2,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      const borderAny = borderLine as any;
      borderAny.isContraventamentoElevation = true;
      borderAny.contraventamentoId = contrav.id;
      borderAny.contraventamentoSourcePilotiId = originPilotiId;

      const line = new Line([x1, y1, x2, y2], {
        stroke: CONTRAV_FILL,
        strokeWidth: CONTRAV_ELEVATION_WIDTH,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      const lineAny = line as any;
      lineAny.isContraventamentoElevation = true;
      lineAny.contraventamentoId = contrav.id;
      lineAny.contraventamentoSourcePilotiId = originPilotiId;

      if (isOpposite) {
        // Lowest z-index for opposite-side contraventamento in this square view.
        internalObjects.unshift(line);
        lineAny.group = group;
        internalObjects.unshift(borderLine);
        borderAny.group = group;
      } else {
        internalObjects.push(borderLine);
        borderAny.group = group;
        internalObjects.push(line);
        lineAny.group = group;
      }
    }

    (group as any).dirty = true;
    group.setCoords();
  }

  topGroup.canvas?.requestRenderAll();
}

/**
 * Highlight eligible pilotis in the top-view group based on the provided
 * eligibility callback.
 * Optionally restrict to a single column when firstCol is provided.
 * Optionally skip a specific pilotiId (already selected).
 */
export function highlightContraventamentoPilotis(
  group: Group,
  getIsEligible: (pilotiId: string) => boolean,
  firstCol?: number,
  skipPilotiId?: string,
): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isPilotiCircle) return;

    const id: string = obj.pilotiId ?? "";
    const match = id.match(/piloti_(\d+)_(\d+)/);
    if (!match) return;
    const col = parseInt(match[1], 10);

    const eligible = getIsEligible(id);
    const inColumn = firstCol === undefined || col === firstCol;
    const isSkipped = id === skipPilotiId;

    if (eligible && inColumn && !isSkipped) {
      // Available — yellow border highlight (same visual language as top-view selection).
      obj.set({ stroke: "#facc15", strokeWidth: 4, fill: MASTER_PILOTI_FILL, hoverCursor: "pointer" });
    } else {
      // Dimmed — grey out, including master pilotis while not eligible.
      obj.set({ stroke: "#aaa", strokeWidth: 1, fill: "#eee", hoverCursor: "default" });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

/**
 * Reset all piloti visuals in the top-view group back to normal.
 */
export function resetContraventamentoPilotis(group: Group): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isPilotiCircle) return;
    if (obj.pilotiIsMaster) {
      obj.set({ stroke: "#8B4513", strokeWidth: 2, fill: "#D4A574", hoverCursor: "default" });
    } else {
      obj.set({ stroke: "black", strokeWidth: 1.5 * 0.6, fill: "white", hoverCursor: "default" });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}
