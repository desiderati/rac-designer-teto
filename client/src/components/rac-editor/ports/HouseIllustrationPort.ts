/**
 * Capacidade de transformar uma captura 3D em uma ilustração arquitetônica.
 * A implementação concreta usa o backend Manus; o viewer conhece somente este contrato.
 */
export interface HouseIllustrationPort {
  generateFromDataUrl: (dataUrl: string) => Promise<string | null>;
  resolveDataUrl: (url: string) => Promise<string | null>;
}
