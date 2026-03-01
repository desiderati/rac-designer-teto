import {FabricObject, Group as FabricGroup} from 'fabric';
import {CanvasGroup, CanvasObject, toCanvasGroup, toCanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';

export const LINEAR_LABEL_TOP = -20;

export function setCanvasGroupMyType(group: FabricGroup, myType: string): CanvasGroup;
export function setCanvasGroupMyType<T extends { myType?: string }>(group: T, myType: string): T;
export function setCanvasGroupMyType(
  group: FabricGroup | { myType?: string },
  myType: string,
): CanvasGroup | { myType?: string } {

  if (group instanceof FabricGroup) {
    const canvasGroup = toCanvasGroup(group);
    canvasGroup.myType = myType;
    return canvasGroup;
  }

  group.myType = myType;
  return group;
}

export function setCanvasObjectMyType(object: FabricObject, myType: string): CanvasObject;
export function setCanvasObjectMyType<T extends { myType?: string }>(object: T, myType: string): T;
export function setCanvasObjectMyType(
  object: FabricObject | { myType?: string },
  myType: string,
): CanvasObject | { myType?: string } {

  if (object instanceof FabricObject) {
    const canvasObject = toCanvasObject(object);
    canvasObject.myType = myType;
    return canvasObject;
  }

  object.myType = myType;
  return object;
}

/**
 * Liga um handler de `scaling` ao grupo Fabric que:
 * 1. Impede reentrância (flag `__normalizingScale`).
 * 2. Delega a normalização para o `callback` fornecido.
 *
 * @param group    CanvasObject ao qual o handler será vinculado.
 * @param callback Função de normalização chamada dentro do guard.
 *                 Recebe o grupo como `this`.
 */
export function withScalingGuard(
  group: CanvasObject,
  callback: (this: CanvasObject) => void,
): void {
  group.on('scaling', function (this: CanvasObject) {
    const g = this as CanvasObject & { __normalizingScale?: boolean };
    if (g.__normalizingScale) return;

    g.__normalizingScale = true;
    try {
      callback.call(this);
    } finally {
      g.__normalizingScale = false;
    }
  });
}
