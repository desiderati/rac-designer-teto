import {describe, expect, it} from 'vitest';
import {parseContraventamentosFromTopView} from '@/components/rac-editor/@viewer-3d/lib/parsers/contraventamento-parser.ts';

describe('contraventamento-parser.ts', () => {
  it('parses and normalizes valid contraventamento projections', () => {
    const parsed = parseContraventamentosFromTopView({
      contraventamentos: [
        {
          id: 'c-1',
          orientation: 'vertical',
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
        orientation: 'vertical',
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
        orientation: 'vertical',
        col: 0,
        startRow: 0,
        endRow: 2,
        side: 'right',
        anchorPilotiId: 'piloti_0_0',
      },
    ]);
  });

  it('parses horizontal contraventamento projections', () => {
    const parsed = parseContraventamentosFromTopView({
      contraventamentos: [
        {
          id: 'h-1',
          orientation: 'horizontal',
          row: 1,
          startCol: 3,
          endCol: 0,
          side: 'bottom',
          anchorPilotiId: 'piloti_3_1',
        },
      ],
    });

    expect(parsed).toEqual([
      {
        id: 'h-1',
        orientation: 'horizontal',
        row: 1,
        startCol: 0,
        endCol: 3,
        side: 'bottom',
        anchorPilotiId: 'piloti_3_1',
      },
    ]);
  });

  it('aplica fallback de lado horizontal permitido pela linha', () => {
    const parsed = parseContraventamentosFromTopView({
      contraventamentos: [
        {
          id: 'h-2',
          orientation: 'horizontal',
          row: 0,
          startCol: 0,
          endCol: 3,
          side: 'top',
        },
      ],
    });

    expect(parsed).toEqual([
      {
        id: 'h-2',
        orientation: 'horizontal',
        row: 0,
        startCol: 0,
        endCol: 3,
        side: 'bottom',
        anchorPilotiId: 'piloti_0_0',
      },
    ]);
  });
});
