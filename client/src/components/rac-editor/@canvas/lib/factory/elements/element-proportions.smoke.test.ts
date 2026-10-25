import {describe, expect, it} from 'vitest';
import {Canvas, IText, Path} from 'fabric';
import type {CanvasGroup, CanvasObject} from '../../canvas.ts';
import {createFabricCanvasDocumentPort} from '../../../ui/adapters/fabric-canvas-document-port.ts';
import {getElementStrategy, type ElementStrategyKey} from './index.ts';

const surface = {width: 1000, height: 800} as Canvas;
const create = (key: ElementStrategyKey) => getElementStrategy(key).create(surface) as CanvasGroup;
const labels = (object: CanvasGroup) => object.getCanvasObjects().find(child => child.myType === 'siteLabel') as IText;
const body = (object: CanvasGroup) => object.getCanvasObjects().find(child => child.myType === 'siteBody')!;
const cornerTypes = ['siteHouse', 'buildingTop', 'buildingBottom', 'buildingLeft', 'buildingRight',
  'entryUp', 'entryDown', 'entryLeft', 'entryRight', 'tree', 'water', 'fossa'] as const;

function expectCornersOnly(object: CanvasGroup) {
  for (const control of ['mt', 'mb', 'ml', 'mr']) expect(object.isControlVisible(control)).toBe(false);
  for (const control of ['tl', 'tr', 'bl', 'br', 'mtr']) expect(object.isControlVisible(control)).toBe(true);
}

