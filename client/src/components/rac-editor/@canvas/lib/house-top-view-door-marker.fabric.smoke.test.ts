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
  it('encaixa a porta Tipo 6 dentro da borda inferior', () => {
    const {group} = createTopGroup();
    const changed = refreshTopDoorMarkersInViews({
      houseType: 'tipo6',
      sideMappings: {top: null, bottom: 'front', left: null, right: null},
      topViews: [{instanceId: 'top_tipo6', group}],
      reposition: true,
    });
    const marker = group.getObjects().find((object: any) => object.doorMarkerSide === 'bottom') as any;
    expect(changed).toBe(true);
    expect(marker.top).toBeCloseTo(69.25, 5);
    expect(marker.left).toBeCloseTo(62.5, 5);
    expect(marker.top + marker.height / 2).toBeCloseTo(75, 5);
  });

  it('encaixa a porta Tipo 3 dentro da borda lateral direita', () => {
    const {group} = createTopGroup();
    refreshTopDoorMarkersInViews({
      houseType: 'tipo3',
      sideMappings: {top: null, bottom: null, left: null, right: 'side2'},
      topViews: [{instanceId: 'top_tipo3', group}],
      reposition: true,
    });
    const marker = group.getObjects().find((object: any) => object.doorMarkerSide === 'right') as any;
    expect(marker.left).toBeCloseTo(146.75, 5);
    expect(marker.top).toBeCloseTo(-32.5, 5);
    expect(marker.left + marker.width / 2).toBeCloseTo(152.5, 5);
  });
});
