import {describe, expect, it} from 'vitest';
import {Group, Rect, Text, Path} from 'fabric';
import type {CanvasGroup, CanvasObject} from './canvas.ts';
import {createCanvasObjectEditorSelection, getCanvasObjectEditorKind} from './canvas-object-editor-selection.ts';

const position = {x: 100, y: 200};

describe('acesso mobile aos editores de objetos', () => {
  it.each(['fence', 'terrainEntry', 'siteHouse', 'siteBuilding', 'wall', 'square', 'triangle', 'circle'] as const)(
    'preserva o texto, a cor e a identidade de %s', kind => {
      const label = new Text(' Área de apoio ', {fill: '#123456'}) as CanvasObject;
      label.myType = ['fence', 'terrainEntry', 'siteHouse', 'siteBuilding'].includes(kind) ? 'siteLabel' : 'wallLabel';
      const body = new Rect({width: 20, height: 20, stroke: '#123456'}) as CanvasObject;
      body.myType = 'wallBody';
      const object = new Group([body, label]) as CanvasGroup;
      object.myType = kind;
      const result = createCanvasObjectEditorSelection(object, position, 3);
      expect(result).toMatchObject({kind: 'wall', selection: {
        editorType: kind, currentLabel: 'Área de apoio', currentColor: '#123456', screenPosition: position,
      }});
      expect(object.editorObjectId).toEqual(expect.any(String));
      expect(result?.selection.editorSelection).toMatchObject({type: 'wall', objectId: object.editorObjectId});
    });

  it.each(['line', 'arrow', 'distance'] as const)('abre %s com o valor atual', kind => {
    const label = new Text('Medida', {fill: '#abcdef'}) as CanvasObject;
    label.myType = 'objLabel';
    const object = new Group([label]) as CanvasGroup;
    object.myType = kind;
    expect(createCanvasObjectEditorSelection(object, position, 3)).toMatchObject({kind: 'linear', selection: {
      myType: kind, currentLabel: 'Medida', currentColor: '#abcdef', editorSelection: {linearType: kind},
    }});
  });

  it('distingue terreno de planta, objetos sem editor e mantém texto e traço editáveis', () => {
    const terrain = new Rect({width: 10, height: 10}) as CanvasObject;
    terrain.isTerrainEditTarget = true;
    const front = new Group([terrain]) as CanvasGroup;
    front.myType = 'house';
    front.houseView = 'front';
    front.houseInstanceId = 'vista-frontal';
    expect(createCanvasObjectEditorSelection(front, position, 4)).toMatchObject({kind: 'terrain', selection: {
      terrainType: 4, editorSelection: {type: 'terrain', viewId: 'vista-frontal'},
    }});
    front.houseView = 'top';
    expect(getCanvasObjectEditorKind(front)).toBeNull();
    expect(getCanvasObjectEditorKind(new Rect() as CanvasObject)).toBeNull();
    const text = new Text('Texto', {fill: '#456789'}) as CanvasObject;
    text.myType = 'text';
    expect(createCanvasObjectEditorSelection(text, position, 1)).toMatchObject({selection: {editorType: 'text', currentLabel: 'Texto', currentColor: '#456789'}});
    const path = new Path('M 0 0 L 10 10', {stroke: '#987654'}) as CanvasObject;
    expect(createCanvasObjectEditorSelection(path, position, 1)).toMatchObject({selection: {editorType: 'freehand', currentColor: '#987654'}});
  });
});
