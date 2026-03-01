import {describe, expect, it} from 'vitest';
import {
  createNivelLabelBackgroundPatch,
  createPilotiHeightTextPatch,
  createPilotiSizeLabelPatch,
  createPilotiVisualDataPatch,
} from './piloti-visual.ts';

describe('house-piloti-visual use cases', () => {
  it('creates visual data patch for master rect piloti', () => {
    expect(
      createPilotiVisualDataPatch({
        height: 2,
        isMaster: true,
        nivel: 0.8,
        isRect: true,
        baseHeight: 60,
        masterFill: '#fef08a',
        masterStroke: '#ca8a04',
      }),
    ).toEqual({
      pilotiHeight: 2,
      pilotiIsMaster: true,
      pilotiNivel: 0.8,
      height: 120,
      scaleY: 1,
      fill: '#fef08a',
      stroke: '#ca8a04',
      strokeWidth: 4,
    });
  });

  it('creates visual data patch for non-master circle piloti', () => {
    expect(
      createPilotiVisualDataPatch({
        height: 1.2,
        isMaster: false,
        nivel: 0.3,
        isRect: false,
        baseHeight: 60,
        masterFill: '#fef08a',
        masterStroke: '#ca8a04',
      }),
    ).toEqual({
      pilotiHeight: 1.2,
      pilotiIsMaster: false,
      pilotiNivel: 0.3,
    });
  });

  it('creates patches for piloti height text, size label and nivel label background', () => {
    expect(createPilotiHeightTextPatch('2,00')).toEqual({text: '2,00'});
    expect(createPilotiSizeLabelPatch('2,00')).toEqual({text: '2,00', backgroundColor: '#fff'});
    expect(createNivelLabelBackgroundPatch()).toEqual({backgroundColor: '#fff'});
  });
});
