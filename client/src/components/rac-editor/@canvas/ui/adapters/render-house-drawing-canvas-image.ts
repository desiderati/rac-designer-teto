import {Canvas as FabricCanvas} from 'fabric';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {
  createFabricCanvasDocumentPort,
  sanitizeCanvasDocumentForSafeExport,
} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';

export interface HouseDrawingCanvasImageCapture {
  imageDataUrl: string;
  hasOmittedRasterSources: boolean;
}

const houseDrawingImageCache = new Map<string, Promise<HouseDrawingCanvasImageCapture>>();
const MAX_HOUSE_DRAWING_CACHE_ENTRIES = 24;

function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function getHouseDrawingImageCacheKey(house: PersistedHouseRecord): string {
  return [
    house.id,
    house.version,
    house.updatedAt,
    house.drawingDocument.schemaVersion,
    house.drawingDocument.canvas.schemaVersion,
    fingerprint(JSON.stringify(house.drawingDocument.canvas)),
  ].join(':');
}

export function clearHouseDrawingCanvasImageCache(): void {
  houseDrawingImageCache.clear();
}

export async function renderHouseDrawingCanvasImageDataUrl(house: PersistedHouseRecord): Promise<HouseDrawingCanvasImageCapture> {
  const cacheKey = getHouseDrawingImageCacheKey(house);
  const cached = houseDrawingImageCache.get(cacheKey);
  if (cached) return cached;

  const rendering = renderHouseDrawingCanvasImageDataUrlUncached(house).catch((error: unknown) => {
    houseDrawingImageCache.delete(cacheKey);
    throw error;
  });
  if (houseDrawingImageCache.size >= MAX_HOUSE_DRAWING_CACHE_ENTRIES) {
    const oldestKey = houseDrawingImageCache.keys().next().value;
    if (oldestKey) houseDrawingImageCache.delete(oldestKey);
  }
  houseDrawingImageCache.set(cacheKey, rendering);
  return rendering;
}

async function renderHouseDrawingCanvasImageDataUrlUncached(house: PersistedHouseRecord): Promise<HouseDrawingCanvasImageCapture> {
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
    // A fonte persistida precisa ser examinada antes de o Fabric reidratá-la:
    // uma falha de carregamento pode remover o objeto do runtime sem deixar
    // vestígios na captura posterior.
    const sanitized = await sanitizeCanvasDocumentForSafeExport(house.drawingDocument.canvas);
    const loaded = await port.loadCanvasDocument(sanitized.document);
    if (!loaded) {
      throw new Error('Documento visual da casa inválido.');
    }

    const capture = port.exportSafeImageDataUrlWithStatus
      ? await port.exportSafeImageDataUrlWithStatus()
      : {imageDataUrl: port.exportSafeImageDataUrl
        ? await port.exportSafeImageDataUrl()
        : port.exportImageDataUrl(), hasOmittedRasterSources: false};
    if (!capture.imageDataUrl) {
      throw new Error('Não foi possível capturar a imagem do canvas.');
    }

    return {
      imageDataUrl: capture.imageDataUrl,
      hasOmittedRasterSources: sanitized.hasOmittedRasterSources || capture.hasOmittedRasterSources,
    };
  } finally {
    await canvas.dispose();
    canvasElement.remove();
  }
}
