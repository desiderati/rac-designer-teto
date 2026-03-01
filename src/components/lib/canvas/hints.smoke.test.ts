import {describe, expect, it} from 'vitest';
import {getHintForObject} from './hints.ts';
import {CanvasObject} from './canvas.ts';

describe('canvas hints', () => {
  it('returns default hint when no object is selected', () => {
    expect(getHintForObject(null)).toContain('Dica: Selecione uma ferramenta');
  });

  it('returns specific hints based on myType or type', () => {
    expect(getHintForObject({myType: 'house'} as unknown as CanvasObject)).toContain('Casa');
    expect(getHintForObject({type: 'activeSelection'} as unknown as CanvasObject)).toContain('Múltiplos itens selecionados');
  });
});
