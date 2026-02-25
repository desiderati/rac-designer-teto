import {describe, expect, it} from 'vitest';
import {
  canCreateContraventamentoForNivel,
  collectOccupiedContraventamentoSides,
  createContraventamentoEditorState,
  getContraventamentoColumnCenterX,
  getContraventamentoSideLabel,
  inferContraventamentoSideFromBeamGeometry,
  isContraventamentoDestinationEligible,
  parsePilotiGridPosition,
} from './house-contraventamento-use-cases.ts';

describe('house-contraventamento use cases', () => {
  it('parses piloti grid position from id', () => {
    expect(parsePilotiGridPosition('piloti_3_2')).toEqual({col: 3, row: 2});
    expect(parsePilotiGridPosition('invalid')).toBeNull();
  });

  it('checks contraventamento eligibility by nivel threshold', () => {
    expect(canCreateContraventamentoForNivel(0.41)).toBe(true);
    expect(canCreateContraventamentoForNivel(0.4)).toBe(false);
  });

  it('infers beam side by geometry relative to column center', () => {
    const col = 0;
    const center = getContraventamentoColumnCenterX(col);

    expect(
      inferContraventamentoSideFromBeamGeometry({
        col,
        left: center - 20,
        width: 10,
      }),
    ).toBe('left');

    expect(
      inferContraventamentoSideFromBeamGeometry({
        col,
        left: center + 2,
        width: 10,
      }),
    ).toBe('right');
  });

  it('validates destination against first piloti, row difference and nivel', () => {
    expect(
      isContraventamentoDestinationEligible({
        first: {col: 1, row: 0},
        candidate: {col: 1, row: 2},
        nivel: 0.8,
      }),
    ).toBe(true);

    expect(
      isContraventamentoDestinationEligible({
        first: {col: 1, row: 0},
        candidate: {col: 2, row: 2},
        nivel: 0.8,
      }),
    ).toBe(false);

    expect(
      isContraventamentoDestinationEligible({
        first: {col: 1, row: 0},
        candidate: {col: 1, row: 0},
        nivel: 0.8,
      }),
    ).toBe(false);

    expect(
      isContraventamentoDestinationEligible({
        first: {col: 1, row: 0},
        candidate: {col: 1, row: 2},
        nivel: 0.4,
      }),
    ).toBe(false);
  });

  it('returns localized side label', () => {
    expect(getContraventamentoSideLabel('left')).toBe('esquerdo');
    expect(getContraventamentoSideLabel('right')).toBe('direito');
  });

  it('collects occupied sides for a column and resolves missing side', () => {
    const unresolved: any = {
      isContraventamento: true,
      contraventamentoCol: 2,
      left: 30,
      width: 10,
      scaleX: 1,
    };
    const right: any = {
      isContraventamento: true,
      contraventamentoCol: 2,
      contraventamentoSide: 'right',
      left: 100,
      width: 10,
      scaleX: 1,
    };

    const resolved: string[] = [];
    const occupied = collectOccupiedContraventamentoSides({
      objects: [unresolved, right],
      col: 2,
      onResolvedSide: (object, side) => {
        (object as any).contraventamentoSide = side;
        resolved.push(side);
      },
    });

    expect(occupied).toEqual({left: true, right: true});
    expect(resolved).toHaveLength(1);
    expect((unresolved as any).contraventamentoSide).toBe('left');
  });

  it('creates editor state from eligibility and occupied sides', () => {
    expect(
      createContraventamentoEditorState({
        canReceiveContraventamento: false,
        occupiedSides: {left: true, right: true},
      }),
    ).toEqual({
      leftDisabled: true,
      rightDisabled: true,
      leftActive: false,
      rightActive: false,
    });

    expect(
      createContraventamentoEditorState({
        canReceiveContraventamento: true,
        occupiedSides: {left: true, right: false},
      }),
    ).toEqual({
      leftDisabled: false,
      rightDisabled: false,
      leftActive: true,
      rightActive: false,
    });
  });
});