describe('proporções e controles dos elementos', () => {
  it.each(cornerTypes)('oferece somente cantos para redimensionar %s', key => {
    expectCornersOnly(create(key));
  });

  it('restaura a restrição dos seis tipos ao reabrir, sem restringir Cerca e Estrada', async () => {
    const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      cornerTypes.forEach(key => source.add(create(key)));
      source.add(create('fence'), create('dirtRoad'));
      await createFabricCanvasDocumentPort(target).loadCanvasDocument(
        createFabricCanvasDocumentPort(source).exportCanvasDocument(),
      );
      const restored = target.getObjects() as CanvasGroup[];
      restored.slice(0, cornerTypes.length).forEach(expectCornersOnly);
      restored.slice(cornerTypes.length).forEach(object => expect(object.isControlVisible('mr')).toBe(true));
    } finally { await source.dispose(); await target.dispose(); }
  });

  it('usa texto maior nas verticais, acima da seta para baixo, e o mesmo intervalo nas laterais', () => {
    const up = create('entryUp'), down = create('entryDown'), left = create('entryLeft'), right = create('entryRight');
    expect(labels(up).fontSize).toBeGreaterThan(labels(left).fontSize);
    expect(labels(down).fontSize).toBe(labels(up).fontSize);
    const gapBelow = (object: CanvasGroup) => {
      const arrow = body(object).getBoundingRect();
      return labels(object).getBoundingRect().top - arrow.top - arrow.height;
    };
    const downBody = body(down).getBoundingRect(), downLabel = labels(down).getBoundingRect();
    const gapAbove = downBody.top - downLabel.top - downLabel.height;
    expect(gapAbove).toBeGreaterThan(0);
    expect(gapAbove).toBeCloseTo(gapBelow(up));
    expect(gapBelow(left)).toBeCloseTo(gapBelow(up));
    expect(gapBelow(right)).toBeCloseTo(gapBelow(up));
  });

  it.each(['buildingTop', 'buildingBottom', 'buildingLeft', 'buildingRight'] as const)(
    'mantém o contorno de %s contínuo nas quatro quinas', key => {
      const shell = body(create(key)) as CanvasGroup;
      const walls = shell.getObjects().find(child => (child as CanvasObject).myType === 'siteBody') as Path;
      expect(walls.path.filter(command => command[0] === 'M')).toHaveLength(1);
    },
  );

  it('encontra diagonais e borda no mesmo ponto e mantém traço não escalável no SVG da Casa', () => {
    const house = create('siteHouse'), roof = body(house), center = roof.getRelativeCenterPoint();
    const diagonal = house.getCanvasObjects().find(child => child.type === 'line' && child.x1 === 0 && child.y1 === 0)!;
    const midpoint = diagonal.getRelativeCenterPoint();
    const ridge = house.getCanvasObjects().find(child => child.type === 'line' && child.x1 > 0 && child.y1 === child.y2)!;
    const ridgeCenter = ridge.getRelativeCenterPoint();
    // As extremidades conectam a quina à cumeeira, inclusive com a altura interna do telhado.
    expect(midpoint.x - diagonal.width / 2).toBeCloseTo(center.x - roof.width / 2, 6);
    expect(midpoint.y - diagonal.height / 2).toBeCloseTo(center.y - roof.height / 2, 6);
    expect(midpoint.x + diagonal.width / 2).toBeCloseTo(ridgeCenter.x - ridge.width / 2, 6);
    expect(midpoint.y + diagonal.height / 2).toBeCloseTo(ridgeCenter.y, 6);
    house.set({scaleX: 4, scaleY: 4});
    expect(diagonal.toSVG()).toContain('non-scaling-stroke');
    expect(roof.toSVG()).toContain('non-scaling-stroke');
  });

  it('corrige contorno e texto antigos sem deslocar o corpo ou perder nome e transformação', async () => {
    const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      const room = create('buildingLeft'), entry = create('entryDown');
      room.set({scaleX: 3, scaleY: 3, angle: 30, flipX: true});
      labels(room).set({text: 'Depósito'});
      const walls = (body(room) as CanvasGroup).getObjects().find(child => (child as CanvasObject).myType === 'siteBody') as Path;
      walls.set({path: new Path(`M0 0 H${walls.width} V${walls.height} H${walls.width / 2 + 20} M${walls.width / 2 - 20} ${walls.height} H0 V0`).path});
      expect(walls.path.filter(command => command[0] === 'M')).toHaveLength(2);
      labels(entry).set({fontSize: 15, top: body(entry).getRelativeCenterPoint().y + 70, text: 'Acesso'});
      source.add(room, entry);
      const anchors = [room, entry].map(item => body(item).getCenterPoint());
      await createFabricCanvasDocumentPort(target).loadCanvasDocument(
        createFabricCanvasDocumentPort(source).exportCanvasDocument(),
      );
      const [restoredRoom, restoredEntry] = target.getObjects() as CanvasGroup[];
      expect(labels(restoredRoom).text).toBe('Depósito');
      expect(restoredRoom.angle).toBe(30); expect(restoredRoom.flipX).toBe(true);
      const restoredWalls = (body(restoredRoom) as CanvasGroup).getObjects().find(child => (child as CanvasObject).myType === 'siteBody') as Path;
      expect(restoredWalls.path.filter(command => command[0] === 'M')).toHaveLength(1);
      expect(labels(restoredEntry).text).toBe('Acesso');
      const labelBox = labels(restoredEntry).getBoundingRect(), arrowBox = body(restoredEntry).getBoundingRect();
      expect(labelBox.top + labelBox.height).toBeLessThan(arrowBox.top);
      [restoredRoom, restoredEntry].forEach((item, index) => {
        expect(body(item).getCenterPoint().x).toBeCloseTo(anchors[index].x);
        expect(body(item).getCenterPoint().y).toBeCloseTo(anchors[index].y);
      });
    } finally { await source.dispose(); await target.dispose(); }
  });

  it('mantém o desenho do telhado após salvar e reabrir, inclusive repetidamente', async () => {
    const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      const house = create('siteHouse'); house.set({scaleX: 3, scaleY: 3, angle: 20}); source.add(house);
      const positions = house.getCanvasObjects().map(child => child.getCenterPoint());
      let document = createFabricCanvasDocumentPort(source).exportCanvasDocument();
      for (let iteration = 0; iteration < 3; iteration++) {
        await createFabricCanvasDocumentPort(target).loadCanvasDocument(document);
        const restored = target.getObjects()[0] as CanvasGroup;
        restored.getCanvasObjects().forEach((child, i) => {
          expect(child.getCenterPoint().x).toBeCloseTo(positions[i].x);
          expect(child.getCenterPoint().y).toBeCloseTo(positions[i].y);
        });
        document = createFabricCanvasDocumentPort(target).exportCanvasDocument();
      }
    } finally { await source.dispose(); await target.dispose(); }
  });

  it('faz detalhes da estrada crescerem menos que o terreno, inclusive após reabrir', async () => {
    const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      const road = create('dirtRoad'); source.add(road);
      const texture = road.getCanvasObjects().find(child => child.myType === 'streetTexture')!;
      const original = texture.width;
      road.set({scaleX: 4, scaleY: 4}); road.fire('scaling');
      const enlarged = texture.width * texture.getObjectScaling().x;
      expect(enlarged).toBeGreaterThan(original);
      expect(enlarged).toBeLessThan(original * 4);
      expect(texture.toSVG()).toContain('non-scaling-stroke');
      await createFabricCanvasDocumentPort(target).loadCanvasDocument(
        createFabricCanvasDocumentPort(source).exportCanvasDocument(),
      );
      const restored = target.getObjects()[0] as CanvasGroup;
      const detail = restored.getCanvasObjects().find(child => child.myType === 'streetTexture')!;
      expect(detail.width * detail.getObjectScaling().x).toBeCloseTo(enlarged);
      restored.set({scaleX: 9, scaleY: 9}); restored.fire('scaling');
      expect(detail.width * detail.getObjectScaling().x).toBeLessThan(original * 9);
    } finally { await source.dispose(); await target.dispose(); }
  });
});
