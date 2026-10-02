import type {CanvasObject} from './canvas.ts';

/** Recoloca objetos cortados pelos limites físicos do Fabric em área editável. */
export function recoverCanvasObjects(
  objects: CanvasObject[],
  canvasWidth: number,
  canvasHeight: number,
  readOnly = false,
  visibleRect?: {left: number; top: number; width: number; height: number},
): number {
  if (readOnly) return 0;
  const inset = 24;
  const usableWidth = Math.max(1, canvasWidth - inset * 2);
  const usableHeight = Math.max(1, canvasHeight - inset * 2);
  const visible = visibleRect ? {
    left: Math.max(0, visibleRect.left),
    top: Math.max(0, visibleRect.top),
    right: Math.min(canvasWidth, visibleRect.left + visibleRect.width),
    bottom: Math.min(canvasHeight, visibleRect.top + visibleRect.height),
  } : null;
  let recovered = 0;

  for (const object of objects) {
    object.setCoords();
    let bounds = object.getBoundingRect();
    if (visible) {
      const intersects = bounds.left < visible.right && bounds.left + bounds.width > visible.left
        && bounds.top < visible.bottom && bounds.top + bounds.height > visible.top;
      if (intersects) continue;
    } else {
      const clipped = bounds.left < 0 || bounds.top < 0
        || bounds.left + bounds.width > canvasWidth
        || bounds.top + bounds.height > canvasHeight;
      if (!clipped) continue;
    }

    const scale = Math.min(1, usableWidth / Math.max(bounds.width, 1), usableHeight / Math.max(bounds.height, 1));
    if (!visible && scale < 1) {
      object.set({scaleX: (object.scaleX || 1) * scale, scaleY: (object.scaleY || 1) * scale});
      object.setCoords();
      bounds = object.getBoundingRect();
    }

    const minLeft = visible ? Math.max(inset, visible.left + inset) : inset;
    const minTop = visible ? Math.max(inset, visible.top + inset) : inset;
    const maxLeft = visible ? Math.min(canvasWidth - inset - bounds.width, visible.right - inset - bounds.width)
      : canvasWidth - inset - bounds.width;
    const maxTop = visible ? Math.min(canvasHeight - inset - bounds.height, visible.bottom - inset - bounds.height)
      : canvasHeight - inset - bounds.height;
    const targetLeft = Math.max(inset, Math.min(Math.max(bounds.left, minLeft), Math.max(minLeft, maxLeft)));
    const targetTop = Math.max(inset, Math.min(Math.max(bounds.top, minTop), Math.max(minTop, maxTop)));
    object.set({
      left: (object.left || 0) + targetLeft - bounds.left,
      top: (object.top || 0) + targetTop - bounds.top,
    });
    object.setCoords();
    recovered += 1;
  }

  return recovered;
}
