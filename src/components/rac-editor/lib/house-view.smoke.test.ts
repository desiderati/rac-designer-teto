import {describe, expect, it, vi} from 'vitest';
import {
  createHouseGroupForView,
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
  getViewLabelForHouseType,
} from './house-view.ts';

const createMock = vi.fn(() => ({id: 'group'}));

vi.mock('@/components/rac-editor/lib/canvas', () => ({
  getHouseViewStrategy: () => ({
    create: createMock,
  }),
}));

describe('house-view helpers', () => {
  it('creates metadata and controls patches', () => {
    expect(createViewGroupMetadataPatch({viewType: 'top', instanceId: 'top_1'})).toEqual({
      houseViewType: 'top',
      houseInstanceId: 'top_1',
      houseSide: undefined,
    });
    expect(createViewGroupControlsVisibilityPatch()).toEqual({mt: false, mb: false, ml: false, mr: false});
  });

  it('extracts removal hints from metadata', () => {
    expect(extractViewGroupRemovalHints({houseViewType: 'front', houseInstanceId: 'front_1'})).toEqual({
      viewType: 'front',
      instanceId: 'front_1',
    });
  });

  it('maps view labels according to house type', () => {
    expect(getViewLabelForHouseType('back', 'tipo3')).toBe('Lateral');
    expect(getViewLabelForHouseType('back', 'tipo6')).toBe('Traseira');
  });

  it('delegates group creation to view strategy', () => {
    const canvas = {width: 1000, height: 800} as any;
    const group = createHouseGroupForView({canvas, viewType: 'top'});
    expect(group).toEqual({id: 'group'});
    expect(createMock).toHaveBeenCalledWith(canvas, {side: undefined});
  });
});
