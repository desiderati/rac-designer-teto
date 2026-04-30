import {describe, expect, it} from 'vitest';
import {parseContraventamentosFromTopView} from '@/components/rac-editor/viewer3d/lib/contraventamento-parser.ts';

describe('contraventamento-parser.ts', () => {
  it('parses and normalizes valid contraventamento projections', () => {
    const parsed = parseContraventamentosFromTopView({
      contraventamentos: [
        {
          id: 'c-1',
          col: 2,
          startRow: 2,
          endRow: 0,
          side: 'left',
          anchorPilotiId: 'piloti_2_2',
        },
      ],
    });

    expect(parsed).toEqual([
      {
        id: 'c-1',
        col: 2,
        startRow: 0,
        endRow: 2,
        side: 'left',
        anchorPilotiId: 'piloti_2_2',
      },
    ]);
  });

  it('ignores invalid projections and applies fallbacks', () => {
    const parsed = parseContraventamentosFromTopView({
      contraventamentos: [
        {
          col: 4,
          startRow: 0,
          endRow: 1,
        },
        {
          col: 1,
          startRow: 1,
          endRow: 1,
        },
        {
          col: 0,
          startRow: 0,
          endRow: 2,
          side: 'unknown',
        },
      ],
    });

    expect(parsed).toEqual([
      {
        id: 'contrav_3d_2',
        col: 0,
        startRow: 0,
        endRow: 2,
        side: 'right',
        anchorPilotiId: 'piloti_0_0',
      },
    ]);
  });
});
