/**
 * Porta documental do canvas.
 *
 * Expõe serialização, importação e captura visual sem vazar a instância
 * concreta do runtime de renderização para hooks de aplicação.
 */
export interface CanvasDocumentPort {
  loadProjectJson(rawContent: string): Promise<boolean>;
  exportProjectJson(): string | null;
  exportImageDataUrl(): string | null;
}
