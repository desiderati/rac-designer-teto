import type {
  HouseDrawingCanvasDocument,
  HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

/**
 * Porta documental da casa ativa no editor.
 *
 * O contrato compõe estado lógico da casa e documento visual serializável sem
 * expor JSON Fabric como formato canônico do projeto. Ele representa a fronteira
 * entre arquivo RAC e estado de editor, não a API do canvas.
 */
export interface HouseDrawingDocumentPort {
  /**
   * Cria o documento canônico da casa ativa a partir do documento visual do canvas.
   *
   * Retorna `null` quando o estado lógico ainda não possui informação suficiente
   * para compor um arquivo RAC válido.
   */
  exportHouseDrawingDocument(canvas: HouseDrawingCanvasDocument): HouseDrawingDocument | null;

  /**
   * Aplica um documento canônico de casa ao estado lógico do editor.
   *
   * A projeção visual é responsabilidade de `CanvasDocumentPort`; esta porta não
   * reconstrói estado lógico a partir de grupos visuais.
   */
  importHouseDrawingDocument(document: HouseDrawingDocument): void;
}
