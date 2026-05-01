import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  type HouseDrawingCanvasDocument,
  type HouseDrawingElementDocument,
} from '@/shared/types/house-drawing-document.ts';

export const CANVAS_DOCUMENT_VERSION = HOUSE_DRAWING_CANVAS_SCHEMA_VERSION;

export type SerializedCanvasDocumentObject = HouseDrawingElementDocument;

export type SerializedCanvasDocument = HouseDrawingCanvasDocument;

/**
 * Porta documental do canvas para histórico, importação e exportação.
 *
 * O documento pode ser produzido a partir do runtime Fabric durante a transição,
 * mas o contrato público não transporta instâncias vivas do runtime gráfico.
 */
export interface CanvasSerializedDocumentPort {
  /** Exporta o documento lógico do canvas. */
  exportDocument(): Promise<SerializedCanvasDocument>;

  /** Importa um documento lógico previamente exportado. */
  importDocument(document: SerializedCanvasDocument): Promise<void>;

  /** Salva um snapshot de histórico para permitir desfazer alterações. */
  saveHistorySnapshot(): void;

  /** Restaura o snapshot anterior de histórico e informa se houve restauração. */
  restorePreviousHistorySnapshot(): Promise<boolean>;
}
