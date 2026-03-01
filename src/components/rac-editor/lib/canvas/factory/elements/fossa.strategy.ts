import {Canvas as FabricCanvas, Group as FabricGroup, Polygon, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/rac-editor/lib/canvas/canvas.ts';

export const fossaStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
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
    const blobObject = setCanvasObjectMyType(blob, 'fossaBody');

    const text = new Text('Fossa', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.fossaElement,
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    });
    const textObject = setCanvasObjectMyType(text, 'fossaLabel');

    const group = new FabricGroup([blobObject, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'fossa');
  },
};
