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

// Corner piloti IDs (A1, A4, C1, C4) - only these can be master and have nivel
export const CORNER_PILOTI_IDS = ['piloti_0_0', 'piloti_3_0', 'piloti_0_2', 'piloti_3_2'];

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

  let pilotiIndex = 0;
  [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD].forEach((x, colIdx) => {
    [-rD, 0, rD].forEach((y, rowIdx) => {
      const pilotiId = `piloti_${colIdx}_${rowIdx}`;
      const defaultHeight = 1.0;
      const defaultIsMaster = false;
      const defaultNivel = 0.3;

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
      const nivelText = new IText(isCorner ? `Nível = ${formatPilotiHeight(defaultNivel)}` : "", {
        fontSize: 11 * s,
        fontFamily: "Arial",
        fill: "#8B4513",
        originX: "center",
        originY: "center",
        left: x,
        top: y + rad + 12 * s,
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
    if ((obj.isPilotiCircle || obj.isPilotiRect) && typeof obj.pilotiId === 'string') {
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
        nivel: (obj as any).pilotiNivel ?? 0.3,
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
        sizeLabel.set('left', (obj.left ?? 0) + rectWidth / 2);
        sizeLabel.set('top', (obj.top ?? 0) + newVisualHeight + offset);
        sizeLabel.set('text', formatPilotiHeight(newHeight));
        sizeLabel.setCoords();
        (sizeLabel as any).dirty = true;
      }

      return;
    }

    if (obj.isPilotiText) {
      obj.set('text', formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
    }

    if (obj.isPilotiSizeLabel) {
      obj.set('text', formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
    }
  });

  // Keep the house centered in the canvas when the piloti grows (avoid bottom cut by viewport).
  if (rectHeightDelta !== 0) {
    group.set('top', (group.top || 0) - rectHeightDelta / 2);
  }

  refreshHouseGroupRendering(group);
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

  // Get all objects and their current state
  const objects = group.getObjects();

  // Mark all children as dirty and disable their caching
  objects.forEach((obj: any) => {
    obj.objectCaching = false;
    (obj as any).dirty = true;
    obj.setCoords?.();
  });

  // Remove and re-add all objects to force bounds recalculation
  // This is the most reliable way to update the group's bounding box in Fabric v6
  group.remove(...objects);
  group.add(...objects);

  // Now recalculate bounds
  (group as any)._clearCache?.();
  (group as any)._calcBounds?.();
  (group as any)._updateObjectsCoords?.();
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
          obj.set("text", `Nível = ${formatPilotiHeight(nivel)}`);
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
  const bodyH = 220 * s;
  const roofH = 80 * s;
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
    const colIndex = flipHorizontal ? (3 - i) : i;
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
      top: roofH + bodyH,
      originY: "top",
      objectCaching: false,
    });
    (rect as any).myType = "piloti";
    (rect as any).pilotiId = pilotiId;
    (rect as any).pilotiHeight = defaultHeight;
    (rect as any).pilotiIsMaster = false;
    (rect as any).pilotiNivel = 0.3;
    (rect as any).isPilotiRect = true;
    (rect as any).pilotiBaseHeight = BASE_PILOTI_HEIGHT_PX * s;

    pilots.push(rect);
    
    // Create size label below piloti (font size 20 * scale for visibility)
    // Position at center of piloti rect (rect.left + pilotW/2)
    const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
      fontSize: 20 * s,
      fill: "#666",
      left: margin + i * step + pilotW / 2,
      top: roofH + bodyH + pilotH + 8 * s,
      originX: "center",
      originY: "top",
      selectable: false,
      evented: false,
    });
    (sizeLabel as any).isPilotiSizeLabel = true;
    (sizeLabel as any).pilotiId = pilotiId;
    
    pilotLabels.push(sizeLabel);
  }

  const roofFill = new Polygon(
    [
      { x: 0, y: roofH },
      { x: bodyW / 2, y: 0 },
      { x: bodyW, y: roofH },
    ],
    { fill: "#eeeeee", strokeWidth: 0, left: 0, top: 0 },
  );

  const bodyFill = new Rect({
    width: bodyW,
    height: bodyH,
    fill: "#eeeeee",
    strokeWidth: 0,
    left: 0,
    top: roofH,
  });

  const roofLines = [
    new Line([0, roofH, bodyW / 2, 0], {
      stroke: "#333",
      strokeWidth: 2,
      strokeUniform: true,
      left: 0,
      top: 0,
    }),
    new Line([bodyW / 2, 0, bodyW, roofH], {
      stroke: "#333",
      strokeWidth: 2,
      strokeUniform: true,
      left: bodyW / 2,
      top: 0,
    }),
  ];

  const bodyStroke = new Polyline(
    [
      { x: 0, y: roofH },
      { x: 0, y: roofH + bodyH },
      { x: bodyW, y: roofH + bodyH },
      { x: bodyW, y: roofH },
    ],
    { fill: "transparent", stroke: "#333", strokeWidth: 2, strokeUniform: true, left: 0, top: roofH },
  );

  const elements: FabricObject[] = [roofFill, bodyFill, ...roofLines, bodyStroke];

  // Front view: door + 2 windows
  // Back view: only right window (w1), no door, no left window
  const windowW = 90 * s;
  const windowH = 75 * s;
  const doorY = roofH + (bodyH - 180 * s);

  if (isFront) {
    // Front view: right window next to door
    const w1 = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: bodyW - 130 * s,
      top: doorY,
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
      left: 40 * s,
      top: doorY,
    });
    elements.push(w1);
  }

  if (isFront) {
    const doorW = 100 * s;
    const doorH = 180 * s;

    const doorObj = new Rect({
      width: doorW,
      height: doorH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: bodyW - 250 * s,
      top: doorY,
    });

    const w2 = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: 40 * s,
      top: doorY,
    });

    elements.push(doorObj, w2);
  }

  // Add ground line (behind house/pilotis) + markers/labels (in front)
  const defaultNivelVal = 0.3;
  const groundSeed = flipHorizontal ? 42 : 137;
  const leftCenterX = margin + pilotW / 2;
  const rightCenterX = margin + 3 * step + pilotW / 2;
  const nivelY = roofH + bodyH + defaultNivelVal * BASE_PILOTI_HEIGHT_PX * s;
  const nivelStr = formatPilotiHeight(defaultNivelVal);
  const groundElems = createGroundElements(leftCenterX, nivelY, rightCenterX, nivelY, s, groundSeed, nivelStr, nivelStr);
  const groundBack = groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(...groundBack);
  elements.push(...pilots);
  elements.push(...pilotLabels);
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
  const wallHeight = 220 * s;
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
      top: wallHeight,
      originY: "top",
      objectCaching: false,
    });
    (rect as any).myType = "piloti";
    (rect as any).pilotiId = pilotiId;
    (rect as any).pilotiHeight = defaultHeight;
    (rect as any).pilotiIsMaster = false;
    (rect as any).pilotiNivel = 0.3;
    (rect as any).isPilotiRect = true;
    (rect as any).pilotiBaseHeight = BASE_PILOTI_HEIGHT_PX * s;

    // Create size label below piloti
    const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
      fontSize: 20 * s,
      fill: "#666",
      left: left + pilotW / 2,
      top: wallHeight + pilotH + 8 * s,
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

  if (hasDoor) {
    const doorW = 100 * s;
    const doorH = 180 * s;
    const windowW = 90 * s;
    const windowH = 75 * s;
    const doorLeft = (sideWidth / 2 + (sideWidth - pilotW)) / 2 - doorW / 2;

    const doorObj = new Rect({
      width: doorW,
      height: doorH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: doorLeft,
      top: wallHeight - doorH,
    });

    const windowLeft = (doorLeft - windowW) / 2;
    const windowObj = new Rect({
      width: windowW,
      height: windowH,
      fill: "#fff",
      stroke: "#333",
      strokeWidth: 1.5,
      strokeUniform: true,
      left: windowLeft,
      top: wallHeight - doorH,
    });

    elements.push(windowObj, doorObj);
  }

  // Add ground line (behind) + markers/labels (in front)
  const defaultNivelVal = 0.3;
  const groundSeed = isRightSide ? 314 : 217;
  const leftCenterX = pilotW / 2;
  const rightCenterX = sideWidth - pilotW / 2;
  const nivelY = wallHeight + defaultNivelVal * BASE_PILOTI_HEIGHT_PX * s;
  const nivelStr = formatPilotiHeight(defaultNivelVal);
  const groundElems = createGroundElements(leftCenterX, nivelY, rightCenterX, nivelY, s, groundSeed, nivelStr, nivelStr);
  const groundBack = groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(...groundBack);
  elements.push(p1, p2, p3);
  elements.push(...pilotLabels);
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

