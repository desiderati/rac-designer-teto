import {describe, expect, it} from 'vitest';
import {getHintForObject} from './hints.ts';

describe('canvas hints', () => {
  it('returns default hint when no object is selected', () => {
    expect(getHintForObject(null)).toContain('Dica: Selecione uma ferramenta');
  });

  it('returns specific hints based on myType or type', () => {
    expect(getHintForObject({myType: 'house'} as any)).toContain('Casa');
    expect(getHintForObject({type: 'activeSelection'} as any)).toContain('Múltiplos itens selecionados');
  });
});
