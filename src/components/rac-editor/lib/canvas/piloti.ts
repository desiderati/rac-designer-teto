import {Canvas as FabricCanvas, Pattern, Polygon, Polyline, Rect} from 'fabric';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {
  HOUSE_DEFAULTS,
  PILOTI_CORNER_ID,
  PILOTI_CORNER_IDS,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE
} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  CanvasGroup,
  CanvasObject,
  isCanvasGroup,
  toCanvasGroup,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas/canvas.ts'
import {formatNivel, formatPilotiHeight, getAllPilotiIds, getPilotiVisualHeight} from '@/shared/types/piloti.ts';
import {
  PILOTI_BASE_HEIGHT_PX, PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
  PILOTI_DEFAULT_NIVEL,
  PILOTI_MASTER_FILL_COLOR,
  PILOTI_MASTER_STROKE_COLOR
} from '@/shared/constants.ts';

export function createPilotis(
  elements: CanvasObject[],
  bodyW: number,
  s: number,
  flipHorizontal: boolean = false
) {

  const bodyH = HOUSE_DIMENSIONS.structure.bodyHeight * s;
  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const pilotiDefaultH = DEFAULT_HOUSE_PILOTI.height;
  const pilotW = HOUSE_DIMENSIONS.piloti.width * s;
  const pilots: CanvasObject[] = [];

  const pilotLabels: CanvasObject[] = [];
  const margin = HOUSE_DIMENSIONS.piloti.margin * s;

  const step = (bodyW - 2 * margin - pilotW) / 3;
  // Position determines piloti IDs (not view type):
  // Top position (flipHorizontal=true): pilotis A4, A3, A2, A1 (row 0, reversed)
  // Bottom position (flipHorizontal=false): pilotis C1, C2, C3, C4 (row 2, normal order)

  const rowIndex = flipHorizontal ? 0 : 2;

  for (let i = 0; i < 4; i++) {
    // Top position: reversed order (A4, A3, A2, A1)
    // Bottom position: normal order (C1, C2, C3, C4)
    const colIndex = flipHorizontal ? 3 - i : i;
    const pilotiId = `piloti_${colIndex}_${rowIndex}`;
    const pilotH = getPilotiVisualHeight(pilotiDefaultH, s);
    pilots.push(createPilotiRect(pilotLabels, colIndex, rowIndex, bodyH, margin + i * step, s));

    // Add diagonal stripe overlay for bottom 2/3
    const stripeOverlay =
      createPilotiStripeOverlay(
        pilotiId,
        margin + (PILOTI_STYLE.selectedStrokeWidth / 2) + i * step,
        bodyH + floorH + floorBeanH,
        pilotW,
        pilotH
      );
    pilots.push(toCanvasObject(stripeOverlay));
  }

  elements.push(...pilots);
  elements.push(...pilotLabels);
}

export function createPilotiRect(
  pilotLabels: CanvasObject[],
  colIndex: number,
  rowIndex: number,
  panelHeight: number,
  left: number,
  s: number,
): CanvasObject {

  const defaultHeight = DEFAULT_HOUSE_PILOTI.height;
  const defaultIsMaster = DEFAULT_HOUSE_PILOTI.isMaster;
  const defaultNivel = DEFAULT_HOUSE_PILOTI.nivel;

  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const pilotiId = `piloti_${colIndex}_${rowIndex}`;
  const pilotW = HOUSE_DIMENSIONS.piloti.width * s;
  const pilotH = getPilotiVisualHeight(defaultHeight, s);

  const rect = new Rect({
    width: pilotW,
    height: pilotH,
    fill: PILOTI_STYLE.fillColor,
    stroke: PILOTI_STYLE.strokeColor,
    strokeWidth: PILOTI_STYLE.strokeWidth,
    strokeUniform: true,
    left,
    top: panelHeight + floorH + floorBeanH,
    originY: 'top',
    objectCaching: false,
  });

  const rectObj = toCanvasObject(rect);
  rectObj.myType = 'piloti';
  rectObj.pilotiId = pilotiId;
  rectObj.pilotiHeight = defaultHeight;
  rectObj.pilotiIsMaster = defaultIsMaster;
  rectObj.pilotiNivel = defaultNivel;
  rectObj.isPilotiRect = true;
  rectObj.pilotiBaseHeight = PILOTI_BASE_HEIGHT_PX * s;

  // Create size label below piloti
  // const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
  //   fontSize: PILOTI_STYLE.heightFontSize * s,
  //   fill: PILOTI_STYLE.heightFontColor,
  //   backgroundColor: PILOTI_STYLE.fillColor,
  //   left: left + pilotW / 2,
  //   top: panelHeight + floorH + floorBeanH + pilotH + 8 * s,
  //   originX: 'center',
  //   originY: 'top',
  //   selectable: false,
  //   evented: false,
  // });
  // const sizeLabelObject = toCanvasObject(rect);
  // sizeLabelObject.isPilotiSizeLabel = true;
  // sizeLabelObject.pilotiId = pilotiId;
  // pilotLabels.push(sizeLabelObject);

  return rectObj;
}

