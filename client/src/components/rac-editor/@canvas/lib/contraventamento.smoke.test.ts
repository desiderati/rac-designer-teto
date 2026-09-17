import {describe, expect, it, vi} from 'vitest';
import {
  addContraventamentoBeam,
  addHorizontalContraventamentoBeam,
  syncContraventamentoElevationViews
} from '@/components/rac-editor/@canvas/lib/contraventamento.ts';
import {
  createContraventamentoEditorState,
  getContraventamentoSideLabel,
  resolveContraventamentoOffsetFromNivel
} from '@/shared/types/contraventamento.ts';
import {
  collectOccupiedHorizontalContraventamentoSides,
  collectOccupiedContraventamentoSides,
  getContraventamentoColumnCenterX,
  inferContraventamentoSide,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';
import {isPilotiOutOfProportion, parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

function createMockGroup(props: Record<string, unknown> = {}) {
  const group: any = {
    type: 'group',
    _objects: [] as any[],
    getObjects() {
      return this._objects;
    },
    getCanvasObjects() {
      return this._objects;
    },
    setCoords: vi.fn(),
    ...props,
  };

  return group;
}

function createPilotiRect(pilotiId: string, left: number, top: number) {
  return {
    isPilotiRect: true,
    pilotiId,
    left,
    top,
    width: 12,
    scaleX: 1,
    pilotiBaseHeight: 100,
  };
}

function getProjectionCoordinates(group: { _objects: any[] }) {
  return group._objects
    .filter((object: any) => object?.isContraventamentoElevation === true)
    .map((object: any) => [
      Number(object.x1),
      Number(object.y1),
      Number(object.x2),
      Number(object.y2),
    ]);
}

describe('contraventamento.ts', () => {
  const defaultElevationWidth = HOUSE_DIMENSIONS.contraventamento.squareWidth;

  it('parses piloti ids', () => {
    expect(parsePilotiGridPosition('piloti_2_1')).toEqual({col: 2, row: 1});
    expect(parsePilotiGridPosition('invalid')).toBeNull();
  });

  it('resolves dynamic offsets from nivel', () => {
    expect(resolveContraventamentoOffsetFromNivel(0.2, true)).toBeCloseTo(0.2, 4);
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

  it('detects piloti outside contraventamento proportion', () => {
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
    ).toEqual({
      leftDisabled: false,
      rightDisabled: true,
      leftActive: true,
      rightActive: false,
      topDisabled: true,
      bottomDisabled: true,
      topActive: false,
      bottomActive: false,
    });

    expect(
      createContraventamentoEditorState({
        canReceiveContraventamento: false,
        occupiedSides: {left: false, right: false},
      }),
    ).toEqual({
      leftDisabled: true,
      rightDisabled: true,
      leftActive: false,
      rightActive: false,
      topDisabled: true,
      bottomDisabled: true,
      topActive: false,
      bottomActive: false,
    });

    expect(
      createContraventamentoEditorState({
        canReceiveContraventamento: false,
        occupiedSides: {left: false, right: false},
        canReceiveHorizontalContraventamento: true,
        occupiedHorizontalSides: {top: false, bottom: true},
        allowedHorizontalSides: ['bottom'],
      }),
    ).toMatchObject({
      topDisabled: true,
      bottomDisabled: false,
      topActive: false,
      bottomActive: true,
    });
  });

  it('cria contraventamento horizontal tangente ao lado informado', () => {
    const topGroup = createMockGroup();
    const createdId = addHorizontalContraventamentoBeam(
      topGroup,
      {col: 0, row: 1},
      {col: 3, row: 1},
      {side: 'top', anchorPilotiId: 'piloti_0_1'},
    );

    expect(createdId).toEqual(expect.any(String));
    const beam = topGroup._objects[0];
    expect(beam.strokeUniform).toBe(true);
    expect(beam.contraventamentoOrientation).toBe('horizontal');
    expect(beam.contraventamentoSide).toBe('top');
    expect(beam.contraventamentoStartCol).toBe(0);
    expect(beam.contraventamentoEndCol).toBe(3);
    expect(beam.contraventamentoAnchorPilotiId).toBe('piloti_0_1');

    expect(
      collectOccupiedHorizontalContraventamentoSides({
        row: 1,
        objects: topGroup.getCanvasObjects(),
      }),
    ).toEqual({top: true, bottom: false});
  });

  it('cria contraventamento vertical da planta com borda uniforme', () => {
    const topGroup = createMockGroup();
    const createdId = addContraventamentoBeam(
      topGroup,
      {col: 1, row: 0},
      {col: 1, row: 2},
      {side: 'left', anchorPilotiId: 'piloti_1_0'},
    );

    expect(createdId).toEqual(expect.any(String));
    const beam = topGroup._objects[0];
    expect(beam.strokeUniform).toBe(true);
    expect(beam.contraventamentoOrientation).toBe('vertical');
  });

  it('avalia ocupação horizontal pelos pilotis tocados pelo trecho', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoOrientation: 'horizontal',
          contraventamentoRow: 1,
          contraventamentoStartCol: 0,
          contraventamentoEndCol: 1,
          contraventamentoSide: 'top',
        },
        {
          isContraventamento: true,
          contraventamentoOrientation: 'horizontal',
          contraventamentoRow: 1,
          contraventamentoStartCol: 0,
          contraventamentoEndCol: 1,
          contraventamentoSide: 'bottom',
        },
      ],
    });

    expect(
      collectOccupiedHorizontalContraventamentoSides({
        row: 1,
        col: 1,
        objects: topGroup.getCanvasObjects(),
      }),
    ).toEqual({top: true, bottom: true});

    expect(
      collectOccupiedHorizontalContraventamentoSides({
        row: 1,
        col: 2,
        objects: topGroup.getCanvasObjects(),
      }),
    ).toEqual({top: false, bottom: false});

    expect(
      collectOccupiedHorizontalContraventamentoSides({
        row: 1,
        startCol: 2,
        endCol: 3,
        objects: topGroup.getCanvasObjects(),
      }),
    ).toEqual({top: false, bottom: false});

    expect(
      collectOccupiedHorizontalContraventamentoSides({
        row: 1,
        startCol: 1,
        endCol: 2,
        objects: topGroup.getCanvasObjects(),
      }),
    ).toEqual({top: true, bottom: true});
  });

  it('constructionSites contraventamento in side views using legacy and houseSide metadata', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_left',
          contraventamentoCol: 0,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 2,
          contraventamentoSide: 'left',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_right',
          contraventamentoCol: 3,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 2,
          contraventamentoSide: 'right',
          contraventamentoAnchorPilotiId: 'piloti_3_0',
        },
      ],
    });

    const legacyLeftGroup = createMockGroup({
      houseView: 'side',
      isRightSide: false,
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_0_2', 10, 250),
      ],
    });

    const modernRightGroup = createMockGroup({
      houseSide: 'right',
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_3_0', 20, 100),
        createPilotiRect('piloti_3_2', 20, 250),
      ],
    });

    syncContraventamentoElevationViews(
      topGroup,
      [legacyLeftGroup, modernRightGroup],
      () => 0.4,
    );

    const legacyLeftProjections = legacyLeftGroup._objects.filter(
      (object: any) => object?.isContraventamentoElevation === true,
    );
    const modernRightProjections = modernRightGroup._objects.filter(
      (object: any) => object?.isContraventamentoElevation === true,
    );

    expect(legacyLeftProjections).toHaveLength(2);
    expect(legacyLeftProjections.map((object: any) => object.contraventamentoId)).toEqual([
      'contrav_left',
      'contrav_left',
    ]);
    expect(modernRightProjections).toHaveLength(2);
    expect(modernRightProjections.map((object: any) => object.contraventamentoId)).toEqual([
      'contrav_right',
      'contrav_right',
    ]);
    expect(legacyLeftProjections.map((object: any) => object.strokeWidth)).toEqual([
      defaultElevationWidth + 2,
      defaultElevationWidth,
    ]);
    expect(legacyLeftProjections.map((object: any) => object.strokeUniform)).toEqual([
      false,
      false,
    ]);
    expect(modernRightProjections.map((object: any) => object.strokeWidth)).toEqual([
      defaultElevationWidth + 2,
      defaultElevationWidth,
    ]);
    expect(modernRightProjections.map((object: any) => object.strokeUniform)).toEqual([
      false,
      false,
    ]);
    expect(legacyLeftGroup._objects[0]?.isGroundElement).toBe(true);
    expect(legacyLeftGroup._objects.slice(1, 3).every(
      (object: any) => object?.isContraventamentoElevation === true,
    )).toBe(true);
    expect(modernRightGroup._objects[0]?.isGroundElement).toBe(true);
    expect(modernRightGroup._objects.slice(1, 3).every(
      (object: any) => object?.isContraventamentoElevation === true,
    )).toBe(true);
    expect(legacyLeftGroup.setCoords).toHaveBeenCalled();
    expect(modernRightGroup.setCoords).toHaveBeenCalled();
  });

  it('projeta contraventamento horizontal nas elevações de 6m', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_horizontal',
          contraventamentoOrientation: 'horizontal',
          contraventamentoRow: 0,
          contraventamentoStartCol: 0,
          contraventamentoEndCol: 3,
          contraventamentoSide: 'bottom',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
      ],
    });

    const frontGroup = createMockGroup({
      houseSide: 'top',
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_3_0', 210, 250),
      ],
    });

    syncContraventamentoElevationViews(
      topGroup,
      [frontGroup],
      () => 0.4,
    );

    const projections = frontGroup._objects.filter(
      (object: any) => object?.isContraventamentoElevation === true,
    );

    expect(projections).toHaveLength(2);
    expect(projections.map((object: any) => object.contraventamentoId)).toEqual([
      'contrav_horizontal',
      'contrav_horizontal',
    ]);
    expect(projections.map((object: any) => object.strokeWidth)).toEqual([
      defaultElevationWidth + 2,
      defaultElevationWidth,
    ]);
    expect(projections.map((object: any) => object.strokeUniform)).toEqual([
      false,
      false,
    ]);
    expect(frontGroup._objects[0]?.isGroundElement).toBe(true);
    expect(frontGroup._objects.slice(1, 3).every(
      (object: any) => object?.isContraventamentoElevation === true,
    )).toBe(true);
    expect(frontGroup._objects.slice(3).every(
      (object: any) => object?.isPilotiRect === true,
    )).toBe(true);
    expect(frontGroup.setCoords).toHaveBeenCalled();
  });

  it('usa o nível visual da elevação quando o snapshot externo está defasado', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_visual_nivel',
          contraventamentoCol: 0,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 2,
          contraventamentoSide: 'left',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
      ],
    });

    const createSideGroup = () => createMockGroup({
      houseSide: 'left',
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        {...createPilotiRect('piloti_0_0', 10, 100), pilotiNivel: 1.5},
        {...createPilotiRect('piloti_0_2', 10, 250), pilotiNivel: 1.5},
      ],
    });

    const staleSnapshotGroup = createSideGroup();
    const currentSnapshotGroup = createSideGroup();

    syncContraventamentoElevationViews(
      topGroup,
      [staleSnapshotGroup],
      () => 0,
    );

    syncContraventamentoElevationViews(
      topGroup,
      [currentSnapshotGroup],
      () => 1.5,
    );

    expect(getProjectionCoordinates(staleSnapshotGroup)).toEqual(
      getProjectionCoordinates(currentSnapshotGroup),
    );
  });

  it('mantém espessura proporcional nas projeções de elevação quando a vista é redimensionada', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_scaled_side',
          contraventamentoCol: 0,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 2,
          contraventamentoSide: 'left',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
      ],
    });

    const autoInsertedSideGroup = createMockGroup({
      houseSide: 'left',
      scaleX: 2,
      scaleY: 2,
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_0_2', 10, 250),
      ],
    });

    syncContraventamentoElevationViews(
      topGroup,
      [autoInsertedSideGroup],
      () => 0.4,
    );

    const projections = autoInsertedSideGroup._objects.filter(
      (object: any) => object?.isContraventamentoElevation === true,
    );

    expect(projections).toHaveLength(2);
    expect(projections.map((object: any) => object.strokeWidth)).toEqual([
      defaultElevationWidth + 2,
      defaultElevationWidth,
    ]);
    expect(projections.map((object: any) => object.strokeUniform)).toEqual([
      false,
      false,
    ]);
    expect(projections.map((object: any) => object.strokeWidth * autoInsertedSideGroup.scaleX)).toEqual([
      (defaultElevationWidth + 2) * 2,
      defaultElevationWidth * 2,
    ]);
  });

  it('mantém espessura proporcional do contraventamento horizontal em elevação de 6m redimensionada', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_scaled_front',
          contraventamentoOrientation: 'horizontal',
          contraventamentoRow: 0,
          contraventamentoStartCol: 0,
          contraventamentoEndCol: 3,
          contraventamentoSide: 'bottom',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
      ],
    });

    const autoInsertedFrontGroup = createMockGroup({
      houseSide: 'top',
      scaleX: 2,
      scaleY: 2,
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_3_0', 210, 250),
      ],
    });

    syncContraventamentoElevationViews(
      topGroup,
      [autoInsertedFrontGroup],
      () => 0.4,
    );

    const projections = autoInsertedFrontGroup._objects.filter(
      (object: any) => object?.isContraventamentoElevation === true,
    );

    expect(projections).toHaveLength(2);
    expect(projections.map((object: any) => object.strokeWidth)).toEqual([
      defaultElevationWidth + 2,
      defaultElevationWidth,
    ]);
    expect(projections.map((object: any) => object.strokeUniform)).toEqual([
      false,
      false,
    ]);
    expect(projections.map((object: any) => object.strokeWidth * autoInsertedFrontGroup.scaleX)).toEqual([
      (defaultElevationWidth + 2) * 2,
      defaultElevationWidth * 2,
    ]);
  });

  it('recalcula bounds da elevação ao sincronizar projeções de contraventamento', () => {
    const topGroup = createMockGroup({
      _objects: [
        {
          isContraventamento: true,
          contraventamentoId: 'contrav_initial_front_cache',
          contraventamentoOrientation: 'horizontal',
          contraventamentoRow: 0,
          contraventamentoStartCol: 0,
          contraventamentoEndCol: 3,
          contraventamentoSide: 'bottom',
          contraventamentoAnchorPilotiId: 'piloti_0_0',
        },
      ],
    });

    const initialFrontGroup = createMockGroup({
      houseSide: 'top',
      _clearCache: vi.fn(),
      _calcBounds: vi.fn(),
      _objects: [
        {isGroundElement: true, isGroundFill: true},
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_3_0', 210, 250),
      ],
    });

    syncContraventamentoElevationViews(
      topGroup,
      [initialFrontGroup],
      () => 1.5,
    );

    expect(initialFrontGroup._clearCache).toHaveBeenCalled();
    expect(initialFrontGroup._calcBounds).toHaveBeenCalled();
  });
});
