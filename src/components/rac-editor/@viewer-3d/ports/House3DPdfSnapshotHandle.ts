export interface House3DPdfSnapshotHandle {
  captureImageDataUrl: () => Promise<string | null>;
}
