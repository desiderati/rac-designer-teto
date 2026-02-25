import {Canvas as FabricCanvas, IText} from 'fabric';
import {CANVAS_STYLE} from '@/config.ts';
import {ElementStrategy} from './element.strategy.ts';

export const textStrategy: ElementStrategy<IText> = {
  create(canvas: FabricCanvas): IText {
    const text = new IText('Texto', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_STYLE.fontColor,
      fontSize: CANVAS_STYLE.fontSize,
    });
    text.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return text;
  },
};
