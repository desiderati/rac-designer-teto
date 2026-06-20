import {Canvas} from 'fabric';
import {describe, expect, it} from 'vitest';
import {createHouseGroupForView} from '@/components/rac-editor/@canvas/lib/house-view-groups.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  addContraventamentoBeam,
  addHorizontalContraventamentoBeam,
  getCanvasGroupObjects,
  syncContraventamentoElevationViews,
} from '@/components/rac-editor/@canvas/lib';
import {DEFAULT_HOUSE_PILOTI, type HousePiloti, type HouseSide, type HouseViewType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

function createCanvas(): Canvas {
  const element = document.createElement('canvas');
  return new Canvas(element, {width: 1200, height: 900});
}

function createPilotis(): Record<string, HousePiloti> {
  return Object.fromEntries(
    getAllPilotiIds().map((pilotiId) => [
      pilotiId,
      {
        ...DEFAULT_HOUSE_PILOTI,
        height: 3,
        nivel: 1.5,
      },
    ]),
  );
}

function createView(params: {
  canvas: Canvas;
  pilotis: Record<string, HousePiloti>;
  side?: HouseSide;
  viewType: HouseViewType;
}) {
  const group = createHouseGroupForView({
    canvas: params.canvas,
    viewType: params.viewType,
    side: params.side,
  });
  group.houseViewType = params.viewType;
  group.houseSide = params.side;
  applyPilotiDataToGroup(group, params.pilotis);
  params.canvas.add(group);
  return group;
}

function getProjectionSignature(group: ReturnType<typeof createView>) {
  return getCanvasGroupObjects(group)
    .filter((object) => object.isContraventamentoElevation)
    .map((object) => ({
      x1: Number(object.x1),
      y1: Number(object.y1),
      x2: Number(object.x2),
      y2: Number(object.y2),
      strokeWidth: Number(object.strokeWidth),
      strokeUniform: object.strokeUniform,
    }));
}

describe('contraventamento na primeira elevação inserida', () => {
  it('mantém a mesma projeção quando a fachada de 6m inicial é removida e reinserida', () => {
    const canvas = createCanvas();
    try {
      const pilotis = createPilotis();
      const topGroup = createView({canvas, pilotis, viewType: 'top'});
      const initialFront = createView({canvas, pilotis, viewType: 'front', side: 'top'});

      addHorizontalContraventamentoBeam(
        topGroup,
        {col: 0, row: 0},
        {col: 3, row: 0},
        {side: 'bottom', anchorPilotiId: 'piloti_0_0'},
      );

      syncContraventamentoElevationViews(
        topGroup,
        [initialFront],
        (pilotiId) => pilotis[pilotiId]?.nivel ?? 0,
      );

      const initialSignature = getProjectionSignature(initialFront);
      canvas.remove(initialFront);

      const reinsertedFront = createView({canvas, pilotis, viewType: 'front', side: 'top'});
      syncContraventamentoElevationViews(
        topGroup,
        [reinsertedFront],
        (pilotiId) => pilotis[pilotiId]?.nivel ?? 0,
      );

      expect(initialSignature).toEqual(getProjectionSignature(reinsertedFront));
    } finally {
      canvas.dispose();
    }
  }, 20000);

  it('mantém a mesma projeção quando a vista de 3m inicial é removida e reinserida', () => {
    const canvas = createCanvas();
    try {
      const pilotis = createPilotis();
      const topGroup = createView({canvas, pilotis, viewType: 'top'});
      const initialSide = createView({canvas, pilotis, viewType: 'side2', side: 'left'});

      addContraventamentoBeam(
        topGroup,
        {col: 0, row: 0},
        {col: 0, row: 2},
        {side: 'left', anchorPilotiId: 'piloti_0_0'},
      );

      syncContraventamentoElevationViews(
        topGroup,
        [initialSide],
        (pilotiId) => pilotis[pilotiId]?.nivel ?? 0,
      );

      const initialSignature = getProjectionSignature(initialSide);
      canvas.remove(initialSide);

      const reinsertedSide = createView({canvas, pilotis, viewType: 'side2', side: 'left'});
      syncContraventamentoElevationViews(
        topGroup,
        [reinsertedSide],
        (pilotiId) => pilotis[pilotiId]?.nivel ?? 0,
      );

      expect(initialSignature).toEqual(getProjectionSignature(reinsertedSide));
    } finally {
      canvas.dispose();
    }
  }, 20000);
});
