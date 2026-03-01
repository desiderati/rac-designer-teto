import {Canvas as FabricCanvas, Circle, Group, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';

export const treeStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const top = new Circle({
      radius: 35,
      fill: CANVAS_ELEMENT_STYLE.fillColor.treeBody,
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      originX: 'center',
      originY: 'center',
      top: -10,
    });
    const topObject = setCanvasObjectMyType(top, 'treeBody');

    const trunk = new Circle({
      radius: 3,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      originX: 'center',
      originY: 'center',
      top: -10,
    });
    const trunkObject = setCanvasObjectMyType(trunk, 'treeTrunk');

    const text = new Text('Árvore', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.treeElement,
      originX: 'center',
      originY: 'center',
      top: 35,
    });
    const textObject = setCanvasObjectMyType(text, 'treeLabel');

    const group = new Group([topObject, trunkObject, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'tree');
  },
};
