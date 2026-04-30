/**
 * Porta documental do canvas.
 *
 * Expõe serialização, importação e captura visual sem vazar a instância
 * concreta do runtime de renderização para hooks de aplicação.
 */
export interface CanvasDocumentPort {
  /** Carrega um JSON de projeto no canvas e informa se a importação foi aceita. */
  loadProjectJson(rawContent: string): Promise<boolean>;

  /** Exporta o projeto atual como JSON serializado, ou `null` se não houver canvas. */
  exportProjectJson(): string | null;

  /** Exporta a imagem atual do canvas como data URL, ou `null` se indisponível. */
  exportImageDataUrl(): string | null;
}
