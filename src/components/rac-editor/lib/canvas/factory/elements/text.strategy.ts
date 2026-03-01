import {Canvas as FabricCanvas, IText} from 'fabric';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';
import {CanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';

export const textStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasObject {
    const text = new IText('Texto', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_STYLE.fontColor,
      fontSize: CANVAS_STYLE.fontSize,
    });
    text.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasObjectMyType(text, 'text');
  },
};
