export const CANVAS_DOCUMENT_VERSION = 1;

export interface SerializedCanvasDocumentObject {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
}

export interface SerializedCanvasDocument {
  version: typeof CANVAS_DOCUMENT_VERSION;
  objects: SerializedCanvasDocumentObject[];
}

/**
 * Porta documental do canvas para histórico, importação e exportação.
 *
 * O documento pode ser produzido a partir de Fabric JSON durante a transição,
 * mas o contrato público não transporta instâncias vivas do runtime gráfico.
 */
export interface CanvasDocumentPort {
  exportDocument(): Promise<SerializedCanvasDocument>;
  importDocument(document: SerializedCanvasDocument): Promise<void>;
  saveHistorySnapshot(): void;
  restorePreviousHistorySnapshot(): Promise<boolean>;
}
