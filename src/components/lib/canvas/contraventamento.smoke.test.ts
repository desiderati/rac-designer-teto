import {describe, expect, it} from 'vitest';
import {isPilotiOutOfProportion, parsePilotiGridPosition} from "./piloti";
import {
  canCreateContraventamentoForNivel, collectOccupiedContraventamentoSides, createContraventamentoEditorState,
  getContraventamentoColumnCenterX, getContraventamentoSideLabel, inferContraventamentoSide,
  isContraventamentoDestinationEligible,
  resolveContraventamentoOffsetFromNivel
} from "@/shared/types/contraventamento.ts";

describe('contraventamento helpers', () => {
  it('parses piloti ids and validates nivel', () => {
    expect(parsePilotiGridPosition('piloti_2_1')).toEqual({col: 2, row: 1});
    expect(parsePilotiGridPosition('invalid')).toBeNull();
    expect(canCreateContraventamentoForNivel(0.5)).toBe(true);
    expect(canCreateContraventamentoForNivel(0.2)).toBe(true);
  });

  it('resolves dynamic offsets from nivel', () => {
    expect(resolveContraventamentoOffsetFromNivel(0.2, true)).toBe(0);
    expect(resolveContraventamentoOffsetFromNivel(0.4, true)).toBeCloseTo(0.2667, 4);
    expect(resolveContraventamentoOffsetFromNivel(0.4, false)).toBeCloseTo(0.1333, 4);
    expect(resolveContraventamentoOffsetFromNivel(0.6, true)).toBeCloseTo(0.2, 4);
  });

  it('infers side and labels', () => {
    const center = getContraventamentoColumnCenterX(0);
    expect(inferContraventamentoSide({col: 0, left: center - 40, width: 10})).toBe('left');
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