// Create a stripe overlay rect for the bottom 2/3 of a piloti rect
export function createPilotiStripeOverlay(
  pilotiId: string,
  left: number,
  top: number,
  width: number,
  fullHeight: number,
): CanvasObject {

  const stripeHeight = (fullHeight * 2) / 3;
  const stripeTop = top + fullHeight / 3;

  const stripe = new Rect({
    width,
    height: stripeHeight,
    fill: createDiagonalStripePattern(),
    left,
    top: stripeTop,
    originY: 'top',
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
    opacity: 0.5,
  });

  const stripeObj = toCanvasObject(stripe);
  stripeObj.isPilotiStripe = true;
  stripeObj.pilotiId = pilotiId;
  return stripeObj;
}

// Create a diagonal stripe pattern for piloti fill (bottom 2/3)
export function createDiagonalStripePattern(): Pattern {
  const size = 10; // pattern tile size
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = PILOTI_STYLE.stripeColor;
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
    repeat: 'repeat',
  });
}

// Get piloti IDs that actually exist inside a given house group, ordered like getAllPilotiIds()
export function getPilotiIdsFromGroup(group: CanvasGroup): string[] {
  const present = new Set<string>();
  group.getCanvasObjects().forEach(obj => {
    if ((obj.isPilotiCircle || obj.isPilotiRect) && typeof obj.pilotiId === 'string') {
      present.add(obj.pilotiId);
    }
  });

  return getAllPilotiIds().filter((id) => present.has(id));
}

// Get piloti data from group (works for both circles in top view and rects in front/back/side views)
export function getPilotiFromGroup(
  group: CanvasGroup,
  pilotiId: string,
): {
  circle: CanvasObject;
  height: number;
  isMaster: boolean;
  nivel: number;
} | null {
  const objects = group.getCanvasObjects();

  for (const obj of objects) {
    if (obj.pilotiId === pilotiId && (obj.isPilotiCircle || obj.isPilotiRect)) {
      return {
        circle: obj,
        height: obj.pilotiHeight || DEFAULT_HOUSE_PILOTI.height,
        isMaster: obj.pilotiIsMaster || false,
        nivel: obj.pilotiNivel ?? PILOTI_DEFAULT_NIVEL,
      };
    }
  }
  return null;
}

