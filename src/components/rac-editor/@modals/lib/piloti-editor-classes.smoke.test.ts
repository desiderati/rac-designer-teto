import {describe, expect, it} from 'vitest';
import {
  getPilotiContraventamentoButtonClasses,
  getPilotiHeightButtonClasses,
} from './piloti-editor-classes.ts';

describe('piloti editor classes', () => {
  it('marca altura selecionada pelo clique ou valor temporário', () => {
    expect(getPilotiHeightButtonClasses({
      height: 2,
      clickedHeight: 2,
      tempHeight: 1,
    })).toContain('bg-primary text-primary-foreground');

    expect(getPilotiHeightButtonClasses({
      height: 2,
      clickedHeight: null,
      tempHeight: 2,
    })).toContain('bg-primary text-primary-foreground');
  });

  it('prioriza estado desabilitado em botão de contraventamento', () => {
    expect(getPilotiContraventamentoButtonClasses(true, true)).toContain('cursor-not-allowed');
    expect(getPilotiContraventamentoButtonClasses(true, false)).toContain('bg-primary text-primary-foreground');
  });
});
