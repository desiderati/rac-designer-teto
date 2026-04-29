import {describe, expect, it, vi} from 'vitest';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';

describe('fabric-canvas-document-port.ts', () => {
  it('serializa o projeto sem expor o runtime Fabric ao consumidor', () => {
    const canvas = {
      toJSON: vi.fn(() => ({objects: [{myType: 'house'}]})),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    expect(port.exportProjectJson()).toBe('{"objects":[{"myType":"house"}]}');
  });

  it('carrega JSON, atualiza grupos de casa e renderiza novamente', async () => {
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

    await expect(port.loadProjectJson('{"objects":[]}')).resolves.toBe(true);
    expect(canvas.clear).toHaveBeenCalled();
    expect(canvas.loadFromJSON).toHaveBeenCalledWith('{"objects":[]}');
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
