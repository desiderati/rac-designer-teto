import {describe, expect, it} from 'vitest';
import {Group, Rect, type Canvas} from 'fabric';
import {createHouseTop} from './factory/house/house-top.strategy.ts';
import {refreshHouseViewReferenceMarkersInViews} from './factory/house/house-view-reference-marker.ts';
import {refreshTopDoorMarkersInViews} from './house-top-view-door-marker.ts';
import {addContraventamentoBeam, addHorizontalContraventamentoBeam, removeContraventamentosFromTopView} from './contraventamento.ts';
import {getCanvasGroupObjects, toCanvasGroup} from './canvas.ts';
import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

const radius = HOUSE_DIMENSIONS.piloti.radius * HOUSE_DEFAULTS.viewScale;
const beamWidth = HOUSE_DIMENSIONS.contraventamento.topWidth;

describe('contraventamento em planta existente com layout Fabric', () => {
  it.each(['tipo3', 'tipo6'] as const)('%s mantém vigas tangentes aos pilotis após anotações e reinserção', (houseType) => {
    const top = createHouseTop({width: 1400, height: 1000} as Canvas);
    top.set({left: 710, top: 430, angle: 17, scaleX: 1.3, scaleY: 0.8});
    const topViews = [{instanceId: 'top_1', group: top}];
    const sideMappings = {top: 'front' as const, left: 'side1' as const, bottom: null, right: null};
    const elevation = () => toCanvasGroup(new Group([new Rect({width: 305, height: 120})]));
    refreshTopDoorMarkersInViews({houseType, sideMappings, topViews});
    refreshHouseViewReferenceMarkersInViews({houseType, sideMappings, topViews, elevationViews: {
      front: [{instanceId: 'front_2', group: elevation(), side: 'top'}], back: [],
      side1: [{instanceId: 'side1_3', group: elevation(), side: 'left'}], side2: [],
    }});
    const objects = () => getCanvasGroupObjects(top);
    const circle = (col: number, row: number) => objects().find(o => o.isPilotiCircle && o.pilotiId === `piloti_${col}_${row}`)!;
    const body = objects().find(o => o.isHouseBody)!;
    const sceneCenter = body.getCenterPoint();
    expect(Math.abs(body.getRelativeCenterPoint().x) + Math.abs(body.getRelativeCenterPoint().y)).toBeGreaterThan(1);
    for (let round = 0; round < 3; round++) {
      for (const col of [0, 3]) for (const side of ['left', 'right'] as const) {
        const start = circle(col, 0).getRelativeCenterPoint(), end = circle(col, 2).getRelativeCenterPoint();
        const id = addContraventamentoBeam(top, {col, row: 0}, {col, row: 2}, {side});
        const beam = objects().find(o => o.contraventamentoId === id)!;
        expect(beam.left).toBeCloseTo(start.x + (side === 'right' ? radius : -radius - beamWidth), 6);
        expect(beam.top).toBeCloseTo(start.y, 6);
        expect(beam.height).toBeCloseTo(end.y - start.y, 6);
      }
      for (const row of [0, 2]) for (const side of ['top', 'bottom'] as const) {
        const start = circle(0, row).getRelativeCenterPoint(), end = circle(3, row).getRelativeCenterPoint();
        const id = addHorizontalContraventamentoBeam(top, {col: 0, row}, {col: 3, row}, {side});
        const beam = objects().find(o => o.contraventamentoId === id)!;
        expect(beam.left).toBeCloseTo(start.x, 6);
        expect(beam.top).toBeCloseTo(start.y + (side === 'bottom' ? radius : -radius - beamWidth), 6);
        expect(beam.width).toBeCloseTo(end.x - start.x, 6);
      }
      expect(body.getCenterPoint().x).toBeCloseTo(sceneCenter.x, 6);
      expect(body.getCenterPoint().y).toBeCloseTo(sceneCenter.y, 6);
      expect(removeContraventamentosFromTopView(top)).toBe(8);
    }
  });
});
