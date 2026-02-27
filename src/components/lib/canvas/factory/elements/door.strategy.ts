import {Canvas as FabricCanvas, Group, Rect, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const doorStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
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

    const text = new Text('Porta', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.doorElement,
      originX: 'center',
      originY: 'center',
      top: 10,
    });

    const group = new Group([rect, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(group, 'gate');
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return group;
  },
};
