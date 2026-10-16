import {describe, expect, it, vi} from 'vitest';
import {ActiveSelection, Canvas, FabricImage, IText, Rect} from 'fabric';
import {createHouseTop} from '../../lib/factory/house/house-top.strategy.ts';
import {getElementStrategy} from '../../lib/factory/elements/index.ts';
import {createFabricCanvasDocumentPort} from './fabric-canvas-document-port.ts';

describe('persistência das posições com seleção múltipla', () => {
  it.each(['sem seleção', 'seleção múltipla', 'seleção transformada', 'seleção espelhada', 'seleção inclinada'])(
    'mantém a planta e os elementos no lugar ao salvar e reabrir: %s', async (scenario) => {
      const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
      const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
      try {
        const plant = createHouseTop({width: 1200, height: 800} as never);
        plant.set({left: 350, top: 240});
        plant.houseInstanceId = 'planta-persistida';
        plant.houseViewType = 'top';
        const road = getElementStrategy('dirtRoad').create(source)!;
        road.set({left: 1100, top: 280, angle: 17});
        const entry = getElementStrategy('entryLeft').create(source)!;
        entry.set({left: 900, top: 400, flipX: true});
        const fence = getElementStrategy('fence').create(source)!;
        fence.set({left: 400, top: 1000});
        const annotation = new IText('Terreno vizinho', {left: 380, top: 1100});
        const unselected = new Rect({left: 1500, top: 900, width: 60, height: 40});
        source.add(plant, road, entry, fence, annotation, unselected);
        const selected = [plant, road, entry, fence, annotation];
        let selection: ActiveSelection | undefined;
        if (scenario !== 'sem seleção') {
          selection = new ActiveSelection(selected, {canvas: source});
          source.setActiveObject(selection);
          if (scenario === 'seleção transformada') {
            selection.set({left: 520, top: 350, angle: 23, scaleX: 1.3, scaleY: 0.8});
          }
          if (scenario === 'seleção espelhada') selection.set({flipX: true, angle: 30});
          if (scenario === 'seleção inclinada') selection.set({skewX: 15, skewY: 8});
        }
        source.setViewportTransform([0.5, 0, 0, 0.5, -80, -60]);
        const before = source.getObjects().map(object => ({
          matrix: object.calcTransformMatrix(),
          left: object.left,
          top: object.top,
          group: object.group,
        }));
        const pilotiCenters = plant.getObjects().filter(object => 'isPilotiCircle' in object && object.isPilotiCircle)
          .map(object => object.getCenterPoint());
        const sourcePort = createFabricCanvasDocumentPort(source);
        let saved = sourcePort.exportCanvasDocument();
        expect(sourcePort.exportCanvasDocument()).toEqual(saved);
        // O autosave deve preservar a seleção e a geometria do editor vivo.
        expect(source.getActiveObject()).toBe(selection);
        source.getObjects().forEach((object, index) => {
          expect(object.left).toBe(before[index].left);
          expect(object.top).toBe(before[index].top);
          expect(object.group).toBe(before[index].group);
          expect(object.calcTransformMatrix()).toEqual(before[index].matrix);
        });
        const targetPort = createFabricCanvasDocumentPort(target);
        for (let iteration = 0; iteration < 3; iteration += 1) {
          expect(await targetPort.loadCanvasDocument(JSON.parse(JSON.stringify(saved)))).toBe(true);
          expect(target.getObjects()).toHaveLength(before.length);
          target.getObjects().forEach((object, index) => {
            object.calcTransformMatrix().forEach((value, component) => {
              expect(value, `${scenario}, objeto ${index}, matriz ${component}, ciclo ${iteration}`)
                .toBeCloseTo(before[index].matrix[component], 2);
            });
          });
          const restoredPlant = target.getObjects()[0] as typeof plant;
          restoredPlant.getObjects().filter(object => 'isPilotiCircle' in object && object.isPilotiCircle)
            .forEach((object, index) => {
              expect(object.getCenterPoint().x).toBeCloseTo(pilotiCenters[index].x, 2);
              expect(object.getCenterPoint().y).toBeCloseTo(pilotiCenters[index].y, 2);
            });
          saved = targetPort.exportCanvasDocument();
        }
        expect(saved.objects[0].metadata?.houseInstanceId).toBe('planta-persistida');
      } finally {
        await source.dispose();
        await target.dispose();
      }
    },
  );

  it('salva imagens selecionadas sem acessar pixels nem serializar a imagem pelo Fabric', async () => {
    const canvas = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      const image = new FabricImage(document.createElement('canvas'), {
        left: 700, top: 500, width: 80, height: 60, angle: 12,
      });
      const imageSerialization = vi.spyOn(image, 'toObject').mockImplementation(() => {
        throw new DOMException('Canvas contaminado', 'SecurityError');
      });
      const rect = new Rect({left: 500, top: 400, width: 40, height: 30});
      canvas.add(rect, image);
      canvas.setActiveObject(new ActiveSelection([rect, image], {canvas}));
      const before = image.getXY();
      const exported = createFabricCanvasDocumentPort(canvas).exportCanvasDocument();
      expect(exported.objects[1].geometry?.left).toBeCloseTo(before.x);
      expect(exported.objects[1].geometry?.top).toBeCloseTo(before.y);
      expect(imageSerialization).not.toHaveBeenCalled();
    } finally {
      await canvas.dispose();
      vi.restoreAllMocks();
    }
  });
});
