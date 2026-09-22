export interface House3DPdfSnapshotHandle {
  captureImageDataUrl: () => Promise<string | null>;
  getLastCaptureKind?: () => 'illustration' | '3d-fallback' | null;
}
