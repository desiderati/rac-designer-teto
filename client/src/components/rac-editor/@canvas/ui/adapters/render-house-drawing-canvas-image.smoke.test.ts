import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';

const mocks = vi.hoisted(() => ({
  createPort: vi.fn(),
  sanitize: vi.fn(),
  FabricCanvas: vi.fn(),
}));

vi.mock('fabric', async (importOriginal) => ({
  ...(await importOriginal()),
  Canvas: mocks.FabricCanvas,
}));
vi.mock('./fabric-canvas-document-port.ts', () => ({
  createFabricCanvasDocumentPort: mocks.createPort,
  sanitizeCanvasDocumentForSafeExport: mocks.sanitize,
}));

import {
  clearHouseDrawingCanvasImageCache,
  renderHouseDrawingCanvasImageDataUrl,
} from './render-house-drawing-canvas-image.ts';

const house = {
  id: 'house-1',
  version: 1,
  updatedAt: '2026-10-15T00:00:00.000Z',
  drawingDocument: {schemaVersion: 1, canvas: {schemaVersion: 1, objects: []}},
} as PersistedHouseRecord;

function deferred<T>() {
  let resolve!: (value: T) => void;
  return {promise: new Promise<T>((done) => {resolve = done;}), resolve};
}

describe('render-house-drawing-canvas-image.ts', () => {
  beforeEach(() => {
    clearHouseDrawingCanvasImageCache();
    mocks.createPort.mockReset();
    mocks.sanitize.mockReset().mockResolvedValue({document: house.drawingDocument.canvas, hasOmittedRasterSources: false});
    mocks.FabricCanvas.mockReset().mockImplementation(() => ({dispose: vi.fn().mockResolvedValue(undefined)}));
  });

  afterEach(() => {
    clearHouseDrawingCanvasImageCache();
    document.querySelectorAll('canvas').forEach((canvas) => canvas.remove());
  });

  it('deduplica em voo e tenta novamente após captura com fontes omitidas', async () => {
    const firstCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
    const exportCapture = vi.fn()
      .mockReturnValueOnce(firstCapture.promise)
      .mockResolvedValueOnce({imageDataUrl: 'data:image/png;base64,complete', hasOmittedRasterSources: false});
    mocks.createPort.mockImplementation(() => ({
      loadCanvasDocument: vi.fn().mockResolvedValue(true),
      exportSafeImageDataUrlWithStatus: exportCapture,
    }));

    const first = renderHouseDrawingCanvasImageDataUrl(house);
    const concurrent = renderHouseDrawingCanvasImageDataUrl(house);
    await vi.waitFor(() => expect(exportCapture).toHaveBeenCalledOnce());
    firstCapture.resolve({imageDataUrl: 'data:image/png;base64,partial', hasOmittedRasterSources: true});
    expect(await first).toEqual({imageDataUrl: 'data:image/png;base64,partial', hasOmittedRasterSources: true});
    expect(await concurrent).toEqual(await first);
    expect(mocks.FabricCanvas).toHaveBeenCalledTimes(1);

    expect(await renderHouseDrawingCanvasImageDataUrl(house)).toEqual({
      imageDataUrl: 'data:image/png;base64,complete', hasOmittedRasterSources: false,
    });
    expect(mocks.FabricCanvas).toHaveBeenCalledTimes(2);
    expect(await renderHouseDrawingCanvasImageDataUrl(house)).toEqual({
      imageDataUrl: 'data:image/png;base64,complete', hasOmittedRasterSources: false,
    });
    expect(mocks.FabricCanvas).toHaveBeenCalledTimes(2);
  });

  it('não deixa a captura antiga apagar nova promessa após limpeza do cache', async () => {
    const oldCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
    const newCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
    const exportCapture = vi.fn().mockReturnValueOnce(oldCapture.promise).mockReturnValueOnce(newCapture.promise);
    mocks.createPort.mockImplementation(() => ({
      loadCanvasDocument: vi.fn().mockResolvedValue(true),
      exportSafeImageDataUrlWithStatus: exportCapture,
    }));

    const oldRendering = renderHouseDrawingCanvasImageDataUrl(house);
    await vi.waitFor(() => expect(exportCapture).toHaveBeenCalledTimes(1));
    clearHouseDrawingCanvasImageCache();
    const newRendering = renderHouseDrawingCanvasImageDataUrl(house);
    await vi.waitFor(() => expect(exportCapture).toHaveBeenCalledTimes(2));
    oldCapture.resolve({imageDataUrl: 'data:image/png;base64,partial', hasOmittedRasterSources: true});
    await oldRendering;
    expect(mocks.FabricCanvas).toHaveBeenCalledTimes(2);
    const reused = renderHouseDrawingCanvasImageDataUrl(house);
    newCapture.resolve({imageDataUrl: 'data:image/png;base64,new', hasOmittedRasterSources: false});
    expect(await reused).toEqual(await newRendering);
    expect(mocks.FabricCanvas).toHaveBeenCalledTimes(2);
  });
});
