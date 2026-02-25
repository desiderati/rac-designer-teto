import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Canvas as FabricCanvas, Group} from 'fabric';
import {getHouseViewStrategy} from '@/components/lib/canvas';
import {createHouseGroupForView} from './house-view-creation.ts';

vi.mock('@/components/lib/canvas', () => ({
  getHouseViewStrategy: vi.fn(),
}));

describe('house-view-creation utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates top/front/back creation with expected flags', () => {
    const canvas = {} as unknown as FabricCanvas;
    const topGroup = {id: 'top'} as unknown as Group;
    const frontGroup = {id: 'front'} as unknown as Group;
    const backGroup = {id: 'back'} as unknown as Group;

    const topStrategyCreate = vi.fn(() => topGroup);
    const frontStrategyCreate = vi.fn(() => frontGroup);
    const backStrategyCreate = vi.fn(() => backGroup);

    vi.mocked(getHouseViewStrategy)
      .mockReturnValueOnce({create: topStrategyCreate})
      .mockReturnValueOnce({create: frontStrategyCreate})
      .mockReturnValueOnce({create: backStrategyCreate});

    expect(
      createHouseGroupForView({
        canvas,
        viewType: 'top',
      }),
    ).toBe(topGroup);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: 'front',
        side: 'top',
      }),
    ).toBe(frontGroup);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: 'back',
        side: 'bottom',
      }),
    ).toBe(backGroup);

    expect(getHouseViewStrategy).toHaveBeenNthCalledWith(1, 'top');
    expect(getHouseViewStrategy).toHaveBeenNthCalledWith(2, 'front');
    expect(getHouseViewStrategy).toHaveBeenNthCalledWith(3, 'back');
    expect(topStrategyCreate).toHaveBeenNthCalledWith(1, canvas, {side: undefined});
    expect(frontStrategyCreate).toHaveBeenNthCalledWith(1, canvas, {side: 'top'});
    expect(backStrategyCreate).toHaveBeenNthCalledWith(1, canvas, {side: 'bottom'});
  });

  it('delegates side creation with expected orientation flags', () => {
    const canvas = {} as unknown as FabricCanvas;
    const side1Group = {id: 'side1'} as unknown as Group;
    const side2Group = {id: 'side2'} as unknown as Group;

    const side1StrategyCreate = vi.fn(() => side1Group);
    const side2StrategyCreate = vi.fn(() => side2Group);

    vi.mocked(getHouseViewStrategy)
      .mockReturnValueOnce({create: side1StrategyCreate})
      .mockReturnValueOnce({create: side2StrategyCreate});

    expect(
      createHouseGroupForView({
        canvas,
        viewType: 'side1',
        side: 'right',
      }),
    ).toBe(side1Group);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: 'side2',
        side: 'left',
      }),
    ).toBe(side2Group);

    expect(getHouseViewStrategy).toHaveBeenNthCalledWith(1, 'side1');
    expect(getHouseViewStrategy).toHaveBeenNthCalledWith(2, 'side2');
    expect(side1StrategyCreate).toHaveBeenNthCalledWith(1, canvas, {side: 'right'});
    expect(side2StrategyCreate).toHaveBeenNthCalledWith(1, canvas, {side: 'left'});
  });
});
