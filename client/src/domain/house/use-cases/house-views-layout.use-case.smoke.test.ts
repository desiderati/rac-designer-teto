import {describe, expect, it} from 'vitest';
import {
  buildAutoAssignedSides,
  calculateStackedViewPositions,
  canDeleteTopView,
  getAutoSelectedSide,
  getAvailableSides,
  getAvailableViewsForType,
  getPreAssignedSides,
  hasOtherViews,
  hasPreAssignedSides,
  type HouseSideMapping,
  type HouseViewSide,
  needsSideSelection,
  resolveHouseViewInsertion,
} from './house-views-layout.use-case.ts';
import {HOUSE_VIEW_INSERTION_DECISION_TYPES} from '@/shared/types/house.ts';

function createViews(): HouseViewSide {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

function createAssignments(): HouseSideMapping {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}

describe('house-views-layout.use-case.ts', () => {
  it('returns available views based on house type limits', () => {
    const views = createViews();
    views.top.push({side: undefined});
    views.side1.push({side: 'left'});

    expect(
      getAvailableViewsForType({
        houseType: 'tipo6',
        views,
      }),
    ).toEqual(['front', 'back', 'side1']);
  });

  it('detects when plant can or cannot be deleted', () => {
    const views = createViews();

    expect(hasOtherViews(views)).toBe(false);
    expect(canDeleteTopView(views)).toBe(true);

    views.back.push({side: 'top'});
    expect(hasOtherViews(views)).toBe(true);
    expect(canDeleteTopView(views)).toBe(false);
  });

  it('returns available sides and side selection requirement', () => {
    const assignments = createAssignments();
    assignments.top = 'front';

    expect(getAvailableSides({viewType: 'back', sideMappings: assignments})).toEqual(['bottom']);
    expect(needsSideSelection({viewType: 'back', sideMappings: assignments})).toBe(true);
    expect(needsSideSelection({viewType: 'top', sideMappings: assignments})).toBe(false);
  });

  it('auto-selects opposite side when opposite view exists', () => {
    const views = createViews();
    const assignments = createAssignments();
    views.front.push({side: 'top'});

    expect(
      getAutoSelectedSide({
        viewType: 'back',
        views,
        sideMappings: assignments,
      }),
    ).toBe('bottom');
  });

  it('builds expected pre-assigned slots per house type', () => {
    expect(buildAutoAssignedSides({houseType: 'tipo6', initialSide: 'top'})).toEqual({
      front: 'top',
      back: 'bottom',
      side1_0: 'right',
      side1_1: 'left',
    });

    expect(buildAutoAssignedSides({houseType: 'tipo3', initialSide: 'left'})).toEqual({
      side2: 'left',
      side1: 'right',
      back_0: 'top',
      back_1: 'bottom',
    });
  });

  it('returns pre-assigned slot labels sorted and with onCanvas marker', () => {
    const slots = {
      side1_0: 'right',
      side1_1: 'left',
      front: 'top',
    } as const;
    const assignments = createAssignments();
    assignments.right = 'side1';

    expect(
      getPreAssignedSides({
        viewType: 'side1',
        preAssignedSides: {...slots},
        sideMappings: assignments,
      }),
    ).toEqual([
      {label: 'Esquerdo', side: 'left', onCanvas: false},
      {label: 'Direito', side: 'right', onCanvas: true},
    ]);
  });

  it('checks if there are any pre-assigned slots', () => {
    expect(hasPreAssignedSides({})).toBe(false);
    expect(hasPreAssignedSides({front: 'top'})).toBe(true);
  });

  it('resolves insertion decisions without React or canvas runtime', () => {
    expect(
      resolveHouseViewInsertion({
        viewType: 'front',
        isAtLimit: true,
        preAssignedSides: [],
        availableSides: ['top'],
      }),
    ).toEqual({type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByViewLimit});

    expect(
      resolveHouseViewInsertion({
        viewType: 'front',
        isAtLimit: false,
        preAssignedSides: [
          {label: 'Superior', side: 'top', onCanvas: true},
          {label: 'Inferior', side: 'bottom', onCanvas: false},
        ],
        availableSides: [],
      }),
    ).toEqual({type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly, side: 'bottom'});

    expect(
      resolveHouseViewInsertion({
        viewType: 'side1',
        isAtLimit: false,
        preAssignedSides: [],
        availableSides: ['left', 'right'],
      }),
    ).toEqual({type: HOUSE_VIEW_INSERTION_DECISION_TYPES.openSideSelector});
  });

  it('calculates stacked top/elevation positions around a center', () => {
    expect(
      calculateStackedViewPositions({
        centerY: 200,
        topHeight: 80,
        bottomHeight: 100,
        gap: 20,
      }),
    ).toEqual({topY: 140, bottomY: 250});
  });

});

