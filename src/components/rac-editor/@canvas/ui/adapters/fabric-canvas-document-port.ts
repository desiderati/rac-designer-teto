import type {Canvas as FabricCanvas} from 'fabric';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/@canvas/lib';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';

export function createFabricCanvasDocumentPort(canvas: FabricCanvas): CanvasDocumentPort {
  return {
    exportProjectJson: () => JSON.stringify(canvas.toJSON()),
    loadProjectJson: async (rawContent) => {
      canvas.clear();
      await canvas.loadFromJSON(rawContent);
      refreshHouseGroupsOnCanvas(canvas);
      canvas.renderAll();
      setTimeout(() => {
        canvas.requestRenderAll();
      }, 100);
      return true;
    },
    exportImageDataUrl: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      return canvas.toDataURL();
    },
  };
}
