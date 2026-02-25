import {Canvas as FabricCanvas, Group, Polygon, Text} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const fossaStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const numPoints = 10;
    const baseRadiusX = 60;
    const baseRadiusY = 40;
    const points: {x: number; y: number}[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const variation = 0.75 + Math.random() * 0.5;
      const rx = baseRadiusX * variation;
      const ry = baseRadiusY * variation;
      points.push({
        x: rx * Math.cos(angle),
        y: ry * Math.sin(angle),
      });
    }

    const blob = new Polygon(points, {
      fill: 'rgba(139, 90, 43, 0.3)',
      stroke: '#5D4037',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
    });

    const text = new Text('Fossa', {
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#5D4037',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    });

    const group = new Group([blob, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(group, 'fossa');
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return group;
  },
};
