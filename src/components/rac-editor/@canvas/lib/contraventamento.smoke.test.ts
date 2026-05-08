import {describe, expect, it, vi} from 'vitest';
import {
  syncContraventamentoElevationViews
} from '@/components/rac-editor/@canvas/lib/contraventamento.ts';
import {
  createContraventamentoEditorState,
  getContraventamentoSideLabel,
  resolveContraventamentoOffsetFromNivel
} from '@/shared/types/contraventamento.ts';
import {
  collectOccupiedContraventamentoSides,
  getContraventamentoColumnCenterX,
  inferContraventamentoSide,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';
import {isPilotiOutOfProportion, parsePilotiGridPosition} from '@/shared/types/piloti.ts';

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

describe('contraventamento.ts', () => {
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
    ).toEqual({leftDisabled: false, rightDisabled: true, leftActive: true, rightActive: false});

    expect(
      createContraventamentoEditorState({
        canReceiveContraventamento: false,
        occupiedSides: {left: false, right: false},
      }),
    ).toEqual({leftDisabled: true, rightDisabled: true, leftActive: false, rightActive: false});
  });

  it('projects contraventamento in side views using legacy and houseSide metadata', () => {
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
        createPilotiRect('piloti_0_0', 10, 100),
        createPilotiRect('piloti_0_2', 10, 250),
      ],
    });

    const modernRightGroup = createMockGroup({
      houseSide: 'right',
      _objects: [
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
    expect(legacyLeftGroup.setCoords).toHaveBeenCalled();
    expect(modernRightGroup.setCoords).toHaveBeenCalled();
  });
});

