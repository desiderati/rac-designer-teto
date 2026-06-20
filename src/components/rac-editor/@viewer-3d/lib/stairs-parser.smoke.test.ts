import {describe, expect, it} from 'vitest';
import {parseStairsFromElevationViews} from '@/components/rac-editor/@viewer-3d/lib/parsers/stairs-parser.ts';
import type {House3DElevationViewProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';

function createElevationViewWithStairs(params: {
  bodyWidth: number;
  bodyLeft?: number;
  includeBody?: boolean;
  doorWidth?: number;
  stairWidth: number;
  stairLeft: number;
  stairHeightMts: number;
  stepCount: number;
  houseInstanceId: string;
  viewType?: House3DElevationViewProjection['viewType'];
  houseView?: string;
}): House3DElevationViewProjection {
  return {
    viewType: params.viewType ?? 'front',
    instanceId: params.houseInstanceId,
    houseView: params.houseView,
    groupWidth: 0,
    bodyLeft: Number.isFinite(Number(params.bodyLeft)) ? Number(params.bodyLeft) : undefined,
    bodyWidth: params.includeBody ?? true ? params.bodyWidth : undefined,
    doorWidth: Number.isFinite(Number(params.doorWidth)) ? Number(params.doorWidth) : undefined,
    stairs: {
      width: params.stairWidth,
      left: params.stairLeft,
      heightMts: params.stairHeightMts,
      stepCount: params.stepCount,
    },
  };
}

describe('stairs-parser.ts', () => {
  it('mapeia escada de tipo6 para a face frontal correta', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        bodyWidth: 305,
        stairWidth: 40,
        stairLeft: 80,
        stairHeightMts: 1.2,
        stepCount: 4,
        houseInstanceId: 'front_1',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'front',
      stairWidth: 40,
      stairHeightMts: 1.2,
      stepCount: 4,
      centerFromLeft: 252.5,
    });
  });

  it('mapeia escada de tipo3 (side2 à esquerda no 2D) para face direita no 3D', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo3',
      sideMappings: {
        top: 'back',
        bottom: 'back',
        left: 'side2',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        viewType: 'side2',
        houseView: 'side',
        bodyWidth: 150,
        stairWidth: 40,
        stairLeft: 20,
        stairHeightMts: 0.9,
        stepCount: 3,
        houseInstanceId: 'side2_1',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed?.face).toBe('right');
  });

  it('usa fallback da largura da fachada via porta quando não existe isHouseBody na elevação', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        bodyWidth: 0,
        includeBody: false,
        doorWidth: 40,
        stairWidth: 40,
        stairLeft: 80,
        stairHeightMts: 1.2,
        stepCount: 4,
        houseInstanceId: 'front_2',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed?.centerFromLeft).toBe(252.5);
  });

  it('calcula escada tipo6 pela borda real do corpo quando a elevação está deslocada', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        bodyWidth: 305,
        bodyLeft: -120,
        stairWidth: 40,
        stairLeft: -40,
        stairHeightMts: 1.2,
        stepCount: 4,
        houseInstanceId: 'front_shifted',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'front',
      centerFromLeft: 100,
    });
  });

  it('calcula escada tipo3 pela borda real do corpo quando a lateral está deslocada', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo3',
      sideMappings: {
        top: 'back',
        bottom: 'back',
        left: 'side2',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        viewType: 'side2',
        houseView: 'side',
        bodyWidth: 150,
        bodyLeft: -30,
        stairWidth: 40,
        stairLeft: 25,
        stairHeightMts: 0.9,
        stepCount: 3,
        houseInstanceId: 'side2_shifted',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'right',
      centerFromLeft: 75,
    });
  });

  it('ignora elevação com escada incompleta e usa a próxima escada válida', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [
        createElevationViewWithStairs({
          bodyWidth: 300,
          stairWidth: 0,
          stairLeft: -40,
          stairHeightMts: 1.2,
          stepCount: 4,
          houseInstanceId: 'front_invalid',
        }),
        createElevationViewWithStairs({
          bodyWidth: 305,
          bodyLeft: -120,
          stairWidth: 40,
          stairLeft: -40,
          stairHeightMts: 1.2,
          stepCount: 4,
          houseInstanceId: 'front_valid',
        }),
      ],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      id: 'front_valid-stairs',
      centerFromLeft: 100,
    });
  });

  it('normaliza escada de elevação redimensionada para o tamanho canônico do 3D', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        bodyWidth: 610,
        bodyLeft: -306.5,
        stairWidth: 83,
        stairLeft: 83.5,
        stairHeightMts: 0.8,
        stepCount: 3,
        houseInstanceId: 'front_scaled',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'front',
      centerFromLeft: 215.75,
      stairWidth: 41.5,
      stairHeightMts: 0.8,
      stepCount: 3,
    });
  });

  it('normaliza escada lateral tipo3 redimensionada para o tamanho canônico do 3D', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo3',
      sideMappings: {
        top: 'back',
        bottom: 'back',
        left: 'side2',
        right: 'side1',
      },
      elevationViews: [createElevationViewWithStairs({
        viewType: 'side2',
        houseView: 'side',
        bodyWidth: 300,
        bodyLeft: -150,
        stairWidth: 80,
        stairLeft: 50,
        stairHeightMts: 0.8,
        stepCount: 3,
        houseInstanceId: 'side2_scaled',
      })],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'right',
      centerFromLeft: 120,
      stairWidth: 40,
      stairHeightMts: 0.8,
      stepCount: 3,
    });
  });
});
