import {Canvas as FabricCanvas, Group, Polygon, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const fossaStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const numPoints = 10;
    const baseRadiusX = 60;
    const baseRadiusY = 40;
    const points: { x: number; y: number }[] = [];

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
      fill: CANVAS_ELEMENT_STYLE.fillColor.fossaBody,
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.fossaElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      originX: 'center',
      originY: 'center',
    });

    const text = new Text('Fossa', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.fossaElement,
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
