import {describe, expect, it} from 'vitest';
import {getViewLabelForHouseType} from './house-view-label-use-cases.ts';

describe('house-view-label use cases', () => {
  it('returns canonical labels for each view type', () => {
    expect(getViewLabelForHouseType('top', 'tipo6')).toBe('Planta');
    expect(getViewLabelForHouseType('front', 'tipo6')).toBe('Frontal');
    expect(getViewLabelForHouseType('side1', 'tipo6')).toBe('Quadrado Fechado');
    expect(getViewLabelForHouseType('side2', 'tipo3')).toBe('Quadrado Aberto');
  });

  it('returns contextual label for back view based on house type', () => {
    expect(getViewLabelForHouseType('back', 'tipo6')).toBe('Traseira');
    expect(getViewLabelForHouseType('back', 'tipo3')).toBe('Lateral');
    expect(getViewLabelForHouseType('back', null)).toBe('Traseira');
  });
});
