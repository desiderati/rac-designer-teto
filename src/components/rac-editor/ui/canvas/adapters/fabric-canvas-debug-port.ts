import type {Canvas as FabricCanvas} from 'fabric';
import {toCanvasGroup, toCanvasObject} from '@/components/rac-editor/lib/canvas';
import type {CanvasDebugPort} from '@/components/rac-editor/store/CanvasDebugPort.ts';

export function createFabricCanvasDebugPort(canvas: FabricCanvas): CanvasDebugPort {
  return {
    getCanvasScreenCenter: () => {
      const container = canvas.getElement().parentElement;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    },
    removeObject: (object) => {
      canvas.remove(object);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      return true;
    },
    selectObjectByMyType: (myType, fromEnd = true, triggerInlineEditor = false) => {
      const objects =
        canvas.getObjects().filter((object) => {
          const canvasObject = toCanvasObject(object);
          return canvasObject?.myType === myType;
        });
      if (objects.length === 0) return false;

      const target = fromEnd ? objects[objects.length - 1] : objects[0];
      canvas.discardActiveObject();
      canvas.setActiveObject(target);
      if (triggerInlineEditor) {
        canvas.fire('mouse:dblclick', {
          target,
          subTargets: [target],
        } as never);
      }
      canvas.fire('selection:created', {
        target,
        selected: [target],
      } as never);
      canvas.requestRenderAll();
      return true;
    },
    getActiveObjectSummary: () => {
      const activeObject = toCanvasGroup(canvas.getActiveObject());
      if (!activeObject) return null;

      const children = activeObject.getCanvasObjects();
      const labelObject = children.find((child) =>
        child?.myType === 'objLabel' || child?.myType === 'wallLabel'
      );
      const colorObject = children.find((child) =>
        child?.myType !== 'objLabel' && child?.myType !== 'wallLabel'
      );
      const color = colorObject?.stroke ?? colorObject?.fill ?? null;

      return {
        type: activeObject.type ?? null,
        myType: activeObject.myType ?? null,
        labelText: labelObject?.text ?? null,
        color: typeof color === 'string' ? color : null,
      };
    },
    getObjectsSummary: () =>
      canvas.getObjects().map((object) => {
        const canvasObject = toCanvasObject(object);
        return {
          type: canvasObject?.type ?? null,
          myType: canvasObject?.myType ?? null,
        };
      }),
  };
}
