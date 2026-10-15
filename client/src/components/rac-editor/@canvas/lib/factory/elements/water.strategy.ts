import {Canvas as FabricCanvas, Group as FabricGroup, Path, Rect, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {createWaterWavePathData} from './vector-textures.ts';

export const waterStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const rect = new Rect({
      width: 200,
      height: 50,
      originX: 'center',
      originY: 'center',
      fill: 'rgba(0, 146, 221, 0.08)',
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.waterElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      transparentCorners: false,
      objectCaching: false,
    });
    const rectObject = setCanvasObjectMyType(rect, 'waterBody');

    const waves = new Path(createWaterWavePathData(200, 50), {
      fill: 'transparent',
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.waterElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    const wavesObject = setCanvasObjectMyType(waves, 'waterWaves');

    const text = new Text('Água', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.waterElement,
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
      stroke: 'white',
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      paintFirst: 'stroke',
    });
    const textObject = setCanvasObjectMyType(text, 'waterLabel');

    const group = new FabricGroup([rectObject, wavesObject, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'water');
  },
};
