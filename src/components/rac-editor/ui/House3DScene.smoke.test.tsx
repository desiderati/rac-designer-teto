import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {House3DScene} from '@/components/rac-editor/ui/House3DScene.tsx';
import {DEFAULT_HOUSE_PILOTI, HousePiloti} from '@/shared/types/house.ts';
import {ALL_PILOTI_IDS} from '@/shared/config.ts';

describe('House3DScene contraventamento', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renderiza contraventamento mesmo quando origem < metade do destino', () => {
    const pilotis = {
      piloti_0_0: {...DEFAULT_HOUSE_PILOTI, nivel: 0.3},
      piloti_0_2: {...DEFAULT_HOUSE_PILOTI, nivel: 0.8},
    } as Record<string, HousePiloti>;

    const contraventamento = {
      id: 'c-1',
      col: 0,
      startRow: 0,
      endRow: 2,
      side: 'left' as const,
      anchorPilotiId: 'piloti_0_0',
    };

    const baseline = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
      />
    );
    const baselineBoxGeometryCount = baseline.container.querySelectorAll('boxgeometry').length;
    baseline.unmount();

    const withContraventamento = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[contraventamento]}
      />
    );
    const withContraventamentoBoxGeometryCount = withContraventamento.container.querySelectorAll('boxgeometry').length;

    expect(withContraventamentoBoxGeometryCount).toBe(baselineBoxGeometryCount + 1);
  });

  it('renderiza piloti segmentado em duas partes (2/3 inferior + 1/3 superior)', () => {
    const pilotis = {} as Record<string, HousePiloti>;

    const scene = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
      />,
    );

    const cylinderCount = scene.container.querySelectorAll('cylindergeometry').length;
    expect(cylinderCount).toBe(ALL_PILOTI_IDS.length * 2);
  });
});
