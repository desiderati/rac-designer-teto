import {describe, expect, it, vi} from 'vitest';
import {HOUSE_DRAWING_CANVAS_SCHEMA_VERSION} from '@/shared/types/house-drawing-document.ts';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';

describe('fabric-canvas-document-port.ts', () => {
  it('serializa o canvas como documento visual canônico', () => {
    const canvas = {
      toJSON: vi.fn(() => ({
        objects: [{
          type: 'group',
          myType: 'house',
          editorObjectId: 'house-top-1',
          houseInstanceId: 'view-top-1',
          left: 10,
          top: 20,
          objects: [{type: 'rect', myType: 'wallBody', width: 30, height: 40}],
        }],
      })),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    expect(port.exportCanvasDocument()).toEqual({
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{
        id: 'house-top-1',
        kind: 'house',
        shape: 'group',
        geometry: {left: 10, top: 20},
        style: undefined,
        text: undefined,
        metadata: {houseInstanceId: 'view-top-1'},
        children: [{
          id: 'wallBody-0-0',
          kind: 'wallBody',
          shape: 'rect',
          geometry: {width: 30, height: 40},
          style: undefined,
          text: undefined,
          metadata: undefined,
          children: undefined,
        }],
      }],
    });
  });

  it('carrega documento visual, atualiza grupos de casa e renderiza novamente', async () => {
    const houseGroup = {
      type: 'group',
      myType: 'house',
      objectCaching: true,
      getObjects: vi.fn(() => []),
      getCanvasObjects: vi.fn(() => []),
      setControlsVisibility: vi.fn(),
      setCoords: vi.fn(),
    };
    const canvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn().mockResolvedValue(undefined),
      getObjects: vi.fn(() => [houseGroup]),
      renderAll: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    await expect(port.loadCanvasDocument({
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [{
        id: 'house-top-1',
        kind: 'house',
        shape: 'group',
        metadata: {houseInstanceId: 'view-top-1'},
        children: [],
      }],
    })).resolves.toBe(true);

    expect(canvas.clear).toHaveBeenCalled();
    expect(canvas.loadFromJSON).toHaveBeenCalledWith({
      objects: [{
        type: 'group',
        houseInstanceId: 'view-top-1',
        myType: 'house',
        editorObjectId: 'house-top-1',
        objects: [],
      }],
    });
    expect(houseGroup.setControlsVisibility).toHaveBeenCalledWith({mt: false, mb: false, ml: false, mr: false});
    expect(canvas.renderAll).toHaveBeenCalled();
  });

  it('captura imagem descartando seleção ativa antes de exportar', () => {
    const canvas = {
      discardActiveObject: vi.fn(),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    expect(port.exportImageDataUrl()).toBe('data:image/png;base64,abc');
    expect(canvas.discardActiveObject).toHaveBeenCalled();
    expect(canvas.renderAll).toHaveBeenCalled();
  });
});
