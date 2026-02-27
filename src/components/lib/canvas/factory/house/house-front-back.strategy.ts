import {Canvas as FabricCanvas, FabricObject, Group, Polygon, Polyline, Rect} from 'fabric';

import {createPilotis} from '../../piloti.ts';
import {getHouseScaleFactors} from '@/components/lib/canvas/factory/house/shared.ts';
import {HOUSE_2D_STYLE} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';

export function createHouseFrontBack(
  canvas: FabricCanvas,
  isFront: boolean,
  flipHorizontal: boolean = false
): Group {
  const factors = getHouseScaleFactors(canvas);

  // Front/Back views use the WIDTH of the plant view (horizontal side)
  // The body width should match the plant view's width exactly
  const plantWidth = factors.actualWidth;
  const s = factors.widthFactor;

  const bodyW = plantWidth; // Match the plant view width exactly
  const bodyH = HOUSE_DIMENSIONS.structure.bodyHeight * s;

  const floorW = bodyW;
  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;

  const floorBeanW = bodyW;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const diagH1 = HOUSE_DIMENSIONS.structure.wallHeight * s;
  const diagH2 = HOUSE_DIMENSIONS.structure.diagonalHeight * s;
  const diagW = HOUSE_DIMENSIONS.structure.diagonalWidth * s;

  const leftDiagFill = new Polygon(
    [
      {x: 0, y: diagH2 - diagH1},
      {x: diagW, y: 0},
      {x: diagW, y: diagH2},
      {x: 0, y: diagH2},
    ],
    {fill: HOUSE_2D_STYLE.panelBackgroundColor, strokeWidth: 0, left: 0, top: bodyH - diagH2},
  );

  const chapelW = HOUSE_DIMENSIONS.structure.chapelWidth * s;

  const chapelFill = new Polygon(
    [
      {x: 0, y: bodyH - diagH2},
      {x: chapelW / 2, y: 0},
      {x: chapelW, y: bodyH - diagH2},
      {x: chapelW, y: bodyH},
      {x: 0, y: bodyH},
    ],
    {fill: HOUSE_2D_STYLE.panelBackgroundColor, strokeWidth: 0, left: diagW, top: 0},
  );

  const rightDiagFill = new Polygon(
    [
      {x: 0, y: 0},
      {x: diagW, y: diagH2 - diagH1},
      {x: diagW, y: diagH2},
      {x: 0, y: diagH2},
    ],
    {fill: HOUSE_2D_STYLE.panelBackgroundColor, strokeWidth: 0, left: diagW + chapelW, top: bodyH - diagH2},
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
    {
      fill: HOUSE_2D_STYLE.transparentColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: 0,
      top: 0,
    },
  );

  const elements: FabricObject[] = [leftDiagFill, chapelFill, rightDiagFill, bodyStroke];

  const floor = new Rect({
    width: floorW,
    height: floorH,
    fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    left: 0,
    top: bodyH,
  });
  elements.push(floor);

  const floorBean = new Rect({
    width: floorBeanW,
    height: floorBeanH,
    fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    left: 0,
    top: bodyH + floorH,
  });
  elements.push(floorBean);

  // Front view: door + 2 windows
  // Back view: only right window (w1), no door, no left window
  const doorW = HOUSE_DIMENSIONS.openings.common.doorWidth * s;
  const doorH = HOUSE_DIMENSIONS.openings.common.doorHeight * s;
  const doorShiftX = HOUSE_DIMENSIONS.openings.frontBack.doorShiftX * s;

  const windowW = HOUSE_DIMENSIONS.openings.common.windowWidth * s;
  const windowH = HOUSE_DIMENSIONS.openings.common.windowHeight * s;
  const windowShiftX = HOUSE_DIMENSIONS.openings.frontBack.windowShiftX * s;

  const doorX = bodyW - windowW - windowShiftX - doorW - doorShiftX;
  const doorY = bodyH - doorH;

  const window1FrontX = bodyW - windowW - windowShiftX;
  const window1FrontY = bodyH - doorH;

  const window1BackX = HOUSE_DIMENSIONS.openings.frontBack.windowLateralX * s;
  const window1BackY = bodyH - doorH;

  const window2X = HOUSE_DIMENSIONS.openings.frontBack.windowLateralX * s;
  const window2Y = bodyH - doorH;

  if (isFront) {
    // Front view: right window next to door
    const w1 = new Rect({
      width: windowW,
      height: windowH,
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
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
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
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
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: doorX,
      top: doorY,
    });

    const w2 = new Rect({
      width: windowW,
      height: windowH,
      fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
      stroke: HOUSE_2D_STYLE.outlineStrokeColor,
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
      strokeUniform: true,
      left: window2X,
      top: window2Y,
    });

    elements.push(doorObj, w2);
  }

  // Não precisamos adicionar o terreno, pois o mesmo será criado pelo House Manager.
  createPilotis(elements, bodyW, s, flipHorizontal);

  const group = new Group(elements, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
    objectCaching: false,
  });
  (group as any).myType = 'house';
  (group as any).houseView = isFront ? 'front' : 'back';
  (group as any).isFlippedHorizontally = flipHorizontal;

  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  return group;
}
