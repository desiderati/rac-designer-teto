import type {Canvas as FabricCanvas} from 'fabric';
import type {CanvasObject} from './canvas.ts';

type TextCleanupCanvas = Pick<
  FabricCanvas,
  'remove' | 'discardActiveObject' | 'requestRenderAll' | 'getActiveObject' | 'on' | 'off'
>;

type TextEditingExitedEvent = {
  target?: CanvasObject | null;
};

export function removeEmptyFreeTextObject(
  canvas: Pick<FabricCanvas, 'remove' | 'discardActiveObject' | 'requestRenderAll' | 'getActiveObject'>,
  target: CanvasObject | null | undefined,
): boolean {
  if (!target || target.myType !== 'text') return false;
  if ((target.text ?? '').trim().length > 0) return false;

  if (canvas.getActiveObject() === target) {
    canvas.discardActiveObject();
  }
  canvas.remove(target);
  canvas.requestRenderAll();
  return true;
}

export function bindEmptyFreeTextCleanup(canvas: TextCleanupCanvas): () => void {
  const handleTextEditingExited = (event: TextEditingExitedEvent) => {
    removeEmptyFreeTextObject(canvas, event.target);
  };

  canvas.on('text:editing:exited', handleTextEditingExited);

  return () => {
    canvas.off('text:editing:exited', handleTextEditingExited);
  };
}
