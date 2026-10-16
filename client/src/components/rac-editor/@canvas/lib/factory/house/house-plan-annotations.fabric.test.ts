import {describe, expect, it} from 'vitest';
import {Group, Rect, type Canvas} from 'fabric';
import {createHouseTop} from './house-top.strategy.ts';
import {refreshHouseViewReferenceMarkersInViews} from './house-view-reference-marker.ts';
import {refreshTopDoorMarkersInViews} from '../../house-top-view-door-marker.ts';
import {getCanvasGroupObjects, toCanvasGroup} from '../../canvas.ts';
import type {HouseRuntimeViewInstance, HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasGroup} from '../../canvas.ts';

describe('anotações da planta após inserir elevações', () => {
  const cases = (['tipo3', 'tipo6'] as const).flatMap((houseType) =>
    (['top', 'bottom', 'left', 'right'] as const).map((side) => ({houseType, side})),
  );

  it.each(cases)('$houseType/$side mantém porta e seta ancoradas ao corpo em refreshes sucessivos', ({houseType, side}) => {
    const top = createHouseTop({width: 1000, height: 800} as Canvas);
    top.set({angle: 17, scaleX: 1.3, scaleY: 0.8});
    const body = getCanvasGroupObjects(top).find((object) => object.isHouseBody)!;
    const bodySceneCenter = body.getCenterPoint();
    const source = houseType === 'tipo6' ? 'front' : 'side2';
    const sideMappings: Record<HouseSide, HouseViewType | null> = {top: null, bottom: null, left: null, right: null, [side]: source};
    const topViews = [{instanceId: 'top_1', group: top}];
    const doorArgs = {houseType, sideMappings, topViews};
    refreshTopDoorMarkersInViews(doorArgs);
    const door = getCanvasGroupObjects(top).find((object) => object.doorMarkerSide === side)!;
    const horizontal = side === 'top' || side === 'bottom';
    const sideSign = side === 'top' || side === 'left' ? -1 : 1;
    const halfExtent = (horizontal ? body.height * body.scaleY : body.width * body.scaleX) / 2;
    const initialLongitudinal = horizontal ? door.left - body.left : door.top - body.top;
    const assertDoor = () => {
      const center = body.getRelativeCenterPoint();
      expect(horizontal ? door.top - center.y : door.left - center.x).toBeCloseTo(sideSign * halfExtent, 6);
      expect(horizontal ? door.left - center.x : door.top - center.y).toBeCloseTo(initialLongitudinal, 6);
    };
    assertDoor();
    const elevationViews: Record<Exclude<HouseViewType, 'top'>, HouseRuntimeViewInstance<CanvasGroup>[]> = {
      front: [], back: [], side1: [], side2: [],
    };
    for (let round = 0; round < 6; round++) {
      if (round < 2) elevationViews[source].push({
        instanceId: `${source}_${round + 2}`, side,
        group: toCanvasGroup(new Group([new Rect({width: 305, height: 120, originX: 'center', originY: 'center'})])),
      });
      refreshHouseViewReferenceMarkersInViews({houseType, sideMappings, topViews, elevationViews});
      assertDoor();
      refreshTopDoorMarkersInViews({...doorArgs, reposition: round % 2 === 0});
      assertDoor();
      const center = body.getRelativeCenterPoint();
      const markers = getCanvasGroupObjects(top).filter((object) => object.isHouseViewReferenceMarker);
      expect(markers).toHaveLength(elevationViews[source].length);
      for (const marker of markers) {
        expect(horizontal ? marker.left - center.x : marker.top - center.y).toBeCloseTo(0, 6);
        expect(horizontal ? marker.top - center.y : marker.left - center.x).toBeCloseTo(sideSign * (halfExtent + 10.5), 6);
      }
      expect(body.getCenterPoint().x).toBeCloseTo(bodySceneCenter.x, 6);
      expect(body.getCenterPoint().y).toBeCloseTo(bodySceneCenter.y, 6);
    }
    elevationViews[source] = [];
    refreshHouseViewReferenceMarkersInViews({houseType, sideMappings, topViews, elevationViews});
    refreshTopDoorMarkersInViews({...doorArgs, reposition: false});
    assertDoor();
    expect(getCanvasGroupObjects(top).filter((object) => object.isHouseViewReferenceMarker)).toHaveLength(0);
  });
});
