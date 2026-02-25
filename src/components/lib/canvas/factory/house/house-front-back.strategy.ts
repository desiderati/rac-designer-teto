import {Canvas as FabricCanvas, FabricObject, Group, Polygon, Polyline, Rect, Text} from 'fabric';
import {BASE_PILOTI_HEIGHT_PX} from '../../constants.ts';

import {createGroundElements, formatNivel, formatPilotiHeight, getPilotiVisualHeight} from '../../piloti.ts';
import {createPilotiStripeOverlay, getHouseScaleFactors} from '@/components/lib/canvas/factory/house/shared.ts';

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
      fill: '#ffffff',
      stroke: '#333',
      strokeWidth: 2,
      strokeUniform: true,
      left: margin + i * step,
      top: bodyH + floorH + floorBeanH,
      originY: 'top',
      objectCaching: false,
    });
    (rect as any).myType = 'piloti';
    (rect as any).pilotiId = pilotiId;
    (rect as any).pilotiHeight = defaultHeight;
    (rect as any).pilotiIsMaster = false;
    (rect as any).pilotiNivel = 0.2;
    (rect as any).isPilotiRect = true;
    (rect as any).pilotiBaseHeight = BASE_PILOTI_HEIGHT_PX * s;

    pilots.push(rect);

    // Add diagonal stripe overlay for bottom 2/3
    const stripeOverlay =
      createPilotiStripeOverlay(pilotiId, margin + i * step, bodyH + floorH + floorBeanH, pilotW, pilotH);
    pilots.push(stripeOverlay);

    // Create size label below piloti (font size 20 * scale for visibility)
    // Position at center of piloti rect (rect.left + pilotW/2)
    const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
      fontSize: 20 * s,
      fill: '#666',
      backgroundColor: '#ffffff',
      left: margin + i * step + pilotW / 2,
      top: bodyH + floorH + floorBeanH + pilotH + 8 * s,
      originX: 'center',
      originY: 'top',
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
    {fill: '#eeeeee', strokeWidth: 1, left: 0, top: bodyH - diagH2},
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
    {fill: '#eeeeee', strokeWidth: 1, left: diagW, top: 0},
  );

  const rightDiagFill = new Polygon(
    [
      {x: 0, y: 0},
      {x: diagW, y: diagH2 - diagH1},
      {x: diagW, y: diagH2},
      {x: 0, y: diagH2},
    ],
    {fill: '#eeeeee', strokeWidth: 1, left: diagW + chapelW, top: bodyH - diagH2},
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
    {fill: 'transparent', stroke: '#333', strokeWidth: 2, strokeUniform: true, left: 0, top: 0},
  );

  const elements: FabricObject[] = [leftDiagFill, chapelFill, rightDiagFill, bodyStroke];

  const floor = new Rect({
    width: floorW,
    height: floorH,
    fill: '#fff',
    stroke: '#333',
    strokeWidth: 2,
    strokeUniform: true,
    left: 0,
    top: bodyH,
  });
  elements.push(floor);

  const floorBean = new Rect({
    width: floorBeanW,
    height: floorBeanH,
    fill: '#fff',
    stroke: '#333',
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
      fill: '#fff',
      stroke: '#333',
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
      fill: '#fff',
      stroke: '#333',
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
      fill: '#fff',
      stroke: '#333',
      strokeWidth: 1.5,
      strokeUniform: true,
      left: doorX,
      top: doorY,
    });

    const w2 = new Rect({
      width: windowW,
      height: windowH,
      fill: '#fff',
      stroke: '#333',
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
  const groundBack =
    groundElems.filter((o: any) => o.isGroundFill || o.isGroundLine);

  const groundFront =
    groundElems.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  elements.push(...pilots);
  elements.push(...pilotLabels);
  elements.push(...groundBack);
  elements.push(...groundFront);

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

