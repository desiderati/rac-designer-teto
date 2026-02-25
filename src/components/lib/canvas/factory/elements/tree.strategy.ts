import {Canvas as FabricCanvas, Circle, Group, Text} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const treeStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const top = new Circle({
      radius: 35,
      fill: 'rgba(46, 204, 113, 0.6)',
      stroke: '#27ae60',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      top: -10,
    });

    const trunk = new Circle({
      radius: 3,
      fill: '#5d4037',
      originX: 'center',
      originY: 'center',
      top: -10,
    });

    const text = new Text('Árvore', {
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333',
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
