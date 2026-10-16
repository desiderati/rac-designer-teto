import {describe, expect, it, vi} from 'vitest';
import {Canvas, IText} from 'fabric';
import {siteElementStrategies} from './site.strategy.ts';
import {getElementStrategy} from './index.ts';
import {getGenericObjectEditorStrategy} from '../../generic-object-editor-strategy.ts';
import {readWallObjectState} from '../../generic-object-state.ts';
import type {CanvasGroup} from '../../canvas.ts';
import {createFabricCanvasDocumentPort} from '../../../ui/adapters/fabric-canvas-document-port.ts';
import type {SiteElementKey} from '@shared/types/site-element.ts';

const surface = {width: 800, height: 600, requestRenderAll: vi.fn()} as unknown as Canvas;
const create = (key: SiteElementKey) => getElementStrategy(key).create(surface) as CanvasGroup;
const nameOf = (object: CanvasGroup) => object.getCanvasObjects().find(child => child.myType === 'siteLabel') as IText;

describe('objetos livres do terreno', () => {
  it('cria cobertura e posiciona Casa na metade inferior do telhado, sem ser vista TETO', () => {
    const house = create('siteHouse');
    const roof = house.getCanvasObjects().find(child => child.myType === 'siteBody')!;
    expect(house.myType).toBe('siteHouse');
    expect(house.houseView).toBeUndefined();
    expect(nameOf(house).text).toBe('Casa');
    expect(nameOf(house).getCenterPoint().y).toBeGreaterThan(roof.getCenterPoint().y);
    expect(nameOf(house).getCenterPoint().y).toBeLessThan(roof.getBoundingRect().top + roof.getBoundingRect().height);
  });

  it.each([
    ['buildingBottom', 'bottom', 0], ['buildingTop', 'top', 180],
    ['buildingLeft', 'left', 90], ['buildingRight', 'right', -90],
  ] as const)('cria %s com porta no lado correto e nome horizontal', (key, side, angle) => {
    const object = create(key);
    expect(object.siteElementVariant).toBe(side);
    expect(object.getCanvasObjects().find(child => child.myType === 'siteBody')?.angle).toBe(angle);
    expect(nameOf(object).text).toBe('Banheiro');
    expect(nameOf(object).angle).toBe(0);
  });

  it.each(['siteHouse', 'buildingLeft', 'entryUp'] as const)('edita nome de %s preservando escala e posição do texto', key => {
    const object = create(key);
    const label = nameOf(object);
    object.set({scaleX: 2, scaleY: 2});
    const scaling = label.getObjectScaling();
    getGenericObjectEditorStrategy(object.myType as 'siteHouse' | 'siteBuilding' | 'terrainEntry')
      .apply({canvas: {requestRenderAll: vi.fn()} as unknown as Canvas, object, color: '#334455', label: 'Novo nome de edificação para teste'});
    expect(label.text).toBe('Novo nome de edificação para teste');
    expect(label.getObjectScaling().x).toBeCloseTo(scaling.x);
    expect(label.getObjectScaling().y).toBeCloseTo(scaling.y);
    expect(readWallObjectState(object).currentLabel).toBe('Novo nome de edificação para teste');
    if (object.myType !== 'terrainEntry') {
      const body = object.getCanvasObjects().find(child => child.myType === 'siteBody')!;
      const width = Math.abs(body.angle % 180) === 90 ? body.height : body.width;
      expect(label.width).toBeLessThanOrEqual(width - 19);
    }
  });

  it.each(['entryUp', 'entryRight', 'entryDown', 'entryLeft'] as const)('cria %s com texto editável e removível', key => {
    const object = create(key);
    expect(nameOf(object).text).toBe('Entrada no Terreno');
    getGenericObjectEditorStrategy('terrainEntry').apply({canvas: surface, object, color: '#111111', label: ''});
    expect(nameOf(object).visible).toBe(false);
  });

  it('mantém a cerca sem nome inicial, com edição opcional e postes quadrados ao alongar', () => {
    const fence = create('fence');
    expect(nameOf(fence).text).toBe('');
    expect(nameOf(fence).visible).toBe(false);
    const canvas = {requestRenderAll: vi.fn()} as unknown as Canvas;
    getGenericObjectEditorStrategy('fence').apply({canvas, object: fence, color: '#806448', label: 'Vizinho'});
    expect(readWallObjectState(fence).currentLabel).toBe('Vizinho');
    fence.set({scaleX: 2, scaleY: 1});
    const body = fence.getCanvasObjects().find(child => child.myType === 'fenceBody')!;
    const width = body.width;
    fence.fire('scaling');
    expect(body.width).toBeCloseTo(width * 2);
    expect(fence.scaleX).toBe(1);
    fence.getCanvasObjects().filter(child => child.myType === 'fencePost').forEach(post =>
      expect(post.width).toBe(post.height));
    getGenericObjectEditorStrategy('fence').apply({canvas, object: fence, color: '#806448', label: ''});
    expect(nameOf(fence).visible).toBe(false);
    expect(nameOf(fence).top).toBeCloseTo(body.top);
  });

  it('cria somente o portão de abrir, sempre aberto e sem rótulo', () => {
    const object = create('gateSwing');
    expect(object.myType).toBe('siteGate');
    expect(object.getCanvasObjects().some(child => child.type === 'i-text' || child.myType === 'siteLabel')).toBe(false);
    expect(object.flipX).toBe(false);
    expect(object.siteElementVariant).toBe('swing');
    const leaf = object.getCanvasObjects().find(child => child.myType === 'gateLeaf')!;
    expect(leaf.height).toBeGreaterThan(leaf.width);
    expect(Object.keys(siteElementStrategies).filter(key => key.startsWith('gate'))).toEqual(['gateSwing']);
  });

  it('preserva todos os tipos, variantes, nomes, flips e resize ao salvar e reabrir o documento', async () => {
    const source = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    const target = new Canvas(document.createElement('canvas'), {renderOnAddRemove: false});
    try {
      Object.keys(siteElementStrategies).forEach(key => source.add(create(key as SiteElementKey)));
      // Documentos anteriores podem conter portões espelhados; a remoção da opção não os altera.
      (source.getObjects() as CanvasGroup[]).find(item => item.myType === 'siteGate')!.set({flipX: true});
      const doc = createFabricCanvasDocumentPort(source).exportCanvasDocument();
      await createFabricCanvasDocumentPort(target).loadCanvasDocument(doc);
      const restored = target.getObjects() as CanvasGroup[];
      expect(restored).toHaveLength(Object.keys(siteElementStrategies).length);
      const house = restored.find(item => item.myType === 'siteHouse')!;
      expect(nameOf(house).text).toBe('Casa');
      const building = restored.find(item => item.myType === 'siteBuilding' && item.siteElementVariant === 'left')!;
      expect(nameOf(building).text).toBe('Banheiro');
      expect(restored.find(item => item.myType === 'siteGate')!.flipX).toBe(true);
      const fence = restored.find(item => item.myType === 'fence')!;
      fence.set({scaleX: 2}); fence.fire('scaling');
      expect(fence.scaleX).toBe(1);
      expect(fence.getCanvasObjects().find(child => child.myType === 'fenceBody')!.width).toBe(480);
    } finally {
      await source.dispose(); await target.dispose();
    }
  });
});
