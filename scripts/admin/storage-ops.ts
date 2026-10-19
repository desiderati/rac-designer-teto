#!/usr/bin/env node
import { lstat, mkdir, readFile, realpath, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  applyCleanup, createBackup, GLOBAL_SCOPE, planCleanup, sha256, validKey, verifyBackup,
  type AssetDeleter, type AssetReader, type CleanupPlan, type DocumentSnapshot,
  type InventoryObject, type InventorySnapshot, type PendingSnapshot, type RetentionPolicy,
} from '../../server/admin/operations.ts';

function args(values: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let i = 0; i < values.length; i += 2) {
    if (!values[i]?.startsWith('--') || !values[i + 1] || values[i + 1].startsWith('--'))
      throw new Error('Argumentos devem ser pares --nome valor');
    const name = values[i].slice(2);
    if (name in options) throw new Error(`Argumento repetido: ${name}`);
    options[name] = values[i + 1];
  }
  return options;
}

function required(options: Record<string, string>, name: string): string {
  if (!options[name]) throw new Error(`Falta --${name}`);
  return options[name];
}

async function rejectSymlinkChain(target: string): Promise<void> {
  const absolute = path.resolve(target);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Link simbólico proibido: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
      throw error;
    }
  }
}

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

class DirectoryAssets implements AssetReader, AssetDeleter {
  constructor(private readonly root: string) {}

  private async file(key: string): Promise<string> {
    validKey(key);
    await rejectSymlinkChain(this.root);
    const root = await realpath(this.root);
    let current = root;
    for (const part of key.split('/')) {
      current = path.join(current, part);
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) throw new Error(`Link simbólico proibido: ${key}`);
    }
    if (!(await lstat(current)).isFile()) throw new Error(`Objeto não é arquivo: ${key}`);
    return current;
  }

  async read(key: string): Promise<Buffer> { return readFile(await this.file(key)); }
  async delete(key: string, expected: InventoryObject): Promise<void> {
    const file = await this.file(key);
    const bytes = await readFile(file);
    if (bytes.length !== expected.sizeBytes || sha256(bytes) !== expected.sha256)
      throw new Error(`Arquivo alterado desde o inventário: ${key}`);
    await unlink(file);
  }
}

async function run(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const o = args(rest);
  if (command === 'backup') {
    const documents = await json<DocumentSnapshot>(required(o, 'documents'));
    const inventory = await json<InventorySnapshot>(required(o, 'inventory'));
    const output = required(o, 'out');
    const bytes = await createBackup(documents, inventory, new DirectoryAssets(required(o, 'assets')));
    await rejectSymlinkChain(path.dirname(output));
    await writeFile(output, bytes, { flag: 'wx', mode: 0o600 });
    await writeFile(`${output}.sha256`, `${sha256(bytes)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ archive: output, sha256: sha256(bytes), documents: documents.items.length }));
    return;
  }
  if (command === 'backup-live') {
    if (required(o, 'authorize-live-read') !== 'CAPTURE_GLOBAL_BACKUP')
      throw new Error('Leitura real exige --authorize-live-read CAPTURE_GLOBAL_BACKUP');
    const output = required(o, 'out');
    const { liveBackupSources } = await import('../../server/admin/live-providers.ts');
    const { captureReferencedBackup } = await import('../../server/admin/live-capture.ts');
    const sources = await liveBackupSources();
    const result = await captureReferencedBackup(sources.documents, sources.assets);
    await rejectSymlinkChain(path.dirname(output));
    await writeFile(output, result.archive, { flag: 'wx', mode: 0o600 });
    await writeFile(`${output}.sha256`, `${sha256(result.archive)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ archive: output, sha256: sha256(result.archive),
      documents: result.documentCount, assets: result.assetCount, coverage: 'referenced-only' }));
    return;
  }
  if (command === 'verify' || command === 'restore') {
    const archive = required(o, 'archive');
    const expected = (await readFile(required(o, 'sha256-file'), 'utf8')).trim();
    const verified = await verifyBackup(await readFile(archive), expected);
    if (command === 'restore') {
      const output = required(o, 'out');
      await rejectSymlinkChain(path.dirname(output));
      await mkdir(output, { mode: 0o700 });
      const evidence = { source: `backup:${sha256(await readFile(archive))}`,
        capturedAt: verified.manifest.capturedAt };
      await writeFile(path.join(output, 'documents.json'), JSON.stringify({
        scopeKey: GLOBAL_SCOPE, complete: true,
        evidence: { ...evidence, expectedCount: verified.documents.length }, items: verified.documents,
      }, null, 2), { flag: 'wx', mode: 0o600 });
      const items = verified.manifest.assets.map(({ path: _path, ...item }) => item);
      await writeFile(path.join(output, 'inventory.json'), JSON.stringify({
        scopeKey: GLOBAL_SCOPE, complete: true, coverage: 'referenced-only',
        evidence: { ...evidence, expectedCount: items.length }, items,
      }, null, 2), { flag: 'wx', mode: 0o600 });
      for (const [key, data] of verified.assets) {
        const destination = path.join(output, 'assets', validKey(key));
        await rejectSymlinkChain(path.dirname(destination));
        await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
        await rejectSymlinkChain(path.dirname(destination));
        await writeFile(destination, data, { flag: 'wx', mode: 0o600 });
      }
    }
    console.log(JSON.stringify({ verified: true, documents: verified.documents.length,
      assets: verified.assets.size, isolatedOutput: command === 'restore' ? o.out : undefined }));
    return;
  }
  if (command === 'cleanup-plan' || command === 'cleanup-apply') {
    const documentsFile = required(o, 'documents');
    const inventoryFile = required(o, 'inventory');
    const pendingFile = required(o, 'pending');
    const policy = await json<RetentionPolicy>(required(o, 'policy'));
    const reader = {
      documents: () => json<DocumentSnapshot>(documentsFile),
      inventory: () => json<InventorySnapshot>(inventoryFile),
      pendingUploads: () => json<PendingSnapshot>(pendingFile),
    };
    if (command === 'cleanup-plan') {
      const [documents, inventory, pending] = await Promise.all([
        reader.documents(), reader.inventory(), reader.pendingUploads(),
      ]);
      const plan = planCleanup(documents, inventory, pending, policy, new Date().toISOString());
      await writeFile(required(o, 'out'), JSON.stringify(plan, null, 2), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ dryRun: true, candidates: plan.candidates, planHash: plan.planHash }));
      return;
    }
    const plan = await json<CleanupPlan>(required(o, 'plan'));
    const authorization = (await readFile(required(o, 'authorization-file'), 'utf8')).trim();
    const deleted = await applyCleanup(plan, reader, new DirectoryAssets(required(o, 'assets')),
      authorization, policy);
    console.log(JSON.stringify({ deleted }));
    return;
  }
  throw new Error('Comando: backup | backup-live | verify | restore | cleanup-plan | cleanup-apply');
}

run().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