export function updatePilotiHeight(group: CanvasGroup, pilotiId: string, newHeight: number): void {
  const objects = group.getCanvasObjects();

  // Fabric caching note:
  // Groups can cache to an offscreen canvas; when a child grows, the cached bounds can clip the new geometry.
  // We disable caching + force a refresh to guarantee the new rect is actually redrawn.
  group.objectCaching = false;

  // Track delta to keep the house centered while piloti rect grows downwards.
  // (Rects in front/back/side use originY="top", so growth increases maxY only.)
  let rectHeightDelta = 0;

  objects.forEach(obj => {
    if (obj.pilotiId !== pilotiId) return;

    if (obj.isPilotiCircle) {
      obj.pilotiHeight = newHeight;
      obj.dirty = true;
      return;
    }

    if (obj.isPilotiRect) {
      // Disable caching for the rect itself as well (prevents "corte" after resize)
      obj.objectCaching = false;

      const oldHeight = (obj.getScaledHeight?.() ?? obj.height ?? 0) as number;
      obj.pilotiHeight = newHeight;

      const baseHeight = obj.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE;
      const s = baseHeight / PILOTI_BASE_HEIGHT_PX;
      const newVisualHeight = baseHeight * newHeight;
      rectHeightDelta = newVisualHeight - oldHeight;

      // IMPORTANT: reset scaling so height is the real source of truth
      obj.set({height: newVisualHeight, scaleY: 1});
      obj.setCoords();
      obj.dirty = true;

      // Update size label position using the *same* computed height (no guessing)
      const sizeLabel = objects.find(o => o.pilotiId === pilotiId && o.isPilotiSizeLabel);
      if (sizeLabel) {
        const offset = 8 * s;
        const rectWidth = (obj.width ?? 0) as number;

        sizeLabel.set('left', (obj.left ?? 0) + rectWidth / 2);
        sizeLabel.set('top', (obj.top ?? 0) + newVisualHeight + offset);
        sizeLabel.set('text', formatPilotiHeight(newHeight));
        sizeLabel.setCoords();
        sizeLabel.dirty = true;
      }

      return;
    }

    if (obj.isPilotiStripe) {
      // Update stripe overlay to cover bottom 2/3 of the new piloti height
      const pilotiRect = objects.find(o => o.pilotiId === pilotiId && o.isPilotiRect);
      if (pilotiRect) {
        const newVisualHeight = (pilotiRect.height ?? 0) as number;
        const stripeHeight = (newVisualHeight * 2) / 3;

        obj.set({height: stripeHeight, top: (pilotiRect.top ?? 0) + newVisualHeight / 3});
        obj.set('fill', createDiagonalStripePattern());
        obj.objectCaching = false;

        obj.setCoords();
        obj.dirty = true;
      }
      return;
    }

    if (obj.isPilotiText) {
      obj.set('text', formatPilotiHeight(newHeight));
      obj.dirty = true;
    }

    if (obj.isPilotiSizeLabel) {
      obj.set('text', formatPilotiHeight(newHeight));
      obj.dirty = true;
    }
  });

  // Keep the house centered in the canvas when the piloti grows (avoid bottom cut by viewport).
  if (rectHeightDelta !== 0) {
    group.set('top', (group.top || 0) - rectHeightDelta / 2);
  }

  group.canvas?.requestRenderAll();
}

