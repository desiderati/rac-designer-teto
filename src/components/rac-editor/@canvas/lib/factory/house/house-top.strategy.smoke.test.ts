import {describe, expect, it} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {createHouseTop} from './house-top.strategy.ts';
import type {CanvasObject} from '../../canvas.ts';
import {updatePilotiHeight, updatePilotiMaster} from '../../piloti.ts';
import {HOUSE_2D_STYLE} from '@/shared/config.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  calculateTopSlopeIndicatorGeometry,
  createTopSlopeIndicatorObjects,
  normalizeSlopeLabelAngle,
} from '@/components/rac-editor/@canvas/lib/house-top-slope-indicator.ts';
import {DEFAULT_HOUSE_PILOTI, type HousePiloti} from '@/shared/types/house.ts';

type PilotiNameLabelObject = CanvasObject & {
  isPilotiNameLabel?: boolean;
};

type TopSlopeIndicatorObject = CanvasObject & {
  isTopSlopeIndicator?: boolean;
  isTopSlopeIndicatorText?: boolean;
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
      expect(circle?.strokeWidth).toBe(HOUSE_2D_STYLE.outlineStrokeWidth);
      expect(circle?.strokeUniform).toBe(true);
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
    const masterCircle = objects.find((object) => object.isPilotiCircle && object.pilotiId === 'piloti_0_0');

    expect(label?.text).toBe('A1');
    expect(label?.left).toBe(initialPosition.left);
    expect(label?.top).toBe(initialPosition.top);
    expect(masterCircle?.strokeWidth).toBe(HOUSE_2D_STYLE.outlineStrokeWidth);
    expect(masterCircle?.strokeUniform).toBe(true);
  });

  it('renderiza a seta de desnível atrás da vista planta quando os níveis variam', () => {
    const group = createHouseTop({width: 1000, height: 800} as FabricCanvas);

    expect((group.getObjects() as TopSlopeIndicatorObject[])
      .filter((object) => object.isTopSlopeIndicator)).toHaveLength(0);

    applyPilotiDataToGroup(group, createPilotisWithSlope());

    const objects = group.getObjects() as TopSlopeIndicatorObject[];
    const houseBodyIndex = objects.findIndex((object) => object.isHouseBody);
    const houseBody = objects.find((object) => object.isHouseBody);
    const geometry = calculateTopSlopeIndicatorGeometry(group);
    const slopeObjects = objects.filter((object) => object.isTopSlopeIndicator);
    const slopeArrow = slopeObjects.find((object) => !object.isTopSlopeIndicatorText);
    const slopeText = slopeObjects.find((object) => object.isTopSlopeIndicatorText);

    expect(slopeObjects).toHaveLength(2);
    expect(objects.indexOf(slopeArrow!)).toBe(houseBodyIndex + 1);
    expect(objects.indexOf(slopeText!)).toBe(houseBodyIndex + 2);
    expect(slopeArrow?.selectable).toBe(false);
    expect(slopeArrow?.evented).toBe(false);
    expect(slopeArrow?.opacity).toBe(0.07);
    expect(geometry?.width).toBeCloseTo(
      Math.min(Number(houseBody?.width), Number(houseBody?.height)) * 0.051,
      5,
    );
    expect(slopeText?.text).toBe('Desnível 0,70 m');
    expect(slopeText?.opacity).toBe(slopeArrow?.opacity);
  });

  it('mantém a cabeça da seta de desnível estável quando só o comprimento muda', () => {
    const [shortArrow] = createTopSlopeIndicatorObjects({
      angle: 0,
      length: 120,
      width: 16,
      desnivel: 0.7,
    }) as Array<CanvasObject & {points?: Array<{ x: number; y: number }> }>;
    const [longArrow] = createTopSlopeIndicatorObjects({
      angle: 0,
      length: 240,
      width: 16,
      desnivel: 0.7,
    }) as Array<CanvasObject & {points?: Array<{ x: number; y: number }> }>;

    const getHeadLength = (points: Array<{ x: number; y: number }>) => points[3].x - points[1].x;
    const getHeadWidth = (points: Array<{ x: number; y: number }>) => points[4].y - points[2].y;

    expect(shortArrow.points).toBeDefined();
    expect(longArrow.points).toBeDefined();
    expect(getHeadLength(shortArrow.points!)).toBeCloseTo(getHeadLength(longArrow.points!), 5);
    expect(getHeadLength(shortArrow.points!)).toBeCloseTo(31.2, 5);
    expect(getHeadWidth(shortArrow.points!)).toBeCloseTo(42, 5);
  });

  it('inverte a leitura do texto quando a seta de desnível aponta para trás', () => {
    expect(normalizeSlopeLabelAngle(45)).toBe(45);
    expect(normalizeSlopeLabelAngle(170)).toBe(-10);
    expect(normalizeSlopeLabelAngle(-170)).toBe(10);
  });
});

function createPilotisWithSlope(): Record<string, HousePiloti> {
  const pilotis: Record<string, HousePiloti> = {};

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      pilotis[`piloti_${col}_${row}`] = {
        ...DEFAULT_HOUSE_PILOTI,
        nivel: 0.2 + (col * 0.1) + (row * 0.2),
      };
    }
  }

  return pilotis;
}

