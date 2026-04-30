/**
 * Porta de inserção de snapshots visuais no canvas.
 */
export interface CanvasSnapshotPort {
  /**
   * Insere uma imagem serializada no centro visível do canvas.
   *
   * Retorna `false` quando o canvas não está disponível, a imagem é inválida ou
   * a implementação concreta não consegue materializar o snapshot.
   */
  insertImageSnapshot(dataUrl: string): Promise<boolean>;
}
