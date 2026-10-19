import type {Canvas, FabricObject} from 'fabric';

const LOCKS = {
  lockMovementX: true, lockMovementY: true,
  lockScalingX: true, lockScalingY: true,
  lockRotation: true, lockSkewingX: true, lockSkewingY: true,
  hasControls: false,
} as const;
type InspectableObject = FabricObject & {editable?: boolean; subTargetCheck?: boolean; interactive?: boolean};

/** Mantém seleção para consulta, inclusive após hidratação e multisseleção. */
export function bindReadOnlyCanvasInteraction(canvas: Canvas): () => void {
  const originals = new Map<InspectableObject, Record<string, unknown>>();
  const protect = (target: FabricObject) => {
    const object = target as InspectableObject;
    if (originals.has(object)) return;
    const original: Record<string, unknown> = {};
    for (const key of Object.keys(LOCKS) as Array<keyof typeof LOCKS>) original[key] = object[key];
    const patch: Record<string, unknown> = {...LOCKS};
    for (const key of ['editable', 'subTargetCheck', 'interactive'] as const) {
      if (key in object) {original[key] = object[key]; patch[key] = false;}
    }
    originals.set(object, original);
    object.set(patch);
  };
  const added = ({target}: {target: FabricObject}) => protect(target);
  const removed = ({target}: {target: FabricObject}) => {
    const original = originals.get(target as InspectableObject);
    if (original) target.set(original);
    originals.delete(target as InspectableObject);
  };
  const selected = () => {const active = canvas.getActiveObject(); if (active) protect(active);};
  canvas.getObjects().forEach(protect);
  selected();
  canvas.on('object:added', added);
  canvas.on('object:removed', removed);
  canvas.on('selection:created', selected);
  canvas.on('selection:updated', selected);
  return () => {
    canvas.off('object:added', added);
    canvas.off('object:removed', removed);
    canvas.off('selection:created', selected);
    canvas.off('selection:updated', selected);
    originals.forEach((original, object) => object.set(original));
  };
}
