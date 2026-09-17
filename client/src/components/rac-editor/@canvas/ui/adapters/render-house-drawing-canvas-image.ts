import {Canvas as FabricCanvas} from 'fabric';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';

export async function renderHouseDrawingCanvasImageDataUrl(house: PersistedHouseRecord): Promise<string> {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = CANVAS_WIDTH;
  canvasElement.height = CANVAS_HEIGHT;
  canvasElement.style.position = 'fixed';
  canvasElement.style.left = '-10000px';
  canvasElement.style.top = '0';
  document.body.appendChild(canvasElement);

  const canvas = new FabricCanvas(canvasElement, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: CANVAS_STYLE.backgroundColor,
  });

  try {
    const port = createFabricCanvasDocumentPort(canvas);
    const loaded = await port.loadCanvasDocument(house.drawingDocument.canvas);
    if (!loaded) {
      throw new Error('Documento visual da casa inválido.');
    }

    const imageDataUrl = port.exportImageDataUrl();
    if (!imageDataUrl) {
      throw new Error('Não foi possível capturar a imagem do canvas.');
    }

    return imageDataUrl;
  } finally {
    await canvas.dispose();
    canvasElement.remove();
  }
}
