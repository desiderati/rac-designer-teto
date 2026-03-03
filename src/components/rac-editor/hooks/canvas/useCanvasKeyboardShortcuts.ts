import {useCallback} from 'react';
import {Canvas as FabricCanvas, IText} from 'fabric';
import {CanvasObject} from '@/components/rac-editor/lib/canvas';

interface BindKeyboardShortcutsArgs {
  canvas: FabricCanvas;
  isAnyEditorOpen: () => boolean;
  tryDelete: () => boolean;
  onSelectionChange: (message: string) => void;
  copy: () => void;
  paste: () => void;
  undo: () => void;
}

export function useCanvasKeyboardShortcuts() {

  const bindKeyboardShortcuts = useCallback(({
    canvas,
    isAnyEditorOpen,
    tryDelete,
    onSelectionChange,
    copy,
    paste,
    undo,
  }: BindKeyboardShortcutsArgs) => {

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTypingTarget =
        !!target &&
        (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable);
      if (isTypingTarget) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (isAnyEditorOpen()) return;

        const activeObject = canvas.getActiveObject();
        if (!activeObject || (activeObject.type !== 'i-text' || !(activeObject as IText).isEditing)) {
          if (tryDelete()) {
            event.preventDefault();
            return;
          }

          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach((object) => canvas.remove(object));
            onSelectionChange('Objeto excluído.');
          }
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        copy();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        paste();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      }
    };

    const handleObjectRotating =
      (event: { target?: CanvasObject | null }) => {
        const object = event.target ?? null;
        if (!object) return;

        const snapAngle = 10;
        let angle = (object.angle || 0) % 360;
        if (angle < 0) angle += 360;

        if (angle < snapAngle || angle > 360 - snapAngle) {
          object.angle = 0;
        } else if (Math.abs(angle - 90) < snapAngle) {
          object.angle = 90;
        } else if (Math.abs(angle - 180) < snapAngle) {
          object.angle = 180;
        } else if (Math.abs(angle - 270) < snapAngle) {
          object.angle = 270;
        }
      };

    window.addEventListener('keydown', handleKeyDown);
    canvas.on('object:rotating', handleObjectRotating);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.off('object:rotating', handleObjectRotating);
    };
  }, []);

  return {bindKeyboardShortcuts};
}
