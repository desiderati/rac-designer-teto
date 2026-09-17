import type {HouseDrawingCanvasDocument} from '@/shared/types/house-drawing-document.ts';

/**
 * Porta documental do canvas.
 *
 * Expõe captura e projeção visual sem vazar a instância concreta do runtime de
 * renderização para hooks de aplicação. A implementação Fabric pertence ao
 * slice `@canvas`; consumidores externos dependem apenas do documento visual.
 */
export interface CanvasDocumentPort {
  /**
   * Carrega o documento visual canônico no canvas.
   *
   * Retorna `false` quando o documento não é aceito pela implementação visual.
   */
  loadCanvasDocument(document: HouseDrawingCanvasDocument): Promise<boolean>;

  /**
   * Exporta o documento visual canônico do canvas.
   *
   * Retorna `null` quando não há runtime visual disponível.
   */
  exportCanvasDocument(): HouseDrawingCanvasDocument | null;

  /**
   * Exporta a imagem atual do canvas como data URL.
   *
   * Retorna `null` quando a implementação visual não consegue gerar imagem.
   */
  exportImageDataUrl(): string | null;
}
