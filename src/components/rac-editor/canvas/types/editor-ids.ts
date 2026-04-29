/**
 * Identificador serializável de um objeto do editor.
 *
 * O valor pode apontar para um objeto visual existente no canvas, mas não
 * transporta a instância de runtime gráfico. Isso mantém UI, commands e store
 * independentes de Fabric.
 */
export type EditorObjectId = string;

/**
 * Identificador serializável de uma vista desenhada da casa.
 *
 * Durante a transição, esse valor normalmente corresponde ao `houseInstanceId`
 * usado nos grupos Fabric. O contrato público, porém, permanece apenas string.
 */
export type EditorViewId = string;

/**
 * Identificador serializável de piloti.
 *
 * A aplicação já usa ids como `piloti_0_0`; manter o tipo como string evita
 * migração desnecessária antes de estabilizar o store.
 */
export type EditorPilotiId = string;

/**
 * Ponto em coordenadas de tela usado por editores flutuantes e popovers.
 */
export interface EditorScreenPoint {
  x: number;
  y: number;
}
