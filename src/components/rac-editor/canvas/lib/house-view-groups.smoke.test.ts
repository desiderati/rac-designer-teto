import {describe, expect, it, vi} from 'vitest';
import {createHouseGroupForView} from './house-view-groups.ts';

const createMock = vi.fn(() => ({id: 'group'}));

vi.mock('@/components/rac-editor/canvas/lib', () => ({
  getHouseViewStrategy: () => ({
    create: createMock,
  }),
}));

describe('house-view-groups.ts', () => {
  it('delegates group creation to the canvas view strategy', () => {
    const canvas = {width: 1000, height: 800} as any;
    const group = createHouseGroupForView({canvas, viewType: 'top'});
    expect(group).toEqual({id: 'group'});
    expect(createMock).toHaveBeenCalledWith(canvas, {side: undefined});
  });
});