// Generate irregular ground line points between two endpoints
function generateGroundLinePoints(
  leftX: number, leftY: number,
  rightX: number, rightY: number,
  seed: number,
  numSegments: number = 12,
): { x: number; y: number }[] {
  const rng = seededRandom(seed);
  const points: { x: number; y: number }[] = [{ x: leftX, y: leftY }];

  for (let i = 1; i < numSegments; i++) {
    const t = i / numSegments;
    const baseX = leftX + (rightX - leftX) * t;
    const baseY = leftY + (rightY - leftY) * t;
    const variation = (rng() - 0.5) * 6;
    points.push({ x: baseX, y: baseY + variation });
  }

  points.push({ x: rightX, y: rightY });
  return points;
}

// Create all ground visualization elements: X markers, nivel labels, ground polyline, and fill polygon
function createGroundElements(
  leftCenterX: number,
  leftNivelY: number,
  rightCenterX: number,
  rightNivelY: number,
  s: number,
  seed: number,
  leftNivelStr: string,
  rightNivelStr: string,
): FabricObject[] {
  const elements: FabricObject[] = [];
  const xSize = 5 * s;
  const lineColor = '#8B6914';
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
    fontFamily: 'Arial',
    left: leftCenterX - xSize - 4 * s,
    top: leftNivelY,
    originX: 'right',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  (lLabel as any).isGroundElement = true;
  (lLabel as any).isNivelLabel = true;

  const rLabel = new Text(rightNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    fontFamily: 'Arial',
    left: rightCenterX + xSize + 4 * s,
    top: rightNivelY,
    originX: 'left',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  (rLabel as any).isGroundElement = true;
  (rLabel as any).isNivelLabel = true;

  // --- Polyline + Polygon (deterministic positioning inside groups)
  const groundPtsAbs = generateGroundLinePoints(leftCenterX, leftNivelY, rightCenterX, rightNivelY, seed);

  // Compute bounds to convert to relative points and position with left/top.
  const minX = Math.min(...groundPtsAbs.map((p) => p.x));
  const minY = Math.min(...groundPtsAbs.map((p) => p.y));
  const maxX = Math.max(...groundPtsAbs.map((p) => p.x));
  const maxY = Math.max(...groundPtsAbs.map((p) => p.y));

  const groundPtsRel = groundPtsAbs.map((p) => ({ x: p.x - minX, y: p.y - minY }));

  const groundLine = new Polyline(groundPtsRel, {
    left: minX,
    top: minY,
    originX: 'left',
    originY: 'top',
    fill: 'transparent',
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

  const fillDepth = 50 * s;
  const fillPtsAbs = [
    ...groundPtsAbs,
    { x: maxX, y: maxY + fillDepth },
    { x: minX, y: maxY + fillDepth },
  ];

  const fillMinX = Math.min(...fillPtsAbs.map((p) => p.x));
  const fillMinY = Math.min(...fillPtsAbs.map((p) => p.y));
  const fillPtsRel = fillPtsAbs.map((p) => ({ x: p.x - fillMinX, y: p.y - fillMinY }));

  const groundFill = new Polygon(fillPtsRel, {
    left: fillMinX,
    top: fillMinY,
    originX: 'left',
    originY: 'top',
    fill: 'rgba(139, 105, 20, 0.10)',
    stroke: 'transparent',
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

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = (group as any).isFlippedHorizontally;
    if (isFlipped) {
      return { leftId: 'piloti_3_0', rightId: 'piloti_0_0' };
    }
    return { leftId: 'piloti_0_2', rightId: 'piloti_3_2' };
  }

  if (houseView === 'side') {
    const isRight = (group as any).isRightSide;
    if (isRight) {
      return { leftId: 'piloti_3_2', rightId: 'piloti_3_0' };
    }
    return { leftId: 'piloti_0_0', rightId: 'piloti_0_2' };
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

  const leftNivel = leftRect.pilotiNivel ?? 0.3;
  const rightNivel = rightRect.pilotiNivel ?? 0.3;
  const baseHeight = leftRect.pilotiBaseHeight || 60;
  const scale = baseHeight / BASE_PILOTI_HEIGHT_PX;

  // Find seed from existing ground
  const oldSeed = (objects.find((o: any) => o.groundSeed) as any)?.groundSeed ?? 42;

  // Remove all existing ground elements
  const groundElements = objects.filter((o: any) => o.isGroundElement);
  if (groundElements.length) {
    group.remove(...(groundElements as any));
  }

  // Calculate anchor positions (center of each corner piloti rect)
  const leftCenterX = (leftRect.left ?? 0) + (leftRect.width ?? 30) / 2;
  const rightCenterX = (rightRect.left ?? 0) + (rightRect.width ?? 30) / 2;
  const leftNivelY = (leftRect.top ?? 0) + leftNivel * BASE_PILOTI_HEIGHT_PX * scale;
  const rightNivelY = (rightRect.top ?? 0) + rightNivel * BASE_PILOTI_HEIGHT_PX * scale;

  // Create new ground elements (Polyline/Polygon + markers/labels)
  const newElements = createGroundElements(
    leftCenterX,
    leftNivelY,
    rightCenterX,
    rightNivelY,
    scale,
    oldSeed,
    formatPilotiHeight(leftNivel),
    formatPilotiHeight(rightNivel),
  );

  const groundBack = newElements.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = newElements.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  // Re-stack so the house/pilotis stay above the terrain fill/line,
  // but markers/labels remain on top (anchors visible).
  const normal = group.getObjects().filter((o: any) => !o.isGroundElement);
  if (normal.length) {
    group.remove(...(normal as any));
  }

  if (groundBack.length) group.add(...(groundBack as any));
  if (normal.length) group.add(...(normal as any));
  if (groundFront.length) group.add(...(groundFront as any));

  refreshHouseGroupRendering(group);
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
      if (child.type === 'rect') {
        child.set({ width: nw });
      } else if (child.type === 'triangle') {
        child.set({ 
          left: nw / 2, 
          width: originalHeadW, 
          height: originalHeadH, 
          scaleX: 1, 
          scaleY: 1 
        });
      } else if (child.myType === 'lineArrowLabel') {
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

export function createStairsPatternSource(): HTMLCanvasElement {
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = 20;
  patternCanvas.height = 20;
  const ctx = patternCanvas.getContext("2d")!;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#8B4513";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(20, 0);
  ctx.stroke();
  return patternCanvas;
}

export function createStairs(canvas: FabricCanvas): Rect {
  const rect = new Rect({
    width: 100,
    height: 75,
    originX: "center",
    originY: "center",
    fill: new Pattern({
      source: createStairsPatternSource(),
      repeat: "repeat",
    }),
    stroke: "#8B4513",
    strokeWidth: 2,
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
    fill: "#D2A679",
    stroke: "black",
    strokeWidth: 1,
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
