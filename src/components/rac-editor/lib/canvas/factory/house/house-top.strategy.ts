import {Canvas as FabricCanvas, Circle, Group as FabricGroup, IText, Line, Rect, Text} from 'fabric';
import {
  CANVAS_ELEMENT_STYLE,
  CANVAS_STYLE,
  HOUSE_2D_STYLE,
  HOUSE_DEFAULTS,
  PILOTI_CORNER_ID,
  PILOTI_CORNER_IDS,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {CanvasGroup, CanvasObject, toCanvasObject} from '../../canvas.ts';
import {setCanvasGroupMyType} from '@/components/rac-editor/lib/canvas/factory/elements/shared.ts';
import {formatNivel, formatPilotiHeight} from '@/shared/types/piloti.ts';
import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '@/shared/constants.ts';

export function createHouseTop(canvas: FabricCanvas): CanvasGroup {

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
  const rectObject = toCanvasObject(rect);
  rectObject.isHouseBody = true;

  const houseObjects: CanvasObject[] = [rect];

  // Create 4 border lines for individual side highlighting
  const borderStyle = {
    stroke: HOUSE_2D_STYLE.outlineStrokeColor,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  };

  const borderTop = new Line([-w / 2, -h / 2, w / 2, -h / 2], {...borderStyle});
  const borderTopObj = toCanvasObject(borderTop);
  borderTopObj.isHouseBorderEdge = true;
  borderTopObj.edgeSide = 'top';

  const borderBottom = new Line([-w / 2, h / 2, w / 2, h / 2], {...borderStyle});
  const borderBottomObj = toCanvasObject(borderBottom);
  borderBottomObj.isHouseBorderEdge = true;
  borderBottomObj.edgeSide = 'bottom';

  const borderLeft = new Line([-w / 2, -h / 2, -w / 2, h / 2], {...borderStyle});
  const borderLeftObj = toCanvasObject(borderLeft);
  borderLeftObj.isHouseBorderEdge = true;
  borderLeftObj.edgeSide = 'left';

  const borderRight = new Line([w / 2, -h / 2, w / 2, h / 2], {...borderStyle});
  const borderRightObj = toCanvasObject(borderRight);
  borderRightObj.isHouseBorderEdge = true;
  borderRightObj.edgeSide = 'right';

  houseObjects.push(borderTop, borderBottom, borderLeft, borderRight);

  // Door markers on top view (hidden by default, positioned by HouseManager based on side assignments)
  const doorMarkerLong = HOUSE_DIMENSIONS.openings.topDoorMarker.longSize * s;
  const doorMarkerShort = HOUSE_DIMENSIONS.openings.topDoorMarker.shortSize * s;
  const doorMarkerFill = CANVAS_ELEMENT_STYLE.fillColor.doorBody;
  const doorMarkerStroke = CANVAS_ELEMENT_STYLE.strokeColor.doorElement;

  const createDoorMarker =
    (side: 'top' | 'bottom' | 'left' | 'right'): CanvasObject => {
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

      const doorMarker = new FabricGroup([rect, label], {
        ...basePos[side],
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        visible: false,
        objectCaching: false,
      });

      const doorMarkerObj = toCanvasObject(doorMarker);
      doorMarkerObj.isTopDoorMarker = true;
      doorMarkerObj.doorMarkerSide = side;
      return doorMarkerObj;
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

      const hitAreaObj = toCanvasObject(hitArea);
      hitAreaObj.myType = 'pilotiHitArea';
      hitAreaObj.pilotiId = pilotiId;
      hitAreaObj.isPilotiHitArea = true;

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

      const circleObj = toCanvasObject(circle);
      circleObj.myType = 'piloti';
      circleObj.pilotiId = pilotiId;
      circleObj.pilotiHeight = defaultHeight;
      circleObj.pilotiIsMaster = defaultIsMaster;
      circleObj.pilotiNivel = defaultNivel;
      circleObj.isPilotiCircle = true;

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

      const textObj = toCanvasObject(text);
      textObj.myType = 'pilotiText';
      textObj.pilotiId = pilotiId;
      textObj.isPilotiText = true;

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

      const nivelTextObj = toCanvasObject(nivelText);
      nivelTextObj.myType = 'pilotiNivelText';
      nivelTextObj.pilotiId = pilotiId;
      nivelTextObj.isPilotiNivelText = true;

      // Add hit area first (behind), then circle, then text, then nivel text
      houseObjects.push(hitArea);
      houseObjects.push(circle);
      houseObjects.push(text);
      houseObjects.push(nivelText);
      pilotiIndex++;
    });
  });

  const group = new FabricGroup(houseObjects, {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,
  });
  group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});

  const groupObj = setCanvasGroupMyType(group, 'house');
  groupObj.houseView = 'top';
  return groupObj;
}