export function updatePilotiMaster(
  group: CanvasGroup,
  pilotiId: string,
  isMaster: boolean,
  nivel: number
): void {

  const objects = group.getCanvasObjects();
  if (isMaster) {
    objects.forEach(obj => {
      if (obj.pilotiId !== pilotiId) {
        if ((obj.isPilotiCircle || obj.isPilotiRect) && obj.pilotiIsMaster) {
          obj.pilotiIsMaster = false;
          obj.set('fill', PILOTI_STYLE.fillColor);
          obj.set('stroke', PILOTI_STYLE.strokeColor);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_STYLE.strokeWidth : PILOTI_STYLE.strokeWidthTopView);
        }
        // Keep nivel text visible for corner pilotis even when losing master status
        if (obj.isPilotiNivelText && !PILOTI_CORNER_IDS.includes(obj.pilotiId)) {
          obj.set('text', '');
          obj.set('visible', false);
        }
      }
    });
  }

  // Now update the target piloti
  objects.forEach(obj => {
    if (obj.pilotiId === pilotiId) {
      if (obj.isPilotiCircle || obj.isPilotiRect) {
        obj.pilotiIsMaster = isMaster;
        obj.pilotiNivel = nivel;

        // Update visual style based on isMaster
        if (isMaster) {
          obj.set('fill', PILOTI_MASTER_FILL_COLOR);
          obj.set('stroke', PILOTI_MASTER_STROKE_COLOR);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_MASTER_STYLE.strokeWidth : PILOTI_MASTER_STYLE.strokeWidthTopView);
        } else {
          obj.set('fill', PILOTI_STYLE.fillColor);
          obj.set('stroke', PILOTI_STYLE.strokeColor);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_STYLE.strokeWidth : PILOTI_STYLE.strokeWidthTopView);
        }
      }

      if (obj.isPilotiNivelText) {
        const isCorner = PILOTI_CORNER_IDS.includes(obj.pilotiId);
        if (isCorner) {
          const pilotiCircle = objects.find(o => o.pilotiId === pilotiId && o.isPilotiCircle);
          const centerX = Number(pilotiCircle?.left ?? obj.left ?? 0);
          const centerY = Number(pilotiCircle?.top ?? obj.top ?? 0);
          const radius = Number(pilotiCircle?.radius ?? HOUSE_DEFAULTS.pilotiRadius * HOUSE_DEFAULTS.viewScale);
          const offset = HOUSE_DEFAULTS.pilotiNivelLabelOffset * HOUSE_DEFAULTS.viewScale;
          const isTopCorner = pilotiId === PILOTI_CORNER_ID.topLeft || pilotiId === PILOTI_CORNER_ID.topRight;

          obj.set('text', `Nível = ${formatNivel(nivel)}`);
          obj.set('left', centerX);
          obj.set('top', isTopCorner ? centerY - radius - offset : centerY + radius + offset);
          obj.set('visible', true);
        } else {
          obj.set('text', '');
          obj.set('visible', false);
        }
      }
    }
  });

  group.dirty = true;
}


export function refreshHouseGroupsOnCanvas(canvas: FabricCanvas): void {
  canvas.getObjects()
    .filter(o => isCanvasGroup(o) && o.myType === 'house')
    .forEach(group => refreshHouseGroupRendering(toCanvasGroup(group)));
}

/**
 * Forces Fabric to rebuild caches/bounds for house groups so resized pilotis are actually redrawn.
 * This also fixes Ctrl+Z restore cases where the group comes back "cortado" due to stale cache.
 * IMPORTANT: We must remove and re-add children to force the group to recalculate its bounding box
 * correctly in Fabric v6.
 */
export function refreshHouseGroupRendering(group: CanvasGroup): void {
  group.objectCaching = false;

  // Keep house interaction constraints stable after JSON restore/undo.
  if (group.myType === 'house') {
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  }

  const objects = group.getCanvasObjects();
  objects.forEach(obj => {
    obj.objectCaching = false;
    obj.dirty = true;
    obj.setCoords?.();
  });

  // Z-order sort: normal objects (pilotis, walls, roof) -> ground layers -> markers/labels.
  // Ground elements render in front of pilotis to preserve the "enterrado" visual.
  const groundBack =
    objects.filter(o => o.isGroundElement && !o.isNivelMarker && !o.isNivelLabel);

  const groundFront =
    objects.filter(o => o.isNivelMarker || o.isNivelLabel);

  const normal = objects.filter(o => !o.isGroundElement);
  // Pilotis e estrutura devem ficar na frente de brita/rachão.
  const sorted = [...groundBack, ...normal, ...groundFront];

  // Replace _objects array in-place to reorder Z without remove/add coordinate transforms
  const internalObjects = group._objects;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.length = 0;
    internalObjects.push(...sorted);
  }

  // Polyline/Polygon need pathOffset recalculation
  objects.forEach(obj => {
    if (obj instanceof Polyline || obj instanceof Polygon) {
      obj.setDimensions?.();
    }
  });

  // Recalculate bounds without triggering object coordinate transforms
  group._clearCache?.();
  group._calcBounds?.();
  group.setCoords();
  group.dirty = true;
}
