export const LINEAR_LABEL_TOP = -20;

export function setCanvasObjectMyType(object: object, myType: string): void {
  (object as {myType?: string}).myType = myType;
}
