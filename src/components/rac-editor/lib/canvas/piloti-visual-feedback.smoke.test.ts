import {describe, expect, it} from 'vitest';
import {
  applyPilotiEditorCloseVisuals,
  applyPilotiSelectionVisuals,
  highlightAllHousePilotis,
  highlightPilotiAcrossViews,
} from './piloti-visual-feedback.ts';

function createPiloti(params: {
  pilotiId: string;
  isRect?: boolean;
  isMaster?: boolean;
}) {
  const state: Record<string, unknown> = {
    isPilotiCircle: !params.isRect,
    isPilotiRect: !!params.isRect,
    pilotiId: params.pilotiId,
    pilotiIsMaster: !!params.isMaster,
  };

  return {
    object: {
      ...state,
      set: (patch: Record<string, unknown>) => Object.assign(state, patch),
    },
    state,
  };
}

describe('piloti-visual-feedback utils', () => {
  it('highlights all pilotis in house groups', () => {
    const a = createPiloti({pilotiId: 'piloti_0_0'});
    const b = createPiloti({pilotiId: 'piloti_1_0', isRect: true});

    highlightAllHousePilotis([
      {
        type: 'group',
        myType: 'house',
        getObjects: () => [a.object, b.object],
      },
    ]);

    expect(a.state.stroke).toBe('#facc15');
    expect(a.state.strokeWidth).toBe(3);
    expect(b.state.stroke).toBe('#facc15');
    expect(b.state.strokeWidth).toBe(4);
  });

  it('highlights only target piloti across views', () => {
    const target = createPiloti({pilotiId: 'piloti_2_1'});
    const other = createPiloti({pilotiId: 'piloti_0_0', isRect: true});

    highlightPilotiAcrossViews(
      [
        {
          type: 'group',
          myType: 'house',
          getObjects: () => [target.object, other.object],
        },
      ],
      'piloti_2_1',
    );

    expect(target.state.stroke).toBe('#3b82f6');
    expect(target.state.strokeWidth).toBe(3);
    expect(other.state.stroke).toBeUndefined();
  });

  it('applies full selection visuals in one operation', () => {
    const target = createPiloti({pilotiId: 'piloti_2_1'});
    const other = createPiloti({pilotiId: 'piloti_0_0', isRect: true});

    applyPilotiSelectionVisuals(
      [
        {
          type: 'group',
          myType: 'house',
          getObjects: () => [target.object, other.object],
        },
      ],
      'piloti_2_1',
    );

    expect(target.state.stroke).toBe('#3b82f6');
    expect(target.state.strokeWidth).toBe(3);
    expect(other.state.stroke).toBe('#facc15');
    expect(other.state.strokeWidth).toBe(4);
  });

  it('restores visuals according to selection and master status', () => {
    const normal = createPiloti({pilotiId: 'piloti_1_1'});
    const masterRect = createPiloti({pilotiId: 'piloti_0_0', isRect: true, isMaster: true});

    applyPilotiEditorCloseVisuals({
      groupObjects: [normal.object, masterRect.object],
      houseStillSelected: false,
    });

    expect(normal.state.stroke).toBe('#333');
    expect(normal.state.strokeWidth).toBe(1.5);
    expect(masterRect.state.stroke).toBe('#8b4513');
    expect(masterRect.state.strokeWidth).toBe(4);

    applyPilotiEditorCloseVisuals({
      groupObjects: [normal.object, masterRect.object],
      houseStillSelected: true,
    });

    expect(normal.state.stroke).toBe('#facc15');
    expect(masterRect.state.stroke).toBe('#facc15');
  });
});
