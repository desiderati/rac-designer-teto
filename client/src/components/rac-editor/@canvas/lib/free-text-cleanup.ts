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
  let isUnbound = false;
  const pendingTargets = new Set<CanvasObject>();

  const handleTextEditingExited = (event: TextEditingExitedEvent) => {
    const target = event.target;
    if (!target || pendingTargets.has(target)) return;

    // O Fabric ainda pode emitir `object:modified` logo depois deste evento.
    // Remover o IText aqui faz o Fabric desanexar `target.canvas` antes da
    // emissão final e pode gerar `Cannot read properties of undefined (fire)`.
    // A microtask mantém a limpeza no mesmo ciclo visual, mas somente após o
    // Fabric concluir sua sequência interna de saída da edição.
    pendingTargets.add(target);
    queueMicrotask(() => {
      pendingTargets.delete(target);
      if (!isUnbound) removeEmptyFreeTextObject(canvas, target);
    });
  };

  canvas.on('text:editing:exited', handleTextEditingExited);

  return () => {
    isUnbound = true;
    pendingTargets.clear();
    canvas.off('text:editing:exited', handleTextEditingExited);
  };
}
