import {Canvas as FabricCanvas, Group, Rect} from 'fabric';

import {createPilotiRect, createPilotiStripeOverlay} from '../../piloti.ts';
import {getHouseScaleFactors} from '@/components/lib/canvas/factory/house/shared.ts';
import {HOUSE_2D_STYLE} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {CanvasGroup, CanvasObject, toCanvasObject} from '../../canvas.ts';
import {setCanvasGroupMyType} from "@/components/lib/canvas/factory/elements/shared.ts";

export function createHouseSide(
  canvas: FabricCanvas,
  hasDoor: boolean,
  isRightSide: boolean = false
): CanvasGroup {

  const factors = getHouseScaleFactors(canvas);

  // Side views use the HEIGHT/DEPTH of the plant view (vertical side)
  // The side width should match the plant view's height exactly
  const plantHeight = factors.actualHeight;
  const s = factors.depthFactor;

  // Match the plant view height exactly
  const sideWidth = plantHeight;
  const wallHeight = HOUSE_DIMENSIONS.structure.wallHeight * s;

  const floorW = sideWidth;
  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;

  const floorBeanW = HOUSE_DIMENSIONS.structure.floorBeamStripDepth * s;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const pilotW = HOUSE_DIMENSIONS.piloti.width * s;

  // Left side: pilotis correspond to column 0 (A1, B1, C1)
  // Right side: pilotis correspond to column 3 (C4, B4, A4 - reversed order)
  const colIndex = isRightSide ? 3 : 0;
  const pilotLabels: CanvasObject[] = [];

  // For right side: C4, B4, A4 (row 2, 1, 0 from left to right)
  // For left side: A1, B1, C1 (row 0, 1, 2 from left to right)
  const p1 =
    createPilotiRect(pilotLabels, colIndex, isRightSide ? 2 : 0, wallHeight, 0, s);

  const p2 =
    createPilotiRect(pilotLabels, colIndex, 1, wallHeight, (sideWidth - pilotW) / 2, s);

  const p3 =
    createPilotiRect(pilotLabels, colIndex, isRightSide ? 0 : 2, wallHeight, sideWidth - pilotW, s);

  const wall = new Rect({
    width: sideWidth,
    height: wallHeight,
    fill: HOUSE_2D_STYLE.panelBackgroundColor,
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    left: 0,
    top: 0,
  });
  const elements: CanvasObject[] = [toCanvasObject(wall)];

  const floor = new Rect({
    width: floorW,
    height: floorH,
    fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    left: 0,
    top: wallHeight,
  });
  elements.push(toCanvasObject(floor));

  const createFloorBeanRect = (left: number) => {
    const floorBean = new Rect({
      width: floorBeanW,
      height: floorBeanH,
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: left,
      top: wallHeight + floorH,
    });
    elements.push(toCanvasObject(floorBean));
  };

  createFloorBeanRect(0);
  createFloorBeanRect((sideWidth - floorBeanW) / 2);
  createFloorBeanRect(sideWidth - floorBeanW);

  if (hasDoor) {
    const doorW = HOUSE_DIMENSIONS.openings.common.doorWidth * s;
    const doorH = HOUSE_DIMENSIONS.openings.common.doorHeight * s;
    const doorShiftX = HOUSE_DIMENSIONS.openings.side.doorShiftX * s;

    const windowW = HOUSE_DIMENSIONS.openings.common.windowWidth * s;
    const windowH = HOUSE_DIMENSIONS.openings.common.windowHeight * s;
    const windowShiftX = HOUSE_DIMENSIONS.openings.side.windowShiftX * s;

    const doorX = sideWidth - doorW - doorShiftX;
    const doorY = wallHeight - doorH;

    const windowX = sideWidth - doorW - doorShiftX - windowW - windowShiftX;
    const windowY = wallHeight - doorH;

    const doorObj = new Rect({
      width: doorW,
      height: doorH,
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: doorX,
      top: doorY,
    });
    const doorObjCanvas = toCanvasObject(doorObj);
    doorObjCanvas.isHouseDoor = true;
    doorObjCanvas.myType = 'door';

    const windowObj = new Rect({
      width: windowW,
      height: windowH,
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: windowX,
      top: windowY,
    });
    elements.push(toCanvasObject(windowObj), toCanvasObject(doorObj));
  }

  // Não precisamos adicionar o terreno, pois o mesmo será criado pelo House Manager.
  elements.push(p1, p2, p3);

  // Add diagonal stripe overlays for each piloti
  const pilotiRects = [p1, p2, p3];
  for (const prObj of pilotiRects) {
    const stripeOverlay =
      createPilotiStripeOverlay(
        prObj.pilotiId ?? '',
        prObj.left ?? 0,
        prObj.top ?? 0,
        pilotW, prObj.height ?? 0
      );
    elements.push(stripeOverlay);
  }

  elements.push(...pilotLabels);

  const group = new Group(elements, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
    objectCaching: false,
  });
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  const groupObj = setCanvasGroupMyType(group, 'house');
  groupObj.houseView = 'side';
  groupObj.isRightSide = isRightSide;
  return groupObj;
}
