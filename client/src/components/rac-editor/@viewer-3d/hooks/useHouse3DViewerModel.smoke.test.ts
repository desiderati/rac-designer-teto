import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {House3DProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import {useHouse3DViewerModel} from './useHouse3DViewerModel.ts';

const source = vi.hoisted(() => ({
  version: 0,
  port: {getProjection: vi.fn<() => House3DProjection | null>()},
}));

vi.mock('@/bootstrap/editor-bootstrap.ts', () => ({
  useEditorPorts: () => ({house3DProjectionPort: source.port}),
}));
vi.mock('@/components/rac-editor/lib/house-store.ts', () => ({
  useHouseStoreVersion: () => source.version,
}));

function projection(height = 1.5): House3DProjection {
  return {
    houseType: 'tipo6', hasHouseViews: false,
    pilotis: {piloti_0_0: {height, nivel: .4, isMaster: true}},
    sideMappings: {top: null, bottom: null, left: null, right: null},
    topView: null, elevationViews: [],
  };
}

describe('useHouse3DViewerModel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    source.version = 0;
    source.port.getProjection.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('relê os pilotis quando a revisão da casa muda com a mesma porta', () => {
    source.port.getProjection.mockReturnValue(projection());
    const {result, rerender} = renderHook(() => useHouse3DViewerModel());
    expect(result.current.pilotis.piloti_0_0.height).toBe(1.5);

    source.port.getProjection.mockReturnValue(projection(2));
    source.version += 1;
    rerender();

    expect(result.current.pilotis.piloti_0_0.height).toBe(2);
  });

  it('aguarda a projeção e encerra as tentativas assim que ela fica disponível', () => {
    source.port.getProjection.mockReturnValueOnce(null).mockReturnValue(projection());
    const {result} = renderHook(() => useHouse3DViewerModel({retryProjection: true}));
    expect(result.current.isProjectionLoading).toBe(true);

    act(() => vi.advanceTimersByTime(0));

    expect(result.current.isProjectionLoading).toBe(false);
    expect(result.current.pilotis.piloti_0_0.height).toBe(1.5);
    const reads = source.port.getProjection.mock.calls.length;
    act(() => vi.advanceTimersByTime(4000));
    expect(source.port.getProjection).toHaveBeenCalledTimes(reads);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancela as tentativas ao desmontar o visualizador', () => {
    source.port.getProjection.mockReturnValue(null);
    const {unmount} = renderHook(() => useHouse3DViewerModel({retryProjection: true}));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    act(() => vi.advanceTimersByTime(4000));
    expect(source.port.getProjection).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('não inicia tentativas quando o chamador não as solicita', () => {
    source.port.getProjection.mockReturnValue(null);
    const {result} = renderHook(() => useHouse3DViewerModel());
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.isProjectionLoading).toBe(false);
    expect(source.port.getProjection).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
