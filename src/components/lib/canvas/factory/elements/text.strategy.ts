import {Canvas as FabricCanvas, IText} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';

export const textStrategy: ElementStrategy<IText> = {
  create(canvas: FabricCanvas): IText {
    const text = new IText('Texto', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: 'Arial',
      fill: '#333',
      fontSize: 18,
    });
    text.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return text;
  },
};
