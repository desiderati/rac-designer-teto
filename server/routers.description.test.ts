import {describe, expect, it} from 'vitest';
import {extractDescription} from './routers.ts';

describe('extractDescription', () => {
  it('extrai a frase de uma resposta JSON estruturada', () => {
    expect(extractDescription('{"description":"Solo úmido com vegetação baixa e acesso lateral."}'))
      .toBe('Solo úmido com vegetação baixa e acesso lateral.');
  });

  it('remove cercas markdown e não devolve o nome do campo', () => {
    expect(extractDescription('```json\n{"description":"Área aberta com árvores ao fundo."}\n```'))
      .toBe('Área aberta com árvores ao fundo.');
  });

  it('limpa uma resposta JSON parcial', () => {
    expect(extractDescription('{"description":"Terreno plano com pedras'))
      .toBe('Terreno plano com pedras');
  });

  it('limpa resposta estruturada sem chaves externas e resposta já estruturada', () => {
    expect(extractDescription('"description": "Foto com grupo de pessoas em área arborizada."'))
      .toBe('Foto com grupo de pessoas em área arborizada.');
    expect(extractDescription({description: 'Solo exposto com vegetação nas bordas.'}))
      .toBe('Solo exposto com vegetação nas bordas.');
  });
});
