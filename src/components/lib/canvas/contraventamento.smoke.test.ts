import {describe, expect, it} from 'vitest';
import {
  canCreateContraventamentoForNivel,
  collectOccupiedContraventamentoSides,
  createContraventamentoEditorState,
  getContraventamentoColumnCenterX,
  getContraventamentoSideLabel,
  inferContraventamentoSideFromBeamGeometry,
  isPilotiOutOfProportion,
  isContraventamentoDestinationEligible,
  parsePilotiGridPosition,
  resolveContraventamentoOffsetFromNivel,
} from './contraventamento.ts';

describe('contraventamento helpers', () => {
  it('parses piloti ids and validates nivel', () => {
    expect(parsePilotiGridPosition('piloti_2_1')).toEqual({col: 2, row: 1});
    expect(parsePilotiGridPosition('invalid')).toBeNull();
    expect(canCreateContraventamentoForNivel(0.5)).toBe(true);
    expect(canCreateContraventamentoForNivel(0.2)).toBe(true);
  });

  it('resolves dynamic offsets from nivel', () => {
    expect(resolveContraventamentoOffsetFromNivel(0.2)).toBe(0.05);
    expect(resolveContraventamentoOffsetFromNivel(0.3)).toBe(0.1);
    expect(resolveContraventamentoOffsetFromNivel(0.4)).toBe(0.2);
  });

  it('infers side and labels', () => {
    const center = getContraventamentoColumnCenterX(0);
    expect(inferContraventamentoSideFromBeamGeometry({col: 0, left: center - 40, width: 10})).toBe('left');
    expect(getContraventamentoSideLabel('left')).toBe('esquerdo');
    expect(getContraventamentoSideLabel('right')).toBe('direito');
  });

  it('validates destination eligibility', () => {
    expect(
      isContraventamentoDestinationEligible({
        first: {col: 1, row: 0},
        candidate: {col: 1, row: 2},
        nivel: 0.6,
      }),
    ).toBe(true);
  });

  it('detects piloti outside the recommended proportion', () => {
    expect(isPilotiOutOfProportion(1.0, 0.4)).toBe(true);
    expect(isPilotiOutOfProportion(1.5, 0.5)).toBe(false);
  });

  it('collects occupied sides and builds editor state', () => {
    const occupied = collectOccupiedContraventamentoSides({
      col: 1,
      objects: [
        {isContraventamento: true, contraventamentoCol: 1, contraventamentoSide: 'left'},
      ],
    });
    expect(occupied).toEqual({left: true, right: false});

    expect(
      createContraventamentoEditorState({canReceiveContraventamento: false, occupiedSides: occupied}),
    ).toEqual({leftDisabled: true, rightDisabled: true, leftActive: false, rightActive: false});
  });
});
