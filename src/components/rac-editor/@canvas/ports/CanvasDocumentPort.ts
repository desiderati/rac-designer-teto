import type {HouseDrawingCanvasDocument} from '@/shared/types/house-drawing-document.ts';

/**
 * Porta documental do canvas.
 *
 * Expõe captura e projeção visual sem vazar a instância concreta do runtime de
 * renderização para hooks de aplicação.
 */
export interface CanvasDocumentPort {
  /** Carrega o documento visual canônico no canvas e informa se a importação foi aceita. */
  loadCanvasDocument(document: HouseDrawingCanvasDocument): Promise<boolean>;

  /** Exporta o documento visual canônico do canvas, ou `null` se não houver canvas. */
  exportCanvasDocument(): HouseDrawingCanvasDocument | null;

  /** Exporta a imagem atual do canvas como data URL, ou `null` se indisponível. */
  exportImageDataUrl(): string | null;
}
