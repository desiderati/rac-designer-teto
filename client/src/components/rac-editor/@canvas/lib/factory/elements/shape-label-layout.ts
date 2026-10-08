import {Group, type IText} from 'fabric';
import type {CanvasObject} from '../../canvas.ts';

/** Mantém a posição do texto relativa ao corpo, inclusive em grupos já salvos. */
export function positionShapeLabel(group: CanvasObject, kind: 'wall' | 'square' | 'triangle' | 'circle'): void {
  const children = group.getObjects();
  const body = children.find((child) => child.myType === 'wallBody');
  const label = children.find((child) => child.myType === 'wallLabel') as IText | undefined;
  if (!body || !label) return;

  const hasText = Boolean(label.text?.trim());
  label.initDimensions?.();
  const width = body.getScaledWidth();
  const height = body.getScaledHeight();
  const insetScale = kind === 'wall' ? 1 : Math.min(
    1,
    width * (kind === 'triangle' ? 0.6 : 0.8) / Math.max(label.width, 1),
    height * (kind === 'triangle' ? 0.3 : 0.8) / Math.max(label.height, 1),
  );
  label.set({
    left: body.left,
    top: body.top + (kind === 'wall' && hasText ? height / 2 + 18 : kind === 'triangle' ? height * 0.22 : 0),
    visible: hasText,
    scaleX: insetScale,
    scaleY: insetScale,
  });
  if (group instanceof Group) group.triggerLayout();
  group.setCoords?.();
}
