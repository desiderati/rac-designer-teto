import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  applyCleanup, createBackup, GLOBAL_SCOPE, MAX_ASSET_BYTES, planCleanup, references, sha256, verifyBackup,
  type DocumentSnapshot, type InventorySnapshot, type PendingSnapshot,
} from './operations.ts';

const now = '2026-10-19T12:00:00.000Z';
const old = '2026-09-01T12:00:00.000Z';
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2]);
const key = 'rac/site/photo.png';
let roots: string[] = [];
afterEach(async () => { for (const root of roots) await rm(root, { recursive: true, force: true }); roots = []; });

function complete<T>(items: T[]) {
  return { scopeKey: GLOBAL_SCOPE, complete: true as const,
    evidence: { source: 'fixture-offline', expectedCount: items.length, capturedAt: now }, items };
}
function docs(): DocumentSnapshot {
  return complete([{
    id: 'site-1', scopeKey: GLOBAL_SCOPE, externalCode: 'A1', status: 'active',
    documentVersion: 3, createdAt: old, updatedAt: now,
    document: { constructionSite: { id: 'site-1', documentVersion: 3,
      photoDataUrl: `/api/private-storage/${key}` }, houses: [{
        drawingDocument: { canvas: { objects: [{ src: '/manus-storage/rac/site/3d.png' }] } },
      }] },
  }]);
}
function inventory(): InventorySnapshot {
  return { ...complete([
    { key, sizeBytes: png.length, sha256: sha256(png), contentType: 'image/png', updatedAt: old },
    { key: 'rac/site/3d.png', sizeBytes: png.length, sha256: sha256(png), contentType: 'image/png', updatedAt: old },
    { key: 'rac/site/orphan.png', sizeBytes: png.length, sha256: sha256(png), contentType: 'image/png', updatedAt: old },
    { key: 'rac/site/recent.png', sizeBytes: png.length, sha256: sha256(png), contentType: 'image/png', updatedAt: now },
    { key: 'rac/site/uploading.png', sizeBytes: png.length, sha256: sha256(png), contentType: 'image/png', updatedAt: old },
  ]), coverage: 'all-objects' };
}
function pending(): PendingSnapshot { return complete([{ key: 'rac/site/uploading.png' }]); }
async function fixture() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'rac-admin-')));
  roots.push(root);
  const assets = path.join(root, 'assets');
  for (const object of inventory().items) {
    const file = path.join(assets, object.key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, png);
  }
  const documentsFile = path.join(root, 'documents.json');
  const inventoryFile = path.join(root, 'inventory.json');
  const pendingFile = path.join(root, 'pending.json');
  const policyFile = path.join(root, 'policy.json');
  await writeFile(documentsFile, JSON.stringify(docs()));
  await writeFile(inventoryFile, JSON.stringify(inventory()));
  await writeFile(pendingFile, JSON.stringify(pending()));
  await writeFile(policyFile, JSON.stringify({ minAgeDays: 30 }));
  return { root, assets, documentsFile, inventoryFile, pendingFile, policyFile };
}
function cli(...args: string[]) {
  return JSON.parse(execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs',
    'scripts/admin/storage-ops.ts', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) as {
      verified?: boolean; documents?: number; assets?: number; dryRun?: boolean;
      candidates?: string[]; planHash?: string; deleted?: string[];
    };
}

