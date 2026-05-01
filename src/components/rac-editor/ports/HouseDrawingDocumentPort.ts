import type {
  HouseDrawingCanvasDocument,
  HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

/**
 * Porta documental da casa ativa no editor.
 *
 * O contrato compõe estado lógico da casa e documento visual serializável sem
 * expor JSON Fabric como formato canônico do projeto.
 */
export interface HouseDrawingDocumentPort {
  /** Cria o documento canônico da casa ativa a partir do documento visual do canvas. */
  exportHouseDrawingDocument(canvas: HouseDrawingCanvasDocument): HouseDrawingDocument | null;

  /** Aplica um documento canônico de casa ao estado lógico do editor. */
  importHouseDrawingDocument(document: HouseDrawingDocument): void;
}
