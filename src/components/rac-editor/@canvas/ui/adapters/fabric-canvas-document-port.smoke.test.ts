import {describe, expect, it, vi} from 'vitest';
import {HOUSE_DRAWING_CANVAS_SCHEMA_VERSION} from '@/shared/types/house-drawing-document.ts';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';
import {
  HOUSE_2D_STYLE,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
  PILOTI_VISUAL_FEEDBACK_COLORS,
} from '@/shared/config.ts';

function createHouseGroup(children: any[] = []) {
  return {
    type: 'group',
    myType: 'house',
    objectCaching: true,
    getObjects: vi.fn(() => children),
    getCanvasObjects: vi.fn(() => children),
    setControlsVisibility: vi.fn(),
    setCoords: vi.fn(),
  };
}

function createCanvasObject(props: Record<string, unknown>) {
  return {
    dirty: false,
    set: vi.fn(function set(this: Record<string, unknown>, patch: Record<string, unknown>) {
      Object.assign(this, patch);
    }),
    ...props,
  };
}

describe('fabric-canvas-document-port.ts', () => {
  it('serializa o canvas como documento visual canônico', () => {
    const canvas = {
      toJSON: vi.fn(() => ({
        objects: [{
          type: 'Group',
          myType: 'house',
          editorObjectId: 'house-top-1',
          houseInstanceId: 'view-top-1',
          left: 10,
          top: 20,
          objects: [{type: 'Rect', myType: 'wallBody', width: 30, height: 40}],
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
        resource: undefined,
        children: [{
          id: 'wallBody-0-0',
          kind: 'wallBody',
          shape: 'rect',
          geometry: {width: 30, height: 40},
          style: undefined,
          text: undefined,
          metadata: undefined,
          resource: undefined,
          children: undefined,
        }],
      }],
    });
  });

  it('carrega documento visual, atualiza grupos de casa e renderiza novamente', async () => {
    const houseGroup = createHouseGroup();
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

  it('reidrata textos sem conteÃºdo como string vazia para o Fabric', async () => {
    const canvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn().mockResolvedValue(undefined),
      getObjects: vi.fn(() => []),
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
        children: [{
          id: 'empty-label-1',
          kind: 'pilotiNivelText',
          shape: 'itext',
        }],
      }],
    })).resolves.toBe(true);

    expect(canvas.loadFromJSON).toHaveBeenCalledWith({
      objects: [{
        type: 'group',
        myType: 'house',
        editorObjectId: 'house-top-1',
        objects: [{
          type: 'itext',
          text: '',
          myType: 'pilotiNivelText',
          editorObjectId: 'empty-label-1',
        }],
      }],
    });
  });

  it('preserva identidade e metadados no round trip documental do canvas', async () => {
    const sourceCanvas = {
      toJSON: vi.fn(() => ({
        objects: [{
          type: 'Group',
          myType: 'house',
          editorObjectId: 'house-front-1',
          houseInstanceId: 'view-front-1',
          houseViewType: 'front',
          houseSide: 'top',
          left: 100,
          top: 200,
          fill: '#ffffff',
          objects: [{
            type: 'Polygon',
            myType: 'wallShape',
            editorObjectId: 'wall-polygon-1',
            points: [
              {x: 0, y: 20},
              {x: 20, y: 0},
              {x: 40, y: 20},
            ],
            left: 10,
            top: 15,
            fill: '#222222',
          }],
        }],
      })),
    };
    const targetCanvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn().mockResolvedValue(undefined),
      getObjects: vi.fn(() => [createHouseGroup()]),
      renderAll: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const exported = createFabricCanvasDocumentPort(sourceCanvas as any).exportCanvasDocument();
    const loaded = await createFabricCanvasDocumentPort(targetCanvas as any).loadCanvasDocument(exported!);

    expect(loaded).toBe(true);
    expect(exported?.objects[0]).toMatchObject({
      id: 'house-front-1',
      kind: 'house',
      shape: 'group',
      geometry: {left: 100, top: 200},
      style: {fill: '#ffffff'},
      metadata: {
        houseInstanceId: 'view-front-1',
        houseViewType: 'front',
        houseSide: 'top',
      },
    });
    expect(exported?.objects[0].children?.[0]).toMatchObject({
      id: 'wall-polygon-1',
      kind: 'wallShape',
      shape: 'polygon',
      geometry: {
        left: 10,
        top: 15,
        points: [
          {x: 0, y: 20},
          {x: 20, y: 0},
          {x: 40, y: 20},
        ],
      },
    });
    expect(targetCanvas.loadFromJSON).toHaveBeenCalledWith({
      objects: [{
        type: 'group',
        left: 100,
        top: 200,
        fill: '#ffffff',
        houseInstanceId: 'view-front-1',
        houseViewType: 'front',
        houseSide: 'top',
        myType: 'house',
        editorObjectId: 'house-front-1',
        objects: [{
          type: 'polygon',
          points: [
            {x: 0, y: 20},
            {x: 20, y: 0},
            {x: 40, y: 20},
          ],
          left: 10,
          top: 15,
          fill: '#222222',
          myType: 'wallShape',
          editorObjectId: 'wall-polygon-1',
        }],
      }],
    });
  });

  it('preserva ordem de pintura de texto para rótulos com contorno', async () => {
    const sourceCanvas = {
      toJSON: vi.fn(() => ({
        objects: [{
          type: 'Group',
          myType: 'water',
          editorObjectId: 'water-1',
          objects: [{
            type: 'Text',
            myType: 'waterLabel',
            editorObjectId: 'water-label-1',
            text: 'Água',
            fill: '#0092dd',
            stroke: 'white',
            strokeWidth: 2,
            paintFirst: 'stroke',
          }],
        }],
      })),
    };
    const targetCanvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn().mockResolvedValue(undefined),
      getObjects: vi.fn(() => []),
      renderAll: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const exported = createFabricCanvasDocumentPort(sourceCanvas as any).exportCanvasDocument();
    const loaded = await createFabricCanvasDocumentPort(targetCanvas as any).loadCanvasDocument(exported!);

    expect(loaded).toBe(true);
    expect(exported?.objects[0].children?.[0]).toMatchObject({
      kind: 'waterLabel',
      style: {
        fill: '#0092dd',
        stroke: 'white',
        strokeWidth: 2,
        paintFirst: 'stroke',
      },
    });
    expect(targetCanvas.loadFromJSON).toHaveBeenCalledWith({
      objects: [{
        type: 'group',
        myType: 'water',
        editorObjectId: 'water-1',
        objects: [{
          type: 'text',
          fill: '#0092dd',
          stroke: 'white',
          strokeWidth: 2,
          paintFirst: 'stroke',
          myType: 'waterLabel',
          editorObjectId: 'water-label-1',
          text: 'Água',
        }],
      }],
    });
  });

  it('recusa documento visual com payload opaco antes de tocar o canvas', async () => {
    const canvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn(),
      getObjects: vi.fn(() => []),
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
        payload: {type: 'group'},
      }],
    } as any)).resolves.toBe(false);

    expect(canvas.clear).not.toHaveBeenCalled();
    expect(canvas.loadFromJSON).not.toHaveBeenCalled();
  });

  it('preserva recurso de imagem usado por snapshot 3D', async () => {
    const sourceCanvas = {
      toJSON: vi.fn(() => ({
        objects: [{
          type: 'Image',
          myType: 'snapshot3d',
          editorObjectId: 'snapshot-1',
          src: 'data:image/png;base64,abc',
          crossOrigin: 'anonymous',
          left: 200,
          top: 120,
          width: 640,
          height: 480,
          scaleX: 0.5,
          scaleY: 0.5,
        }],
      })),
    };
    const targetCanvas = {
      clear: vi.fn(),
      loadFromJSON: vi.fn().mockResolvedValue(undefined),
      getObjects: vi.fn(() => []),
      renderAll: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const exported = createFabricCanvasDocumentPort(sourceCanvas as any).exportCanvasDocument();
    const loaded = await createFabricCanvasDocumentPort(targetCanvas as any).loadCanvasDocument(exported!);

    expect(loaded).toBe(true);
    expect(exported?.objects[0]).toMatchObject({
      id: 'snapshot-1',
      kind: 'snapshot3d',
      shape: 'image',
      resource: {
        src: 'data:image/png;base64,abc',
        crossOrigin: 'anonymous',
      },
    });
    expect(targetCanvas.loadFromJSON).toHaveBeenCalledWith({
      objects: [{
        type: 'image',
        left: 200,
        top: 120,
        width: 640,
        height: 480,
        scaleX: 0.5,
        scaleY: 0.5,
        src: 'data:image/png;base64,abc',
        crossOrigin: 'anonymous',
        myType: 'snapshot3d',
        editorObjectId: 'snapshot-1',
      }],
    });
  });

  it('captura imagem descartando seleção ativa antes de exportar', () => {
    const canvas = {
      getObjects: vi.fn(() => []),
      getActiveObject: vi.fn(() => null),
      discardActiveObject: vi.fn(),
      setActiveObject: vi.fn(),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    expect(port.exportImageDataUrl()).toBe('data:image/png;base64,abc');
    expect(canvas.discardActiveObject).toHaveBeenCalled();
    expect(canvas.renderAll).toHaveBeenCalled();
    expect(canvas.setActiveObject).not.toHaveBeenCalled();
  });

  it('captura imagem de exportação com seleção visual neutralizada e restaura o estado do editor', () => {
    const pilotiCircle = createCanvasObject({
      isPilotiCircle: true,
      pilotiIsMaster: false,
      fill: PILOTI_STYLE.fillColor,
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
      strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView,
      strokeUniform: false,
      hoverCursor: 'pointer',
    });
    const masterPilotiRect = createCanvasObject({
      isPilotiRect: true,
      pilotiIsMaster: true,
      fill: PILOTI_MASTER_STYLE.fillColor,
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
      strokeWidth: PILOTI_STYLE.selectedStrokeWidth,
      strokeUniform: true,
      hoverCursor: 'pointer',
    });
    const sideEdge = createCanvasObject({
      isHouseBorderEdge: true,
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
      strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView,
      hoverCursor: 'pointer',
    });
    const houseGroup = createHouseGroup([pilotiCircle, masterPilotiRect, sideEdge]);
    const activeObject = houseGroup;
    const canvas = {
      getObjects: vi.fn(() => [houseGroup]),
      getActiveObject: vi.fn(() => activeObject),
      discardActiveObject: vi.fn(),
      setActiveObject: vi.fn(),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => {
        expect(pilotiCircle.stroke).toBe(PILOTI_STYLE.strokeColor);
        expect(pilotiCircle.strokeWidth).toBe(PILOTI_STYLE.strokeWidthTopView);
        expect(pilotiCircle.strokeUniform).toBe(true);
        expect(masterPilotiRect.stroke).toBe(PILOTI_MASTER_STYLE.strokeColor);
        expect(masterPilotiRect.strokeWidth).toBe(PILOTI_MASTER_STYLE.strokeWidth);
        expect(sideEdge.stroke).toBe(HOUSE_2D_STYLE.outlineStrokeColor);
        expect(sideEdge.strokeWidth).toBe(HOUSE_2D_STYLE.outlineStrokeWidth);
        return 'data:image/png;base64,clean';
      }),
    };

    const port = createFabricCanvasDocumentPort(canvas as any);

    expect(port.exportImageDataUrl()).toBe('data:image/png;base64,clean');
    expect(canvas.discardActiveObject).toHaveBeenCalledTimes(1);
    expect(canvas.setActiveObject).toHaveBeenCalledWith(activeObject);
    expect(pilotiCircle.stroke).toBe(PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor);
    expect(pilotiCircle.strokeWidth).toBe(PILOTI_STYLE.selectedStrokeWidthTopView);
    expect(pilotiCircle.strokeUniform).toBe(false);
    expect(masterPilotiRect.stroke).toBe(PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor);
    expect(masterPilotiRect.strokeWidth).toBe(PILOTI_STYLE.selectedStrokeWidth);
    expect(sideEdge.stroke).toBe(PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor);
    expect(sideEdge.strokeWidth).toBe(PILOTI_STYLE.selectedStrokeWidthTopView);
  });
});
