import {describe, expect, it} from 'vitest';
import {getHintForObject} from './hints.ts';
import {CanvasObject} from './canvas.ts';

describe('hints.ts', () => {
  it('returns default hint when no object is selected', () => {
    expect(getHintForObject(null)).toContain('Selecione uma ferramenta');
  });

  it('returns specific hints based on myType or type', () => {
    expect(getHintForObject({myType: 'house'} as unknown as CanvasObject)).toContain('Casa');
    expect(getHintForObject({type: 'activeSelection'} as unknown as CanvasObject)).toContain('Vários objetos selecionados');
  });

  it.each(['wall', 'square', 'triangle', 'circle', 'fence', 'terrainEntry', 'siteHouse', 'siteBuilding', 'line', 'arrow', 'distance', 'text', 'freehand'])(
    'orienta a edição de %s pelo botão mobile, sem instruções de mouse', myType => {
      const hint = getHintForObject({myType} as CanvasObject, true);
      expect(hint).toContain('Toque em Editar');
      expect(hint).not.toMatch(/clique|botão direito|Ctrl|Bloquear|Desbloquear/i);
    },
  );

  it('distingue o editor dos pilotis na planta do editor de terreno na elevação', () => {
    expect(getHintForObject({myType: 'house', houseView: 'top'} as CanvasObject, true)).toContain('contraventamento dos pilotis');
    const elevation = getHintForObject({myType: 'house', houseView: 'front'} as CanvasObject, true);
    expect(elevation).toContain('terreno e a cama de rachão');
    expect(elevation).not.toContain('contraventamento');
  });

  it('explica que a distância é digitada e não medida automaticamente, inclusive no tipo legado', () => {
    for (const myType of ['dimension', 'distance']) {
      expect(getHintForObject({myType} as CanvasObject)).toContain('não é calculado pelo comprimento da linha');
    }
  });

  it('oferece transformação, sem sugerir um editor inexistente para os elementos ilustrativos', () => {
    for (const myType of ['tree', 'water', 'fossa', 'stairs', 'street', 'gateSwing']) {
      const hint = getHintForObject({myType} as CanvasObject, true);
      expect(hint).toContain('Transformar');
      expect(hint).not.toContain('Editar');
    }
  });
});

