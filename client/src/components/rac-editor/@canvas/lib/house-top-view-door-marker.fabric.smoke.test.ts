import {describe, expect, it} from 'vitest';
import {Group, Rect} from 'fabric';
import {toCanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {refreshTopDoorMarkersInViews} from './house-top-view-door-marker.ts';

function createMarker(side: 'top' | 'bottom' | 'left' | 'right') {
  const marker = new Rect({
    width: side === 'top' || side === 'bottom' ? 41.5 : 11.5,
    height: side === 'top' || side === 'bottom' ? 11.5 : 41.5,
    originX: 'center',
    originY: 'center',
    visible: false,
  }) as any;
  marker.isTopDoorMarker = true;
  marker.doorMarkerSide = side;
  return marker;
}

function createTopGroup() {
  const body = new Rect({width: 305, height: 150, originX: 'center', originY: 'center'}) as any;
  body.isHouseBody = true;
  const group = new Group([body, createMarker('top'), createMarker('bottom'), createMarker('left'), createMarker('right')], {
    originX: 'center',
    originY: 'center',
  });
  return {group: toCanvasGroup(group), body};
}

describe('house-top-view-door-marker Fabric geometry', () => {
  const cases = (['tipo3', 'tipo6'] as const).flatMap((houseType) =>
    (['top', 'bottom', 'left', 'right'] as const).map((side) => ({houseType, side})),
  );

  it.each(cases)('$houseType/$side centraliza na borda mantendo a posição longitudinal', ({houseType, side}) => {
    const {group} = createTopGroup();
    const marker = group.getObjects().find((object: any) => object.doorMarkerSide === side) as any;
    const horizontal = side === 'top' || side === 'bottom';
    const border = side === 'top' ? -75 : side === 'bottom' ? 75 : side === 'left' ? -152.5 : 152.5;
    const inward = side === 'top' || side === 'left' ? 5.75 : -5.75;
    marker.set(horizontal ? {left: 19, top: border + inward} : {left: border + inward, top: 19});
    const params = {
      houseType,
      sideMappings: {top: null, bottom: null, left: null, right: null, [side]: houseType === 'tipo6' ? 'front' as const : 'side2' as const},
      topViews: [{instanceId: 'top', group}],
    };
    refreshTopDoorMarkersInViews({...params, reposition: false});
    expect(horizontal ? marker.top : marker.left).toBeCloseTo(border, 5);
    expect(horizontal ? marker.left : marker.top).toBe(19);
    // O marcador cruza a linha: metade dentro, metade fora.
    const center = marker.getRelativeCenterPoint();
    expect(horizontal ? center.y : center.x).toBeCloseTo(border, 5);

    refreshTopDoorMarkersInViews({...params, reposition: true});
    expect(horizontal ? marker.top : marker.left).toBeCloseTo(border, 5);
    const longitudinal = side === 'top' ? -62.5 : side === 'bottom' ? 62.5 : side === 'left' ? 32.5 : -32.5;
    expect(horizontal ? marker.left : marker.top).toBeCloseTo(longitudinal, 5);
    refreshTopDoorMarkersInViews({...params, reposition: false});
    expect(horizontal ? marker.left : marker.top).toBeCloseTo(longitudinal, 5);
  });
});
