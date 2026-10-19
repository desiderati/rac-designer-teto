import { describe, expect, it, vi } from 'vitest';
import { captureReferencedBackup, documentSourceFromSingleSelect, signedGetAssetSource } from './live-capture.ts';
import { GLOBAL_SCOPE, MAX_ASSET_BYTES, sha256, verifyBackup, type CanonicalRow } from './operations.ts';

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2]);
const row: CanonicalRow = {
  id: 'site-live', scopeKey: GLOBAL_SCOPE, externalCode: 'A7', status: 'active', documentVersion: 4,
  createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-10-19T12:00:00.000Z',
  document: { constructionSite: { id: 'site-live', documentVersion: 4,
    photoDataUrl: '/api/private-storage/rac/site/live.png' },
  houses: [{ image: { storageKey: 'rac/site/house-3d.png' } }] },
};

describe('providers de captura global simulados', () => {
  it('faz um SELECT lógico e um GET assinado por referência, sem listagem Forge', async () => {
    const selectRows = vi.fn(async () => [row]);
    const sign = vi.fn(async (key: string) => `https://signed.example.test/${key}`);
    const transport = vi.fn(async () => new Response(new Blob([Uint8Array.from(png)]), {
      headers: { 'content-type': 'image/png', 'last-modified': 'Mon, 19 Oct 2026 12:00:00 GMT' },
    })) as typeof fetch;
    const backup = await captureReferencedBackup(documentSourceFromSingleSelect(selectRows),
      signedGetAssetSource(sign, transport));
    const verified = await verifyBackup(backup.archive, sha256(backup.archive));
    expect(backup).toMatchObject({ documentCount: 1, assetCount: 2 });
    expect(selectRows).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(verified.documents).toEqual([row]);
    expect([...verified.assets.keys()].sort()).toEqual(['rac/site/house-3d.png', 'rac/site/live.png']);
    expect(verified.manifest.inventoryCoverage).toBe('referenced-only');
  });

  it('aceita exatamente 7,5 MiB e rejeita byte excedente no GET em streaming', async () => {
    const exact = Buffer.alloc(MAX_ASSET_BYTES);
    png.copy(exact);
    const sign = vi.fn(async () => 'https://signed.example.test/image.png');
    const transport = vi.fn(async () => new Response(new Blob([Uint8Array.from(exact)]), {
      headers: { 'content-type': 'image/png' },
    })) as typeof fetch;
    const asset = signedGetAssetSource(sign, transport);
    expect((await asset.get('rac/site/image.png')).bytes.length).toBe(MAX_ASSET_BYTES);
    const oneAssetRow: CanonicalRow = { ...row, document: { constructionSite: {
      id: row.id, documentVersion: row.documentVersion,
      photoDataUrl: '/api/private-storage/rac/site/image.png',
    } } };
    const backup = await captureReferencedBackup(documentSourceFromSingleSelect(async () => [oneAssetRow]), asset);
    const verified = await verifyBackup(backup.archive, sha256(backup.archive));
    expect(verified.assets.get('rac/site/image.png')?.length).toBe(MAX_ASSET_BYTES);
    const oversized = vi.fn(async () => new Response(new Blob([Uint8Array.from(Buffer.alloc(MAX_ASSET_BYTES + 1))]), {
      headers: { 'content-type': 'image/png' },
    })) as typeof fetch;
    await expect(signedGetAssetSource(sign, oversized).get('rac/site/large.png'))
      .rejects.toThrow('acima do limite');
  });

  it('falha fechado quando o GET assinado falha ou a linha não é global', async () => {
    const failed = signedGetAssetSource(async () => 'https://signed.example.test/missing',
      (async () => new Response(null, { status: 404 })) as typeof fetch);
    await expect(failed.get('rac/site/missing.png')).rejects.toThrow('GET de asset falhou');
    const invalid = { ...row, scopeKey: 'outro' };
    const get = vi.fn();
    await expect(captureReferencedBackup(documentSourceFromSingleSelect(async () => [invalid]),
      { get })).rejects.toThrow('ID ou escopo');
    expect(get).not.toHaveBeenCalled();
  });
});
