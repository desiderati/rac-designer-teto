import {describe, expect, it} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {createHouseTop} from './house-top.strategy.ts';
import type {CanvasObject} from '../../canvas.ts';
import {updatePilotiHeight, updatePilotiMaster} from '../../piloti.ts';

type PilotiNameLabelObject = CanvasObject & {
  isPilotiNameLabel?: boolean;
};

describe('house-top.strategy.ts', () => {
  it('exports createHouseTop function', () => {
    expect(typeof createHouseTop).toBe('function');
  });

  it('identifica todos os pilotis da planta por código com posição por linha', () => {
    const group = createHouseTop({width: 1000, height: 800} as FabricCanvas);
    const objects = group.getObjects() as PilotiNameLabelObject[];
    const nameLabels = objects.filter((object) => object.isPilotiNameLabel);

    expect(nameLabels.map((label) => String(label.text)).sort()).toEqual([
      'A1', 'B1', 'C1',
      'A2', 'B2', 'C2',
      'A3', 'B3', 'C3',
      'A4', 'B4', 'C4',
    ].sort());

    expect(nameLabels).toHaveLength(12);
    for (const label of nameLabels) {
      const circle = objects.find((object) => object.isPilotiCircle && object.pilotiId === label.pilotiId);
      expect(circle).toBeDefined();
      expect(label.selectable).toBe(false);
      expect(label.evented).toBe(false);

      const labelTop = Number(label.top ?? 0);
      const circleTop = Number(circle?.top ?? 0);
      const circleRadius = Number(circle?.radius ?? 0);
      const text = String(label.text);

      if (text.startsWith('C')) {
        expect(labelTop).toBeLessThan(circleTop - circleRadius);
      } else {
        expect(labelTop).toBeGreaterThan(circleTop + circleRadius);
      }
    }
  }, 30_000);

  it('mantém a identificação do piloti estável ao alterar altura e nível', () => {
    const group = createHouseTop({width: 1000, height: 800} as FabricCanvas);
    const objects = group.getObjects() as PilotiNameLabelObject[];
    const label = objects.find((object) => object.isPilotiNameLabel && object.pilotiId === 'piloti_0_0');

    expect(label).toBeDefined();
    const initialPosition = {left: label?.left, top: label?.top};

    updatePilotiHeight(group, 'piloti_0_0', 3);
    updatePilotiMaster(group, 'piloti_0_0', true, 0.6);

    expect(label?.text).toBe('A1');
    expect(label?.left).toBe(initialPosition.left);
    expect(label?.top).toBe(initialPosition.top);
  });
});

