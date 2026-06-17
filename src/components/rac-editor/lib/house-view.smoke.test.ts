import {describe, expect, it} from 'vitest';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
  getElevationViewLabelForHouseType,
  getViewLabelForHouseType,
} from './house-view.ts';

describe('house-view.ts', () => {
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
    expect(getViewLabelForHouseType('back', 'tipo6')).toBe('Posterior');
    expect(getViewLabelForHouseType('side1', 'tipo6')).toBe('Lateral');
  });

  it('maps elevation labels using house type and plant side', () => {
    expect(getElevationViewLabelForHouseType({
      houseType: 'tipo6',
      viewType: 'front',
      side: 'bottom',
    })).toBe('Frontal');
    expect(getElevationViewLabelForHouseType({
      houseType: 'tipo6',
      viewType: 'side1',
      side: 'left',
    })).toBe('Lateral Esquerda');
    expect(getElevationViewLabelForHouseType({
      houseType: 'tipo3',
      viewType: 'side2',
      side: 'right',
    })).toBe('Quadrado Aberto');
    expect(getElevationViewLabelForHouseType({
      houseType: 'tipo3',
      viewType: 'back',
      side: 'bottom',
    })).toBe('Lateral Direita');
  });

});

