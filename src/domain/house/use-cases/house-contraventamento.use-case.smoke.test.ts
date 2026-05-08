import {describe, expect, it} from 'vitest';
import {
  canCreateContraventamentoForNivel,
  collectAutoContraventamentoRowsByColumn,
  hasEligiblePilotiForContraventamentoInColumn,
  isHouseContraventamentoDestinationEligible,
  isHousePilotiEligibleForContraventamento,
  resolveAutoContraventamentoRows,
  resolveNextContraventamentoSide,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';

describe('house-contraventamento.use-case.ts', () => {
  it('exige nível mínimo e desproporção de altura para elegibilidade', () => {
    expect(canCreateContraventamentoForNivel(0.1)).toBe(false);
    expect(canCreateContraventamentoForNivel(0.2)).toBe(true);
    expect(isHousePilotiEligibleForContraventamento({height: 0.1, nivel: 0.1})).toBe(false);
    expect(isHousePilotiEligibleForContraventamento({height: 2.0, nivel: 0.4})).toBe(false);
    expect(isHousePilotiEligibleForContraventamento({height: 0.5, nivel: 0.4})).toBe(true);
  });

  it('coleta linhas elegíveis por coluna sem depender do canvas', () => {
    const rowsByColumn = collectAutoContraventamentoRowsByColumn({
      piloti_1_2: {height: 0.5, nivel: 0.4},
      piloti_2_0: {height: 0.5, nivel: 0.4},
      piloti_2_1: {height: 2.0, nivel: 0.4},
      piloti_2_2: {height: 0.1, nivel: 0.1},
    });

    expect(rowsByColumn.get(1)).toEqual([2]);
    expect(rowsByColumn.get(2)).toEqual([0]);
  });

  it('habilita destino manual pela elegibilidade da coluna', () => {
    const pilotis = {
      piloti_2_0: {height: 0.5, nivel: 0.4},
      piloti_2_1: {height: 2.0, nivel: 0.4},
      piloti_2_2: {height: 2.0, nivel: 0.4},
    };

    expect(hasEligiblePilotiForContraventamentoInColumn({col: 2, pilotis})).toBe(true);
    expect(
      isHouseContraventamentoDestinationEligible({
        first: {col: 2, row: 0},
        candidate: {col: 2, row: 2},
        pilotis,
      }),
    ).toBe(true);
    expect(
      isHouseContraventamentoDestinationEligible({
        first: {col: 2, row: 0},
        candidate: {col: 1, row: 2},
        pilotis,
      }),
    ).toBe(false);
  });

  it('resolve lado e linhas para criação automática', () => {
    expect(resolveNextContraventamentoSide({left: false, right: false})).toBe('left');
    expect(resolveNextContraventamentoSide({left: true, right: false})).toBe('right');
    expect(resolveNextContraventamentoSide({left: true, right: true})).toBeNull();

    expect(
      resolveAutoContraventamentoRows({
        col: 2,
        requiredRows: [0],
        pilotis: {
          piloti_2_0: {height: 0.5, nivel: 0.8},
          piloti_2_1: {height: 2.0, nivel: 0.6},
          piloti_2_2: {height: 0.5, nivel: 0.2},
        },
      }),
    ).toEqual({anchorRow: 2, targetRow: 0});
  });
});
