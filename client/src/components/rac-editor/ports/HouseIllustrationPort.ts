/**
 * Capacidade de transformar uma captura 3D em uma ilustração arquitetônica.
 * A implementação concreta usa o backend Manus; o viewer conhece somente este contrato.
 */
export interface HouseIllustrationPort {
  generateFromDataUrl: (dataUrl: string, options?: HouseIllustrationOptions) => Promise<HouseIllustrationResult | null>;
  persistDataUrl?: (dataUrl: string, fileName: string) => Promise<string | null>;
}

export interface HouseIllustrationOptions {
  /** Cor-base configurada no viewer 3D, em hexadecimal. */
  wallColor?: string;
}

export interface HouseIllustrationResult {
  dataUrl: string | null;
  storageUrl: string | null;
}
