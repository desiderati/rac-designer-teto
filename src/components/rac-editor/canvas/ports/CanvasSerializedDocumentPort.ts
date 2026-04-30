export const CANVAS_DOCUMENT_VERSION = 1;

export interface SerializedCanvasDocumentObject {
  /** Identificador estável do objeto serializado. */
  id: string;

  /** Tipo lógico do objeto serializado. */
  kind: string;

  /** Dados específicos do objeto, sem instâncias vivas do runtime gráfico. */
  payload: Record<string, unknown>;
}

export interface SerializedCanvasDocument {
  /** Versão do contrato documental do canvas. */
  version: typeof CANVAS_DOCUMENT_VERSION;

  /** Objetos serializados que compõem o documento. */
  objects: SerializedCanvasDocumentObject[];
}

/**
 * Porta documental do canvas para histórico, importação e exportação.
 *
 * O documento pode ser produzido a partir de Fabric JSON durante a transição,
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
