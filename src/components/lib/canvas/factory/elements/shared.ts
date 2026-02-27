import {Group} from "fabric";

export const LINEAR_LABEL_TOP = -20;

export function setCanvasObjectMyType(object: object, myType: string): void {
  (object as { myType?: string }).myType = myType;
}

/**
 * Liga um handler de `scaling` ao grupo Fabric que:
 * 1. Impede reentrância (flag `__normalizingScale`).
 * 2. Delega a normalização para o `callback` fornecido.
 *
 * @param group   Grupo Fabric ao qual o handler será vinculado.
 * @param callback Função de normalização chamada dentro do guard.
 *                 Recebe o grupo como `this`.
 */
export function withScalingGuard(
  group: Group,
  callback: (this: Group) => void,
): void {
  group.on('scaling', function (this: Group) {
    const g = this as Group & { __normalizingScale?: boolean };
    if (g.__normalizingScale) return;
    g.__normalizingScale = true;
    try {
      callback.call(this);
    } finally {
      g.__normalizingScale = false;
    }
  });
}
