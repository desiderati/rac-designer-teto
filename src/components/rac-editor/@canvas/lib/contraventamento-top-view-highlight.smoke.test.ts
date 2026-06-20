import {describe, expect, it, vi} from 'vitest';
import {PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/shared/config.ts';
import {highlightEligibleContraventamentoPilotis} from '@/components/rac-editor/@canvas/lib/contraventamento-top-view-highlight.ts';

type PilotiCircleFake = {
  dirty: boolean;
  isPilotiCircle: true;
  pilotiId: string;
  stroke?: string;
  strokeWidth?: number;
  strokeUniform?: boolean;
  set: ReturnType<typeof vi.fn>;
};

function createPilotiCircle(pilotiId: string): PilotiCircleFake {
  return {
    dirty: false,
    isPilotiCircle: true,
    pilotiId,
    set: vi.fn(function set(this: Record<string, unknown>, patch: Record<string, unknown>) {
      Object.assign(this, patch);
    }),
  };
}

describe('contraventamento-top-view-highlight', () => {
  it('keeps focused eligible pilotis with active top-view border behavior', () => {
    const target = createPilotiCircle('piloti_1_1');
    const other = createPilotiCircle('piloti_2_1');
    const requestRenderAll = vi.fn();
    const group = {
      getCanvasObjects: () => [target, other],
      canvas: {requestRenderAll},
    };

    highlightEligibleContraventamentoPilotis(
      group as never,
      pilotiId => pilotiId === target.pilotiId,
      undefined,
      undefined,
      1,
    );

    expect(target.stroke).toBe(PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor);
    expect(target.strokeWidth).toBe(PILOTI_STYLE.selectedStrokeWidthTopView);
    expect(target.strokeUniform).toBe(false);
    expect(other.strokeUniform).toBe(true);
    expect(requestRenderAll).toHaveBeenCalledTimes(1);
  });
});
