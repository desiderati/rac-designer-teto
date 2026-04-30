import {describe, expect, it, vi} from 'vitest';
import {FabricImage} from 'fabric';
import {createFabricCanvasSnapshotPort} from './fabric-canvas-snapshot-port.ts';

type MockObject = {
  [key: string]: unknown;
  set?: (patch: Record<string, unknown>) => void;
  setControlsVisibility?: ReturnType<typeof vi.fn>;
};

function createMockObject(props: Record<string, unknown> = {}): MockObject {
  return {
    ...props,
    set(patch: Record<string, unknown>) {
      Object.assign(this, patch);
    },
  };
}

describe('createFabricCanvasSnapshotPort', () => {
  it('insere snapshot 3D no canvas com posição centralizada e escala limitada', async () => {
    const image = createMockObject({
      width: 2000,
      height: 1000,
      setControlsVisibility: vi.fn(),
    });
    const setSpy = vi.spyOn(image as any, 'set');
    const fromUrlSpy = vi.spyOn(FabricImage, 'fromURL').mockResolvedValue(image as any);

    const canvas = {
      getVpCenter: vi.fn(() => ({x: 100, y: 120})),
      getWidth: vi.fn(() => 1000),
      getHeight: vi.fn(() => 800),
      add: vi.fn(),
      setActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const inserted =
      await createFabricCanvasSnapshotPort(canvas as never).insertImageSnapshot('data:image/png;base64,abc');

    expect(inserted).toBe(true);
    expect(fromUrlSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        left: 100,
        top: 120,
        scaleX: 0.225,
        scaleY: 0.225,
        lockRotation: true,
      }),
    );
    expect((image as any).left).toBe(100);
    expect((image as any).top).toBe(120);
    expect((image as any).scaleX).toBe(0.225);
    expect((image as any).scaleY).toBe(0.225);
    expect((image as any).setControlsVisibility).toHaveBeenCalledWith({mtr: false});
    expect(canvas.add).toHaveBeenCalledWith(image);
    expect(canvas.setActiveObject).toHaveBeenCalledWith(image);
    expect(canvas.requestRenderAll).toHaveBeenCalled();

    fromUrlSpy.mockRestore();
  });

  it('retorna false quando o carregamento do snapshot 3D falha', async () => {
    const fromUrlSpy = vi.spyOn(FabricImage, 'fromURL').mockRejectedValue(new Error('load failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    });
    const canvas = {
      getVpCenter: vi.fn(() => ({x: 0, y: 0})),
      getWidth: vi.fn(() => 1000),
      getHeight: vi.fn(() => 1000),
      add: vi.fn(),
      setActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const inserted =
      await createFabricCanvasSnapshotPort(canvas as never).insertImageSnapshot('data:image/png;base64,abc');

    expect(inserted).toBe(false);
    expect(canvas.add).not.toHaveBeenCalled();
    expect(canvas.setActiveObject).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    fromUrlSpy.mockRestore();
  });
});
