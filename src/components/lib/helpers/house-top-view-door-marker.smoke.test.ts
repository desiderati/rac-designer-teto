import {describe, expect, it, vi} from 'vitest';
import {
  calculateRenderedDoorGeometryForTopMarker,
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  createTopDoorMarkerVisualPatch,
  refreshTopDoorMarkersInViews,
  resolveTopDoorMarkerSide,
  resolveTopDoorSourceViewType,
} from './house-top-view-door-marker.ts';

describe('house-top-door-marker use cases', () => {
  it('resolves source view type from house type', () => {
    expect(resolveTopDoorSourceViewType({houseType: 'tipo6'})).toBe('front');
    expect(resolveTopDoorSourceViewType({houseType: 'tipo3'})).toBe('side2');
    expect(resolveTopDoorSourceViewType({houseType: null})).toBeNull();
  });

  it('resolves marker side using current side assignments', () => {
    expect(
      resolveTopDoorMarkerSide({
        houseType: 'tipo6',
        sideMappings: {top: 'front', bottom: null, left: null, right: null},
      }),
    ).toBe('top');

    expect(
      resolveTopDoorMarkerSide({
        houseType: 'tipo3',
        sideMappings: {top: null, bottom: null, left: null, right: 'side2'},
      }),
    ).toBe('right');
  });

  it('calculates marker coordinates for all sides and clamps door center', () => {
    expect(
      calculateTopDoorPlacement({
        doorMarkerSide: 'top',
        doorX: 30,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({doorMarkerSide: 'top', targetLeft: 60, targetTop: -50});

    expect(
      calculateTopDoorPlacement({
        doorMarkerSide: 'bottom',
        doorX: 30,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({doorMarkerSide: 'bottom', targetLeft: -60, targetTop: 50});

    expect(
      calculateTopDoorPlacement({
        doorMarkerSide: 'left',
        doorX: -999,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({doorMarkerSide: 'left', targetLeft: -100, targetTop: -50});

    expect(
      calculateTopDoorPlacement({
        doorMarkerSide: 'right',
        doorX: 999,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({doorMarkerSide: 'right', targetLeft: 100, targetTop: -50});
  });

  it('returns null placement when marker side is unknown', () => {
    expect(
      calculateTopDoorPlacement({
        doorMarkerSide: null,
        doorX: 10,
        doorWidth: 10,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({doorMarkerSide: null});
  });

  it('calculates rendered door geometry for front/back and side axes', () => {
    expect(
      calculateRenderedDoorGeometryForTopMarker({
        doorMarkerSide: 'top',
        bodyWidth: 305,
        bodyHeight: 150,
      }),
    ).toEqual({
      doorX: 195,
      doorWidth: 40,
    });

    expect(
      calculateRenderedDoorGeometryForTopMarker({
        doorMarkerSide: 'left',
        bodyWidth: 305,
        bodyHeight: 150,
      }),
    ).toEqual({
      doorX: 87.5,
      doorWidth: 40,
    });
  });

  it('creates visual patch for active and inactive marker sides', () => {
    expect(
      createTopDoorMarkerVisualPatch({
        doorMarkerSide: 'top',
        markerCandidateSide: 'top',
        targetLeft: 10,
        targetTop: 20,
      }),
    ).toEqual({
      visible: true,
      left: 10,
      top: 20,
    });

    expect(
      createTopDoorMarkerVisualPatch({
        doorMarkerSide: 'top',
        markerCandidateSide: 'bottom',
        targetLeft: 10,
        targetTop: 20,
      }),
    ).toEqual({
      visible: false,
    });
  });

  it('calculates effective body size using scale and clamps to minimum', () => {
    expect(
      calculateTopDoorMarkerBodySize({
        width: 366,
        height: 132,
        scaleX: 0.5,
        scaleY: 2,
      }),
    ).toEqual({
      bodyWidth: 183,
      bodyHeight: 264,
    });

    expect(
      calculateTopDoorMarkerBodySize({
        width: 0,
        height: 0,
      }),
    ).toEqual({
      bodyWidth: 1,
      bodyHeight: 1,
    });
  });

  it('refreshes top-door markers in top views using resolved side mapping', () => {
    const topMarker = {
      isTopDoorMarker: true,
      doorMarkerSide: 'top',
      set: vi.fn(function (patch) {
        Object.assign(this, patch);
      }),
      setCoords: vi.fn(),
      dirty: false,
    };
    const bottomMarker = {
      isTopDoorMarker: true,
      doorMarkerSide: 'bottom',
      set: vi.fn(function (patch) {
        Object.assign(this, patch);
      }),
      setCoords: vi.fn(),
      dirty: false,
    };
    const houseBody = {
      isHouseBody: true,
      width: 366,
      height: 132,
      scaleX: 1,
      scaleY: 1,
    };

    const group = {
      getObjects: () => [houseBody, topMarker, bottomMarker],
      setCoords: vi.fn(),
      dirty: false,
    };

    const changed = refreshTopDoorMarkersInViews({
      houseType: 'tipo6',
      sideMappings: {top: 'front', bottom: null, left: null, right: null},
      topViews: [{group, instanceId: 'top_1'} as any],
    });

    expect(changed).toBe(true);
    expect(topMarker.visible).toBe(true);
    expect(bottomMarker.visible).toBe(false);
    expect(group.setCoords).toHaveBeenCalledTimes(1);
  });
});
