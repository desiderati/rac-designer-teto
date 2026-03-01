import {Canvas as FabricCanvas, Group, Rect, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';

export const doorStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const rect = new Rect({
      width: 100,
      height: 20,
      fill: CANVAS_ELEMENT_STYLE.fillColor.doorBody,
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.doorElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      originX: 'center',
      originY: 'center',
      top: -10,
    });
    const rectObject = setCanvasObjectMyType(rect, 'gateBody');

    const text = new Text('Porta', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.doorElement,
      originX: 'center',
      originY: 'center',
      top: 10,
    });
    const textObject = setCanvasObjectMyType(text, 'gateLabel');

    const group = new Group([rectObject, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'gate');
  },
};
