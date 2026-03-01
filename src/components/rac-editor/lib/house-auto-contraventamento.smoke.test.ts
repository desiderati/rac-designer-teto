import {describe, expect, it, vi} from 'vitest';
import {refreshAutoContraventamentoInAllViews} from '@/components/rac-editor/lib/house-auto-contraventamento.ts';

function createMockGroup(props: Record<string, unknown> = {}) {
  const group: any = {
    _objects: [] as any[],
    getObjects() {
      return this._objects;
    },
    setCoords: vi.fn(),
    ...props,
  };

  return {group};
}

describe('house auto contraventamento', () => {
  it('cria contraventamento automático quando piloti está fora da proporção', () => {
    const {group} = createMockGroup();

    const changed = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_2_1: {height: 1.0, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(true);
    const contrav = group.getObjects().find((object: any) => object?.isContraventamento === true) as any;
    expect(contrav).toBeTruthy();
    expect(contrav?.isAutoContraventamento).toBe(true);
    expect(contrav?.contraventamentoCol).toBe(2);
  });

  it('não cria contraventamento automático quando piloti está proporcional', () => {
    const {group} = createMockGroup();

    const changed = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_0: {height: 1.5, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(false);
    expect(group.getObjects().find((object: any) => object?.isContraventamento === true)).toBeUndefined();
  });

  it('não reaplica contraventamento automático após a inicialização da vista', () => {
    const {group} = createMockGroup();

    const firstRun = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_2: {height: 1.0, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(firstRun).toBe(true);
    expect(group.getObjects().some((object: any) => object?.isAutoContraventamento === true)).toBe(true);

    // Simula o usuário removendo o contraventamento automático.
    group._objects = group.getObjects().filter((object: any) => object?.isAutoContraventamento !== true);

    const secondRun = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_2: {height: 1.0, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(secondRun).toBe(false);
    expect(group.getObjects().some((object: any) => object?.isAutoContraventamento === true)).toBe(false);
  });

  it('mantém contraventamento manual sem duplicar com automático na mesma coluna', () => {
    const {group} = createMockGroup();
    group.getObjects().push({
      isContraventamento: true,
      contraventamentoId: 'manual_col0',
      contraventamentoCol: 0,
      contraventamentoSide: 'left',
    });

    const changed = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(false);
    expect(group.getObjects()).toHaveLength(1);
    expect(group.getObjects()[0]?.isAutoContraventamento).not.toBe(true);
  });

  it('usa menor nível como origem, maior nível como destino e maior distância possível', () => {
    const {group} = createMockGroup();

    const changed = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_0: {height: 0.5, isMaster: false, nivel: 0.2},
        piloti_1_1: {height: 0.5, isMaster: false, nivel: 0.2},
        piloti_1_2: {height: 0.5, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(true);
    const contrav = group.getObjects().find((object: any) => object?.isAutoContraventamento === true) as any;
    expect(contrav).toBeTruthy();
    expect(contrav?.contraventamentoCol).toBe(1);
    expect(String(contrav?.contraventamentoAnchorPilotiId)).toBe('piloti_1_0');
    expect(contrav?.contraventamentoStartRow).toBe(0);
    expect(contrav?.contraventamentoEndRow).toBe(2);
  });

  it('prioriza ponta a ponta na coluna mesmo quando o maior nível está no meio', () => {
    const {group} = createMockGroup();

    const changed = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_0: {height: 0.5, isMaster: false, nivel: 0.2},
        piloti_1_1: {height: 0.5, isMaster: false, nivel: 0.6},
        piloti_1_2: {height: 0.5, isMaster: false, nivel: 0.3},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(true);
    const contrav = group.getObjects().find((object: any) => object?.isAutoContraventamento === true) as any;
    expect(contrav).toBeTruthy();
    expect(contrav?.contraventamentoCol).toBe(1);
    expect(contrav?.contraventamentoStartRow).toBe(0);
    expect(contrav?.contraventamentoEndRow).toBe(2);
  });
});
