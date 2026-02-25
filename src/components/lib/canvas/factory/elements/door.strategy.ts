import {Canvas as FabricCanvas, Group, Rect, Text} from 'fabric';
import {MASTER_PILOTI_FILL, MASTER_PILOTI_STROKE_COLOR, MASTER_PILOTI_STROKE_WIDTH} from '@/components/lib/canvas';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const doorStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const rect = new Rect({
      width: 100,
      height: 20,
      fill: MASTER_PILOTI_FILL,
      stroke: MASTER_PILOTI_STROKE_COLOR,
      strokeWidth: MASTER_PILOTI_STROKE_WIDTH,
      originX: 'center',
      originY: 'center',
      top: -10,
    });

    const text = new Text('Porta', {
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#333',
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
