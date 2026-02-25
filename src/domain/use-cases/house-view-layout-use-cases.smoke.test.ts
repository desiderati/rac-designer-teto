import {describe, expect, it} from 'vitest';
import {
  buildAutoAssignedSlots,
  calculateStackedViewPositions,
  canDeletePlant,
  getAutoSelectedSide,
  getAvailableSides,
  getAvailableViewsForType,
  getPreAssignedSlots,
  hasOtherViews,
  hasPreAssignedSlots,
  needsSideSelection,
  resolveViewInsertionRequest,
  type HouseSideAssignments,
  type HouseViewSide,
} from './house-view-layout-use-cases.ts';

function createViews(): HouseViewSide {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

function createAssignments(): HouseSideAssignments {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}

describe('house-view-layout use cases', () => {
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
    expect(canDeletePlant(views)).toBe(true);

    views.back.push({side: 'top'});
    expect(hasOtherViews(views)).toBe(true);
    expect(canDeletePlant(views)).toBe(false);
  });

  it('returns available sides and side selection requirement', () => {
    const assignments = createAssignments();
    assignments.top = 'front';

    expect(getAvailableSides({viewType: 'back', sideAssignments: assignments})).toEqual(['bottom']);
    expect(needsSideSelection({viewType: 'back', sideAssignments: assignments})).toBe(true);
    expect(needsSideSelection({viewType: 'top', sideAssignments: assignments})).toBe(false);
  });

  it('auto-selects opposite side when opposite view exists', () => {
    const views = createViews();
    const assignments = createAssignments();
    views.front.push({side: 'top'});

    expect(
      getAutoSelectedSide({
        viewType: 'back',
        views,
        sideAssignments: assignments,
      }),
    ).toBe('bottom');
  });

  it('builds expected pre-assigned slots per house type', () => {
    expect(buildAutoAssignedSlots({houseType: 'tipo6', initialSide: 'top'})).toEqual({
      front: 'top',
      back: 'bottom',
      side1_0: 'right',
      side1_1: 'left',
    });

    expect(buildAutoAssignedSlots({houseType: 'tipo3', initialSide: 'left'})).toEqual({
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
      getPreAssignedSlots({
        viewType: 'side1',
        preAssignedSides: {...slots},
        sideAssignments: assignments,
      }),
    ).toEqual([
      {label: 'Esquerdo', side: 'left', onCanvas: false},
      {label: 'Direito', side: 'right', onCanvas: true},
    ]);
  });

  it('checks if there are any pre-assigned slots', () => {
    expect(hasPreAssignedSlots({})).toBe(false);
    expect(hasPreAssignedSlots({front: 'top'})).toBe(true);
  });

  it('resolves insertion for direct add and blocking states', () => {
    expect(
      resolveViewInsertionRequest({
        viewType: 'top',
        isAtLimit: true,
        preAssignedSides: [],
        availableSides: [],
      }),
    ).toEqual({type: 'blocked_limit'});

    expect(
      resolveViewInsertionRequest({
        viewType: 'top',
        isAtLimit: false,
        preAssignedSides: [],
        availableSides: [],
      }),
    ).toEqual({type: 'add_direct'});

    expect(
      resolveViewInsertionRequest({
        viewType: 'front',
        isAtLimit: false,
        preAssignedSides: [],
        availableSides: [],
      }),
    ).toEqual({type: 'blocked_no_sides'});

    expect(
      resolveViewInsertionRequest({
        viewType: 'back',
        isAtLimit: false,
        preAssignedSides: [],
        availableSides: ['bottom'],
      }),
    ).toEqual({type: 'add_direct', side: 'bottom'});
  });

  it('resolves insertion with pre-assigned slots', () => {
    expect(
      resolveViewInsertionRequest({
        viewType: 'side1',
        isAtLimit: false,
        preAssignedSides: [{label: 'Direito', side: 'right', onCanvas: true}],
        availableSides: ['left', 'right'],
      }),
    ).toEqual({type: 'blocked_no_instance_slots'});

    expect(
      resolveViewInsertionRequest({
        viewType: 'side1',
        isAtLimit: false,
        preAssignedSides: [
          {label: 'Esquerdo', side: 'left', onCanvas: false},
          {label: 'Direito', side: 'right', onCanvas: true},
        ],
        availableSides: ['left', 'right'],
      }),
    ).toEqual({type: 'add_direct', side: 'left'});

    expect(
      resolveViewInsertionRequest({
        viewType: 'back',
        isAtLimit: false,
        preAssignedSides: [
          {label: 'Superior', side: 'top', onCanvas: false},
          {label: 'Inferior', side: 'bottom', onCanvas: false},
        ],
        availableSides: ['top', 'bottom'],
      }),
    ).toEqual({
      type: 'open_instance_selector',
      slots: [
        {label: 'Superior', side: 'top', onCanvas: false},
        {label: 'Inferior', side: 'bottom', onCanvas: false},
      ],
    });
  });

  it('calculates stacked positions for top and bottom views', () => {
    expect(
      calculateStackedViewPositions({
        centerY: 500,
        topHeight: 220,
        bottomHeight: 180,
        gap: 30,
      }),
    ).toEqual({
      topY: 395,
      bottomY: 625,
    });
  });
});
