import {describe, expect, it, vi} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {createFabricCanvasCommandPort} from './fabric-canvas-command-port.ts';
import type {CanvasObject} from '@/components/rac-editor/@canvas/lib';

function createPort(canvas: unknown, options?: {
  getVisibleCenter?: () => { x: number; y: number };
  getCanvasPointScreenPosition?: (point: { x: number; y: number }) => { x: number; y: number } | null;
  clearHistory?: () => void;
  saveHistory?: () => void;
}) {
  return createFabricCanvasCommandPort({
    canvas: canvas as FabricCanvas,
    getVisibleCenter: options?.getVisibleCenter ?? (() => ({x: 10, y: 20})),
    getCanvasPointScreenPosition: options?.getCanvasPointScreenPosition,
    clearHistory: options?.clearHistory ?? vi.fn(),
    saveHistory: options?.saveHistory ?? vi.fn(),
  });
}

describe('createFabricCanvasCommandPort', () => {
  it('adds objects at the visible center without leaking Fabric to callers', () => {
    const object = {
      set: vi.fn(),
    } as unknown as CanvasObject;
    const canvas = {
      add: vi.fn(),
      setActiveObject: vi.fn(),
    };

    const added = createPort(canvas).addObjectAtVisibleCenter(object);

    expect(added).toBe(true);
    expect(object.set).toHaveBeenCalledWith({left: 10, top: 20});
    expect(canvas.add).toHaveBeenCalledWith(object);
    expect(canvas.setActiveObject).toHaveBeenCalledWith(object);
  });

  it('resets the Fabric surface and records history hooks', () => {
    const clearHistory = vi.fn();
    const saveHistory = vi.fn();
    const canvas = {
      clear: vi.fn(),
      renderAll: vi.fn(),
      backgroundColor: '',
    };

    createPort(canvas, {clearHistory, saveHistory}).resetSurface();

    expect(canvas.clear).toHaveBeenCalledOnce();
    expect(canvas.renderAll).toHaveBeenCalledOnce();
    expect(clearHistory).toHaveBeenCalledOnce();
    expect(saveHistory).toHaveBeenCalledOnce();
    expect(canvas.backgroundColor).toBeTruthy();
  });

  it('blocks top-view deletion when the caller rejects it', () => {
    const group = {
      type: 'group',
      myType: 'house',
      houseViewType: 'top',
      getObjects: () => [],
      set: vi.fn(),
    };
    const canvas = {
      getActiveObjects: () => [group],
      discardActiveObject: vi.fn(),
      setActiveObject: vi.fn(),
      remove: vi.fn(),
    };
    const onBlockedTopViewDelete = vi.fn();

    const result = createPort(canvas).deleteActiveObjects({
      canDeleteTopView: () => false,
      onBlockedTopViewDelete,
    });

    expect(result).toBe('blocked');
    expect(onBlockedTopViewDelete).toHaveBeenCalledOnce();
    expect(canvas.setActiveObject).toHaveBeenCalledWith(group);
    expect(canvas.remove).not.toHaveBeenCalled();
  });

  it('removes active house views through a handler boundary', () => {
    const group = {
      type: 'group',
      myType: 'house',
      houseViewType: 'front',
      houseInstanceId: 'front_1',
      getObjects: () => [],
      set: vi.fn(),
    };
    const canvas = {
      getActiveObjects: () => [group],
      discardActiveObject: vi.fn(),
      remove: vi.fn(),
    };
    const onHouseViewRemoved = vi.fn();

    const result = createPort(canvas).deleteActiveObjects({onHouseViewRemoved});

    expect(result).toBe('deleted');
    expect(onHouseViewRemoved).toHaveBeenCalledWith('front_1');
    expect(canvas.remove).toHaveBeenCalledWith(group);
  });

  it('renders and records history after deleting active objects', () => {
    const object = {
      type: 'rect',
      myType: 'wall',
      set: vi.fn(),
    };
    const canvas = {
      getActiveObjects: () => [object],
      discardActiveObject: vi.fn(),
      remove: vi.fn(),
      requestRenderAll: vi.fn(),
    };
    const saveHistory = vi.fn();

    const result = createPort(canvas, {saveHistory}).deleteActiveObjects();

    expect(result).toBe('deleted');
    expect(canvas.remove).toHaveBeenCalledWith(object);
    expect(canvas.requestRenderAll).toHaveBeenCalledOnce();
    expect(saveHistory).toHaveBeenCalledOnce();
  });

  it('constructionSites the requested piloti screen position from the matching house view', () => {
    const frontGroup = {
      type: 'group',
      myType: 'house',
      houseView: 'front',
      calcTransformMatrix: () => [1, 0, 0, 1, 30, 40],
      getObjects: () => [
        {
          pilotiId: 'piloti_3_2',
          isPilotiRect: true,
          left: 10,
          top: 20,
          width: 8,
          height: 12,
          set: vi.fn(),
        },
      ],
    };
    const topGroup = {
      type: 'group',
      myType: 'house',
      houseView: 'top',
      calcTransformMatrix: () => [1, 0, 0, 1, 0, 0],
      getObjects: () => [
        {
          pilotiId: 'piloti_3_2',
          isPilotiCircle: true,
          left: 1,
          top: 2,
          set: vi.fn(),
        },
      ],
    };
    const canvas = {
      getObjects: () => [topGroup, frontGroup],
      getElement: () => ({
        parentElement: {
          getBoundingClientRect: () => ({left: 100, top: 50}),
        },
      }),
      viewportTransform: [2, 0, 0, 2, 10, 20],
    };

    const position = createPort(canvas).getPilotiScreenPosition('piloti_3_2', 'front');

    expect(position).toEqual({x: 198, y: 202});
  });

  it('uses the editor viewport projection for group-local piloti positions when available', () => {
    const group = {
      type: 'group',
      myType: 'house',
      houseView: 'top',
      calcTransformMatrix: () => [1, 0, 0, 1, 120, 80],
      getObjects: () => [
        {
          pilotiId: 'piloti_0_0',
          isPilotiCircle: true,
          left: -60,
          top: -30,
          set: vi.fn(),
        },
      ],
    };
    const canvas = {
      getObjects: () => [group],
      getElement: () => ({
        parentElement: {
          getBoundingClientRect: () => ({left: 1000, top: 1000}),
        },
      }),
      viewportTransform: [4, 0, 0, 4, 2000, 2000],
    };
    const getCanvasPointScreenPosition = vi.fn((point: { x: number; y: number }) => ({
      x: point.x * 0.5 + 10,
      y: point.y * 0.5 + 20,
    }));

    const position = createPort(canvas, {getCanvasPointScreenPosition})
      .getPilotiScreenPosition('piloti_0_0', 'top');

    expect(getCanvasPointScreenPosition).toHaveBeenCalledWith({x: 60, y: 50});
    expect(position).toEqual({x: 40, y: 45});
  });
});
