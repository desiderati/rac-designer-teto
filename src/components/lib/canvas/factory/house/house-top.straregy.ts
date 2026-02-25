import {Canvas as FabricCanvas, Circle, FabricObject, Group, IText, Line, Rect, Text} from 'fabric';
import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH,} from '../../constants.ts';

import {formatNivel, formatPilotiHeight} from '../../piloti.ts';
import {
  CANVAS_ELEMENT_STYLE,
  CANVAS_STYLE,
  HOUSE_2D_STYLE,
  HOUSE_DEFAULTS,
  PILOTI_CORNER_ID,
  PILOTI_CORNER_IDS,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
} from '@/config.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';

export function createHouseTop(canvas: FabricCanvas): Group {
  const s = HOUSE_DEFAULTS.viewScale;
  const w = HOUSE_BASE_WIDTH * s;
  const h = HOUSE_BASE_HEIGHT * s;
  const rad = HOUSE_DIMENSIONS.piloti.radius * s;
  const cD = HOUSE_DIMENSIONS.piloti.columnSpacing * s;
  const rD = HOUSE_DIMENSIONS.piloti.rowSpacing * s;

  // Main rect with NO stroke (we'll use 4 separate border lines instead)
  const rect = new Rect({
    width: w,
    height: h,
    fill: HOUSE_2D_STYLE.surfaceBackgroundColor,
    stroke: 'transparent',
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
  });
  (rect as any).isHouseBody = true;

  const houseObjects: FabricObject[] = [rect];

  // Create 4 border lines for individual side highlighting
  const borderStyle = {
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  };

  const borderTop = new Line([-w / 2, -h / 2, w / 2, -h / 2], {...borderStyle});
  (borderTop as any).isHouseBorderEdge = true;
  (borderTop as any).edgeSide = 'top';

  const borderBottom = new Line([-w / 2, h / 2, w / 2, h / 2], {...borderStyle});
  (borderBottom as any).isHouseBorderEdge = true;
  (borderBottom as any).edgeSide = 'bottom';

  const borderLeft = new Line([-w / 2, -h / 2, -w / 2, h / 2], {...borderStyle});
  (borderLeft as any).isHouseBorderEdge = true;
  (borderLeft as any).edgeSide = 'left';

  const borderRight = new Line([w / 2, -h / 2, w / 2, h / 2], {...borderStyle});
  (borderRight as any).isHouseBorderEdge = true;
  (borderRight as any).edgeSide = 'right';

  houseObjects.push(borderTop, borderBottom, borderLeft, borderRight);

  // Door markers on top view (hidden by default, positioned by HouseManager based on side assignments)
  const doorMarkerLong = HOUSE_DIMENSIONS.openings.topDoorMarker.longSize * s;
  const doorMarkerShort = HOUSE_DIMENSIONS.openings.topDoorMarker.shortSize * s;
  const doorMarkerFill = CANVAS_ELEMENT_STYLE.fillColor.doorBody;
  const doorMarkerStroke = CANVAS_ELEMENT_STYLE.strokeColor.doorElement;

  const createDoorMarker =
    (side: 'top' | 'bottom' | 'left' | 'right'): Group => {
      const vertical = side === 'left' || side === 'right';
      const rect = new Rect({
        width: vertical ? doorMarkerShort : doorMarkerLong,
        height: vertical ? doorMarkerLong : doorMarkerShort,
        fill: doorMarkerFill,
        stroke: doorMarkerStroke,
        strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
        strokeUniform: true,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      const label = new Text('Porta', {
        fontSize: CANVAS_STYLE.fontSize * s,
        fontFamily: CANVAS_STYLE.fontFamily,
        fill: doorMarkerStroke,
        originX: 'center',
        originY: 'center',
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

      const doorMarker = new Group([rect, label], {
        ...basePos[side],
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        visible: false,
        objectCaching: false,
      });
      (doorMarker as any).isTopDoorMarker = true;
      (doorMarker as any).doorMarkerSide = side;
      return doorMarker;
    };

  houseObjects.push(
    createDoorMarker('top'),
    createDoorMarker('bottom'),
    createDoorMarker('left'),
    createDoorMarker('right'),
  );

  const defaultHeight = DEFAULT_HOUSE_PILOTI.height;
  const defaultIsMaster = DEFAULT_HOUSE_PILOTI.isMaster;
  const defaultNivel = DEFAULT_HOUSE_PILOTI.nivel;

  let pilotiIndex = 0;
  [-1.5 * cD, -0.5 * cD, 0.5 * cD, 1.5 * cD].forEach((x, colIdx) => {
    [-rD, 0, rD].forEach((y, rowIdx) => {
      const pilotiId = `piloti_${colIdx}_${rowIdx}`;

      // Invisible hit area for mobile (larger touch target)
      const hitArea = new Circle({
        radius: rad * 2,
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
      });
      (hitArea as any).myType = 'pilotiHitArea';
      (hitArea as any).pilotiId = pilotiId;
      (hitArea as any).isPilotiHitArea = true;

      const circle = new Circle({
        radius: rad,
        fill: PILOTI_STYLE.fillColor,
        stroke: PILOTI_STYLE.strokeColor,
        strokeWidth: PILOTI_STYLE.strokeWidthTopView,
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
      });
      (circle as any).myType = 'piloti';
      (circle as any).pilotiId = pilotiId;
      (circle as any).pilotiHeight = defaultHeight;
      (circle as any).pilotiIsMaster = defaultIsMaster;
      (circle as any).pilotiNivel = defaultNivel;
      (circle as any).isPilotiCircle = true;

      const text = new IText(formatPilotiHeight(defaultHeight), {
        fontSize: PILOTI_STYLE.heightFontSizeTopView * s,
        fontFamily: CANVAS_STYLE.fontFamily,
        fill: PILOTI_STYLE.strokeColor,
        originX: 'center',
        originY: 'center',
        left: x,
        top: y,
        editable: false,
        selectable: false,
      });
      (text as any).myType = 'pilotiText';
      (text as any).pilotiId = pilotiId;
      (text as any).isPilotiText = true;

      // Text for nivel (always visible for corner pilotis)
      const isCorner = PILOTI_CORNER_IDS.includes(pilotiId);
      const isTopCorner = pilotiId === PILOTI_CORNER_ID.topLeft || pilotiId === PILOTI_CORNER_ID.topRight;
      const nivelText = new IText(isCorner ? `Nível = ${formatNivel(defaultNivel)}` : '', {
        fontSize: PILOTI_STYLE.nivelFontSizeTopView * s,
        fontFamily: CANVAS_STYLE.fontFamily,
        fontWeight: 'bold',
        fill: PILOTI_MASTER_STYLE.strokeColor,
        originX: 'center',
        originY: 'center',
        left: x,
        top: isTopCorner
          ? y - rad - PILOTI_STYLE.nivelFontSizeTopView * s
          : y + rad + PILOTI_STYLE.nivelFontSizeTopView * s,
        editable: false,
        selectable: false,
        visible: isCorner,
      });
      (nivelText as any).myType = 'pilotiNivelText';
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
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
  });
  (group as any).myType = 'house';
  (group as any).houseView = 'top';
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  return group;
}
