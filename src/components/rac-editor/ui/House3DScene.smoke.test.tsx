import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {House3DScene} from '@/components/rac-editor/ui/3d/House3DScene.tsx';
import {DEFAULT_HOUSE_PILOTI, HousePiloti} from '@/shared/types/house.ts';
import {ALL_PILOTI_IDS} from '@/shared/config.ts';

describe('House3DScene.tsx', () => {
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
      />,
    );
    const baselineBoxGeometryCount = baseline.container.querySelectorAll('boxgeometry').length;
    baseline.unmount();

    const withContraventamento = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[contraventamento]}
      />,
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

  it('renderiza escada 3D em degraus com laterais e piso do degrau', () => {
    const pilotis = {} as Record<string, HousePiloti>;

    const baseline = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
        stairs={null}
      />,
    );
    const baselineBoxGeometryCount = baseline.container.querySelectorAll('boxgeometry').length;
    baseline.unmount();

    const withStairs = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
        stairs={{
          id: 'stairs-1',
          face: 'front',
          centerFromLeft: 220,
          stairWidth: 40,
          stairHeightMts: 0.9,
          stepCount: 3,
        }}
      />,
    );
    const withStairsBoxGeometryCount = withStairs.container.querySelectorAll('boxgeometry').length;

    // stepCount=3 gera 3 degraus + 2 vigas laterais = 5 box geometries adicionais.
    expect(withStairsBoxGeometryCount).toBe(baselineBoxGeometryCount + 5);
  });

  it('renderiza escada minima no 3D quando stepCount e valido', () => {
    const pilotis = {} as Record<string, HousePiloti>;

    const baseline = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
        stairs={null}
      />,
    );
    const baselineBoxGeometryCount = baseline.container.querySelectorAll('boxgeometry').length;
    baseline.unmount();

    const withTinyStair = render(
      <House3DScene
        houseType='tipo6'
        pilotis={pilotis}
        contraventamentos={[]}
        stairs={{
          id: 'stairs-tiny',
          face: 'front',
          centerFromLeft: 220,
          stairWidth: 40,
          stairHeightMts: 0.3,
          stepCount: 1,
        }}
      />,
    );
    const withTinyStairBoxGeometryCount = withTinyStair.container.querySelectorAll('boxgeometry').length;

    expect(withTinyStairBoxGeometryCount).toBe(baselineBoxGeometryCount + 3);
  });
});

