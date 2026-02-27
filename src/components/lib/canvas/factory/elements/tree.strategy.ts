import {Canvas as FabricCanvas, Circle, Group, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const treeStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const top = new Circle({
      radius: 35,
      fill: CANVAS_ELEMENT_STYLE.fillColor.treeBody,
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      originX: 'center',
      originY: 'center',
      top: -10,
    });

    const trunk = new Circle({
      radius: 3,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      originX: 'center',
      originY: 'center',
      top: -10,
    });

    const text = new Text('Árvore', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      originX: 'center',
      originY: 'center',
      top: 35,
    });

    const group = new Group([top, trunk, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(group, 'tree');
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return group;
  },
};
