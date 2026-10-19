import {
  createBackup, GLOBAL_SCOPE, MAX_ASSET_BYTES, referencedKeys, sha256, validKey,
  type CanonicalRow, type DocumentSnapshot, type InventoryObject, type InventorySnapshot,
} from './operations.ts';

export interface DocumentCaptureSource { capture(): Promise<DocumentSnapshot> }
export interface ReferencedAssetSource {
  get(key: string): Promise<{ bytes: Buffer; contentType: string; observedAt: string }>;
}

/** A fonte SQL concreta deve entregar todas as linhas globais por um único SELECT. */
export function documentSourceFromSingleSelect(selectRows: () => Promise<CanonicalRow[]>): DocumentCaptureSource {
  return {
    async capture() {
      const capturedAt = new Date().toISOString();
      const items = await selectRows();
      return { scopeKey: GLOBAL_SCOPE, complete: true,
        evidence: { source: 'construction_site_documents:single-select',
          expectedCount: items.length, capturedAt }, items };
    },
  };
}

/** Usa somente o GET assinado existente; o transporte é injetado nos testes. */
export function signedGetAssetSource(
  signGet: (key: string) => Promise<string>,
  transport: typeof fetch,
): ReferencedAssetSource {
  return {
    async get(key) {
      validKey(key);
      const url = await signGet(key);
      const response = await transport(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok || !response.body) throw new Error(`GET de asset falhou: ${key} (${response.status})`);
      const declared = response.headers.get('content-length');
      if (declared !== null && Number(declared) > MAX_ASSET_BYTES)
        throw new Error(`Asset acima do limite: ${key}`);
      const chunks: Buffer[] = [];
      let size = 0;
      const stream = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await stream.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_ASSET_BYTES) throw new Error(`Asset acima do limite: ${key}`);
          chunks.push(Buffer.from(value));
        }
      } catch (error) {
        await stream.cancel().catch(() => undefined);
        throw error;
      } finally {
        stream.releaseLock();
      }
      const modified = response.headers.get('last-modified');
      const observedAt = modified && Number.isFinite(Date.parse(modified))
        ? new Date(modified).toISOString() : new Date().toISOString();
      return { bytes: Buffer.concat(chunks),
        contentType: response.headers.get('content-type')?.split(';')[0].trim() || 'application/octet-stream',
        observedAt };
    },
  };
}

export async function captureReferencedBackup(documents: DocumentCaptureSource,
  assets: ReferencedAssetSource): Promise<{ archive: Buffer; documentCount: number; assetCount: number }> {
  const snapshot = await documents.capture();
  const keys = referencedKeys(snapshot);
  const bytes = new Map<string, Buffer>();
  const objects: InventoryObject[] = [];
  for (const key of keys) {
    const asset = await assets.get(key);
    bytes.set(key, asset.bytes);
    objects.push({ key, sizeBytes: asset.bytes.length, sha256: sha256(asset.bytes),
      contentType: asset.contentType, updatedAt: asset.observedAt });
  }
  const inventory: InventorySnapshot = {
    scopeKey: GLOBAL_SCOPE, complete: true, coverage: 'referenced-only',
    evidence: { source: 'signed-get:referenced-only', expectedCount: objects.length,
      capturedAt: new Date().toISOString() }, items: objects,
  };
  const archive = await createBackup(snapshot, inventory, {
    read: async key => {
      const data = bytes.get(key);
      if (!data) throw new Error(`Asset referenciado ausente: ${key}`);
      return data;
    },
  });
  return { archive, documentCount: snapshot.items.length, assetCount: objects.length };
}
