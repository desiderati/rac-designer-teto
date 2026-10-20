import type {CanvasObject} from '../lib/canvas.ts';
import {createFabricCanvasDocumentPort} from './adapters/fabric-canvas-document-port.ts';
import {definedPilotis} from '@/test/defined-pilotis.ts';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {describe, expect, it} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {createHouseTop} from '../lib/factory/house/house-top.strategy.ts';
import {applyFieldAnalysisContraventamentos} from '../lib/field-analysis-contraventamentos.ts';
import {styleFieldAnalysisPilotis} from './HouseFieldAnalysisPreview.tsx';

describe('A-008 projeção isolada da Análise de Campo', () => {
  it('separa os IDs por linha e destaca as alturas sem sobrepor os círculos', () => {
    const group = createHouseTop({width: 960, height: 600} as FabricCanvas);
    const circles = styleFieldAnalysisPilotis(group);
    const objects = group.getObjects() as CanvasObject[];
    for (const circle of circles) {
      const label = objects.find((object) => object.isPilotiNameLabel && object.pilotiId === circle.pilotiId)!;
      const height = objects.find((object) => object.isPilotiText && object.pilotiId === circle.pilotiId)!;
      expect(label.top + label.height / 2).toBeLessThan(circle.top - Number(circle.radius));
      const nivel = objects.find((object) => object.isPilotiNivelText && object.pilotiId === circle.pilotiId)!;
      if (nivel.visible) {
        const row = Number(circle.pilotiId!.split('_')[2]);
        const gap = row === 0
          ? circle.top - Number(circle.radius) - nivel.top - nivel.height / 2
          : nivel.top - nivel.height / 2 - circle.top - Number(circle.radius);
        expect(gap).toBeCloseTo(4);
        if (row === 0) expect(label.top + label.height / 2).toBeLessThan(nivel.top - nivel.height / 2);
      }
      expect(height).toHaveProperty('fontWeight', 'bold');
    }
    const rowA = objects.filter(o => o.isPilotiNameLabel && o.pilotiId!.endsWith('_0'));
    expect(rowA).toHaveLength(4);
    rowA.forEach(label => expect(label.top).toBeCloseTo(rowA[0].top));
  });

  it('A-002/A-010 atualiza os pilotis de vistas existentes sem mover o grupo ou objetos externos', () => {
    const group = createHouseTop({width: 960, height: 600} as FabricCanvas);
    Object.assign(group, {myType: 'house', houseViewType: 'top', houseInstanceId: 'top'});
    const position = {left: group.left, top: group.top};
    const other = {myType: 'tree', left: 44};
    const port = createFabricCanvasDocumentPort({getObjects: () => [group, other], requestRenderAll() {}} as unknown as FabricCanvas);
    const house = HouseAggregate.createInitialHouseState({id: 'test', pilotiIds: getAllPilotiIds(), defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: 1});
    house.pilotis = definedPilotis(); house.pilotis.piloti_3_2 = {height: 2.5, nivel: 1, isMaster: true};
    port.applyHouseDefinition!(house, []);
    expect(group.left).toBe(position.left); expect(group.top).toBe(position.top);
    expect(other).toEqual({myType: 'tree', left: 44});
    expect((group.getObjects() as CanvasObject[]).find((object) => object.isPilotiCircle && object.pilotiId === 'piloti_3_2')!.pilotiHeight).toBe(2.5);
  });

  it('amplia 1,75× e preserva a tangência e a grade; o Canvas mantém o tamanho original', () => {
    const canvas = {width: 960, height: 600} as FabricCanvas;
    const original = createHouseTop(canvas);
    const projection = createHouseTop(canvas);
    const before = (original.getObjects() as CanvasObject[]).filter((object) => object.isPilotiCircle) as (CanvasObject & {radius: number})[];
    const circles = styleFieldAnalysisPilotis(projection, 'piloti_3_2');
    expect(circles).toHaveLength(12);
    for (const circle of circles) {
      const previous = before.find((entry) => entry.pilotiId === circle.pilotiId)!;
      expect(circle.radius).toBeCloseTo(previous.radius * 1.75);
      expect(circle.left).toBe(previous.left);
      if (circle.pilotiId!.endsWith('_0')) expect(circle.top - Number(circle.radius)).toBeCloseTo(previous.top - previous.radius);
      if (circle.pilotiId!.endsWith('_2')) expect(circle.top + Number(circle.radius)).toBeCloseTo(previous.top + previous.radius);
      if (circle.pilotiId!.endsWith('_1')) expect(circle.top).toBe(previous.top);
    }
    expect(circles.find((circle) => circle.pilotiId === 'piloti_3_2')!.stroke).toBe('#3b82f6');
    expect(before.every((circle) => circle.radius === before[0].radius)).toBe(true);
  });
  it('desenha as vigas tangentes aos círculos ampliados e deslocados da prévia', () => {
    const group = createHouseTop({width: 960, height: 600} as FabricCanvas);
    const circles = styleFieldAnalysisPilotis(group, 'piloti_0_0');
    applyFieldAnalysisContraventamentos(group, [
      {originPilotiId: 'piloti_0_0', destinationPilotiId: 'piloti_0_2', side: 'left', isAuto: false},
      {originPilotiId: 'piloti_0_0', destinationPilotiId: 'piloti_0_2', side: 'right', isAuto: true},
      {originPilotiId: 'piloti_0_0', destinationPilotiId: 'piloti_3_0', side: 'bottom', isAuto: false},
      {originPilotiId: 'piloti_0_2', destinationPilotiId: 'piloti_3_2', side: 'top', isAuto: false},
    ]);
    const beams = (group.getObjects() as CanvasObject[]).filter(o => o.isContraventamento);
    expect(beams).toHaveLength(4);
    for (const beam of beams) {
      const origin = circles.find(o => o.pilotiId === beam.contraventamentoAnchorPilotiId)!;
      const center = origin.getRelativeCenterPoint();
      const radius = Number(origin.radius);
      if (beam.contraventamentoOrientation === 'vertical') {
        const end = circles.find(o => o.pilotiId === 'piloti_0_2')!.getRelativeCenterPoint();
        expect(beam.left).toBeCloseTo(center.x + (beam.contraventamentoSide === 'left' ? -radius - beam.width : radius));
        expect(beam.top).toBeCloseTo(center.y);
        expect(beam.height).toBeCloseTo(end.y - center.y);
      } else {
        expect(beam.left).toBeCloseTo(center.x);
        expect(beam.top).toBeCloseTo(center.y + (beam.contraventamentoSide === 'top' ? -radius - beam.height : radius));
      }
    }
  });

});
