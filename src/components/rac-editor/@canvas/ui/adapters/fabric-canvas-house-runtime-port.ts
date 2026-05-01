import type {Canvas as FabricCanvas} from 'fabric';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';
import {
  CanvasGroup,
  isCanvasGroup,
} from '@/components/rac-editor/@canvas/lib';

/**
 * Adapta o canvas Fabric ao contrato mínimo usado pela projeção visual da casa.
 */
export function createCanvasHouseRuntimePort(canvas: FabricCanvas): CanvasHouseRuntimePort {
  return {
    requestRenderAll: () => canvas.requestRenderAll(),

    includesGroup: (group: CanvasGroup) => canvas.getObjects().includes(group),

    getHouseGroups: () =>
      canvas.getObjects().filter((object): object is CanvasGroup => isCanvasGroup(object)),
  };
}
