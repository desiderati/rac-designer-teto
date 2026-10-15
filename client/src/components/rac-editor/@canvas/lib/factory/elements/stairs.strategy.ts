import {Canvas as FabricCanvas, Group as FabricGroup, Path, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {getHouseScaleFactors} from '@/components/rac-editor/@canvas/lib/factory/house/shared.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';
import {CanvasGroup, CanvasObject} from '../../canvas.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {createStairStepPathData} from './vector-textures.ts';

const STAIRS_WIDTH = 80;
const STAIRS_HEIGHT = 75;
const STAIRS_STEP_COUNT = 4;

export const stairsStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const factors = getHouseScaleFactors(canvas);
    const scale = factors.widthFactor;
    const width = STAIRS_WIDTH * scale;
    const height = STAIRS_HEIGHT * scale;

    const body = new Rect({
      width,
      height,
      originX: 'center',
      originY: 'center',
      fill: CANVAS_ELEMENT_STYLE.fillColor.stairsBody,
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeUniform: true,
      transparentCorners: false,
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    const bodyObject = setCanvasObjectMyType(body, 'stairsBody');

    const steps = new Path(createStairStepPathData(width, height, STAIRS_STEP_COUNT, 'horizontal'), {
      fill: 'transparent',
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeUniform: true,
      strokeLineCap: 'butt',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    const stepsObject = setCanvasObjectMyType(steps, 'stairsSteps');

    const group = new FabricGroup([bodyObject, stepsObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      lockScalingFlip: true,
      objectCaching: false,
    });

    const canvasGroup = setCanvasGroupMyType(group, 'stairs');
    bindStairsCanvasGroupScaling(canvasGroup);
    return canvasGroup;
  },
};

export function bindStairsCanvasGroupScaling(canvasGroup: CanvasGroup): void {
  if (typeof canvasGroup.on !== 'function') return;

  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    const body = this.getCanvasObjects().find((child) => child.myType === 'stairsBody');
    if (!body) return;
    normalizeStairsCanvasGroupToSize(
      this,
      (body.width || 1) * (this.scaleX || 1),
      (body.height || 1) * (this.scaleY || 1),
    );
  });
}

export function normalizeStairsCanvasGroupToSize(
  canvasGroup: CanvasGroup,
  newWidth: number,
  newHeight: number,
): void {
  const width = Math.max(newWidth, 1);
  const height = Math.max(newHeight, 1);
  const children = canvasGroup.getCanvasObjects?.() ?? [];
  const body = children.find((child) => child.myType === 'stairsBody');
  const steps = children.find((child) => child.myType === 'stairsSteps');
  if (!body || !steps) return;

  const previousCenter = canvasGroup.getCenterPoint?.();
  body.set({width, height, left: 0, top: 0, scaleX: 1, scaleY: 1});
  const stepsPath = steps as CanvasObject & {setDimensions?: () => void};
  stepsPath.set({
    path: createStairStepPathData(width, height, STAIRS_STEP_COUNT, 'horizontal'),
    left: 0,
    top: 0,
    scaleX: 1,
    scaleY: 1,
  });
  stepsPath.setDimensions?.();

  canvasGroup.set({width, height, scaleX: 1, scaleY: 1});
  canvasGroup.triggerLayout?.();
  if (previousCenter && canvasGroup.setPositionByOrigin) {
    canvasGroup.setPositionByOrigin(previousCenter, 'center', 'center');
  }
  canvasGroup.setCoords?.();
}
