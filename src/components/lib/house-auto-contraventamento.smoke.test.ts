import {describe, expect, it, vi} from 'vitest';
import {refreshAutoContraventamentoInAllViews} from '@/components/lib/house-auto-contraventamento.ts';

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

  it('remove contraventamento automático quando a coluna volta à proporção', () => {
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

    const secondRun = refreshAutoContraventamentoInAllViews({
      pilotis: {
        piloti_1_2: {height: 2.0, isMaster: false, nivel: 0.5},
      } as any,
      topViews: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(secondRun).toBe(true);
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
});
