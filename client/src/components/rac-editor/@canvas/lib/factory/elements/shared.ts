import {FabricObject, Group as FabricGroup} from 'fabric';
import {CanvasGroup, CanvasObject, toCanvasGroup, toCanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export const LINEAR_LABEL_TOP = -20;

const cornerOnlyKinds = new Set(['siteHouse', 'siteBuilding', 'terrainEntry', 'tree', 'water', 'fossa']);

/** A visibilidade dos controles é runtime e precisa ser reaplicada ao reabrir o documento. */
export function applyElementControlPolicy(object: CanvasObject): void {
  if (!cornerOnlyKinds.has(object.myType)) return;
  object.setControlsVisibility({mt: false, mb: false, ml: false, mr: false,
    tl: true, tr: true, bl: true, br: true, mtr: true});
}

export function setCanvasGroupMyType(group: FabricGroup, myType: string): CanvasGroup;
export function setCanvasGroupMyType<T extends { myType?: string }>(group: T, myType: string): T;
export function setCanvasGroupMyType(
  group: FabricGroup | { myType?: string },
  myType: string,
): CanvasGroup | { myType?: string } {

  if (group instanceof FabricGroup) {
    const canvasGroup = toCanvasGroup(group);
    canvasGroup.myType = myType;
    applyElementControlPolicy(canvasGroup);
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