describe('operações administrativas offline', () => {
  it('cria, verifica e reconstitui backup global com IDs, versões, metadados, referências e binários', async () => {
    const f = await fixture();
    const archive = path.join(f.root, 'backup.zip');
    cli('backup', '--documents', f.documentsFile, '--inventory', f.inventoryFile,
      '--assets', f.assets, '--out', archive);
    const result = cli('verify', '--archive', archive, '--sha256-file', `${archive}.sha256`);
    expect(result).toMatchObject({ verified: true, documents: 1, assets: 2 });
    const restored = path.join(f.root, 'isolated');
    cli('restore', '--archive', archive, '--sha256-file', `${archive}.sha256`, '--out', restored);
    const extracted = JSON.parse(await readFile(path.join(restored, 'documents.json'), 'utf8'));
    expect(extracted.items).toEqual(docs().items);
    expect(await readFile(path.join(restored, 'assets', key))).toEqual(png);
    expect(await readFile(path.join(restored, 'assets/rac/site/3d.png'))).toEqual(png);
    if (process.platform !== 'win32') {
      for (const dir of [restored, path.join(restored, 'assets'), path.join(restored, 'assets/rac'),
        path.join(restored, 'assets/rac/site')]) {
        expect((await stat(dir)).mode & 0o777).toBe(0o700);
      }
      for (const file of [path.join(restored, 'documents.json'), path.join(restored, 'inventory.json'),
        path.join(restored, 'assets', key)]) {
        expect((await stat(file)).mode & 0o777).toBe(0o600);
      }
    }
    expect(() => cli('restore', '--archive', archive, '--sha256-file', `${archive}.sha256`, '--out', restored))
      .toThrow();
  });

  it('bloqueia output por link simbólico antes da restauração', async () => {
    const f = await fixture();
    const archive = path.join(f.root, 'backup.zip');
    cli('backup', '--documents', f.documentsFile, '--inventory', f.inventoryFile,
      '--assets', f.assets, '--out', archive);
    const target = path.join(f.root, 'target');
    await mkdir(target);
    await symlink(target, path.join(f.root, 'link'));
    expect(() => cli('restore', '--archive', archive, '--sha256-file', `${archive}.sha256`,
      '--out', path.join(f.root, 'link/restored'))).toThrow();
  });

  it('não inicia captura conectada sem opt-in explícito', async () => {
    const f = await fixture();
    expect(() => cli('backup-live', '--out', path.join(f.root, 'live.zip'))).toThrow();
    await expect(readFile(path.join(f.root, 'live.zip'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('bloqueia backup corrompido, referência ausente e assinatura de imagem inválida', async () => {
    const f = await fixture();
    const d = docs(); const i = inventory();
    const reader = { read: async (assetKey: string) => readFile(path.join(f.assets, assetKey)) };
    const bytes = await createBackup(d, i, reader);
    await expect(verifyBackup(bytes, sha256(Buffer.from('outro')))).rejects.toThrow('Hash externo');
    await expect(verifyBackup(Buffer.concat([bytes, Buffer.from('x')]), sha256(bytes)))
      .rejects.toThrow('Hash externo');
    i.items = i.items.filter(item => item.key !== 'rac/site/3d.png');
    i.evidence.expectedCount = i.items.length;
    await expect(createBackup(d, i, reader)).rejects.toThrow('sem objeto');
    const wrong = inventory();
    wrong.items[0].sha256 = sha256(Buffer.from('não é PNG'));
    wrong.items[0].sizeBytes = Buffer.byteLength('não é PNG');
    await expect(createBackup(d, wrong, { read: async assetKey =>
      assetKey === key ? Buffer.from('não é PNG') : reader.read(assetKey) })).rejects.toThrow('Assinatura PNG');
  });

  it('falha fechado com inventário incompleto, contagem errada, tamanho excessivo e chave insegura', async () => {
    const f = await fixture();
    const reader = { read: async (assetKey: string) => readFile(path.join(f.assets, assetKey)) };
    const i = inventory();
    (i as unknown as { complete: boolean }).complete = false;
    await expect(createBackup(docs(), i, reader)).rejects.toThrow('completude');
    i.complete = true; i.evidence.expectedCount = 99;
    await expect(createBackup(docs(), i, reader)).rejects.toThrow('contagem');
    i.evidence.expectedCount = i.items.length; i.items[0].sizeBytes = MAX_ASSET_BYTES + 1;
    await expect(createBackup(docs(), i, reader)).rejects.toThrow('limite');
    const d = docs();
    (d.items[0].document as { constructionSite: { photoDataUrl: string } }).constructionSite.photoDataUrl =
      '/manus-storage/../secret';
    await expect(createBackup(d, inventory(), reader)).rejects.toThrow('Chave insegura');
  });

  it('encontra storageKey recursiva e bloqueia chave malformada', () => {
    expect(references({ house: { views: [{ asset: { storageKey: 'rac/site/3d.png' } }] } }))
      .toEqual(['rac/site/3d.png']);
    expect(() => references({ house: { asset: { storageKey: '../private.png' } } }))
      .toThrow('Chave insegura');
  });

  it('planeja apenas órfãos antigos; dry-run não apaga arquivo', async () => {
    const f = await fixture();
    const planFile = path.join(f.root, 'plan.json');
    const result = cli('cleanup-plan', '--documents', f.documentsFile, '--inventory', f.inventoryFile,
      '--pending', f.pendingFile, '--policy', f.policyFile, '--out', planFile);
    expect(result).toMatchObject({ dryRun: true, candidates: ['rac/site/orphan.png'] });
    expect(await readFile(path.join(f.assets, 'rac/site/orphan.png'))).toEqual(png);
    expect(JSON.parse(await readFile(planFile, 'utf8')).planHash).toBe(result.planHash);
  });

  it('bloqueia apply sem autorização, política divergente e plano desatualizado', async () => {
    const d = docs(); const i = inventory(); const p = pending();
    const plan = planCleanup(d, i, p, { minAgeDays: 30 }, now);
    const reader = { documents: async () => d, inventory: async () => i, pendingUploads: async () => p };
    const deleter = { delete: vi.fn() };
    await expect(applyCleanup(plan, reader, deleter, '', { minAgeDays: 30 })).rejects.toThrow('Autorização');
    await expect(applyCleanup(plan, reader, deleter, `DELETE ORPHANS ${plan.planHash}`, { minAgeDays: 1 }))
      .rejects.toThrow('Política');
    (d.items[0].document as { constructionSite: { photoDataUrl: string } }).constructionSite.photoDataUrl =
      '/manus-storage/rac/site/orphan.png';
    await expect(applyCleanup(plan, reader, deleter, `DELETE ORPHANS ${plan.planHash}`, { minAgeDays: 30 }))
      .rejects.toThrow('desatualizado');
    expect(deleter.delete).not.toHaveBeenCalled();
  });

  it('bloqueia limpeza quando uploads pendentes não têm inventário completo', () => {
    const p = pending();
    (p as unknown as { complete: boolean }).complete = false;
    expect(() => planCleanup(docs(), inventory(), p, { minAgeDays: 30 }, now)).toThrow('completude');
    const referenced = inventory();
    referenced.coverage = 'referenced-only';
    expect(() => planCleanup(docs(), referenced, pending(), { minAgeDays: 30 }, now))
      .toThrow('Inventário global completo');
  });

  it('recusa candidatos adulterados mesmo com o hash autorizado original', async () => {
    const d = docs(); const i = inventory(); const p = pending();
    const plan = planCleanup(d, i, p, { minAgeDays: 30 }, now);
    const reader = { documents: async () => d, inventory: async () => i, pendingUploads: async () => p };
    const deleter = { delete: vi.fn() };
    plan.candidates = [key]; // Referência ativa inserida sem atualizar o hash revisado.
    await expect(applyCleanup(plan, reader, deleter, `DELETE ORPHANS ${plan.planHash}`, { minAgeDays: 30 }))
      .rejects.toThrow('Conteúdo do plano alterado');
    expect(deleter.delete).not.toHaveBeenCalled();
  });

  it('aplica somente o plano autorizado em arquivos sintéticos após releitura', async () => {
    const f = await fixture();
    const planFile = path.join(f.root, 'plan.json');
    const plan = cli('cleanup-plan', '--documents', f.documentsFile, '--inventory', f.inventoryFile,
      '--pending', f.pendingFile, '--policy', f.policyFile, '--out', planFile);
    const authorizationFile = path.join(f.root, 'authorization.txt');
    await writeFile(authorizationFile, `DELETE ORPHANS ${plan.planHash}`);
    const result = cli('cleanup-apply', '--plan', planFile, '--documents', f.documentsFile,
      '--inventory', f.inventoryFile, '--pending', f.pendingFile, '--policy', f.policyFile,
      '--assets', f.assets, '--authorization-file', authorizationFile);
    expect(result.deleted).toEqual(['rac/site/orphan.png']);
    await expect(readFile(path.join(f.assets, 'rac/site/orphan.png'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(path.join(f.assets, key))).toEqual(png);
    expect(await readFile(path.join(f.assets, 'rac/site/uploading.png'))).toEqual(png);
  });

  it('bloqueia arquivo alterado desde o inventário antes do unlink', async () => {
    const f = await fixture();
    const planFile = path.join(f.root, 'plan.json');
    const plan = cli('cleanup-plan', '--documents', f.documentsFile, '--inventory', f.inventoryFile,
      '--pending', f.pendingFile, '--policy', f.policyFile, '--out', planFile);
    const authorizationFile = path.join(f.root, 'authorization.txt');
    await writeFile(authorizationFile, `DELETE ORPHANS ${plan.planHash}`);
    const orphan = path.join(f.assets, 'rac/site/orphan.png');
    await writeFile(orphan, Buffer.from('alterado'));
    expect(() => cli('cleanup-apply', '--plan', planFile, '--documents', f.documentsFile,
      '--inventory', f.inventoryFile, '--pending', f.pendingFile, '--policy', f.policyFile,
      '--assets', f.assets, '--authorization-file', authorizationFile)).toThrow();
    expect(await readFile(orphan)).toEqual(Buffer.from('alterado'));
  });

  it('interrompe a limpeza quando surge referência antes do próximo objeto', async () => {
    const d = docs(); const i = inventory(); const p = pending();
    i.items.push({ key: 'rac/site/second.png', sizeBytes: png.length, sha256: sha256(png),
      contentType: 'image/png', updatedAt: old });
    i.evidence.expectedCount = i.items.length;
    const plan = planCleanup(d, i, p, { minAgeDays: 30 }, now);
    expect(plan.candidates).toEqual(['rac/site/orphan.png', 'rac/site/second.png']);
    const deleted: string[] = [];
    const reader = { documents: async () => d, inventory: async () => i, pendingUploads: async () => p };
    const deleter = { delete: vi.fn(async (assetKey: string) => {
      deleted.push(assetKey);
      (d.items[0].document as { constructionSite: { photoDataUrl: string } }).constructionSite.photoDataUrl =
        '/manus-storage/rac/site/second.png';
    }) };
    await expect(applyCleanup(plan, reader, deleter, `DELETE ORPHANS ${plan.planHash}`, { minAgeDays: 30 }))
      .rejects.toThrow('desatualizado');
    expect(deleted).toEqual(['rac/site/orphan.png']);
  });
});
