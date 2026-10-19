import { createHash } from 'node:crypto';
import JSZip from 'jszip';

export const GLOBAL_SCOPE = 'rac-designer-teto-global';
export const FORMAT_VERSION = 1;
export const MAX_ASSET_BYTES = 7.5 * 1024 * 1024;
const ROUTES = ['/api/private-storage/', '/manus-storage/'];

export type CanonicalRow = {
  id: string;
  scopeKey: string;
  externalCode: string;
  status: string;
  document: unknown;
  documentVersion: number;
  createdAt: string;
  updatedAt: string;
};
export type InventoryObject = {
  key: string;
  sizeBytes: number;
  sha256: string;
  contentType: string;
  updatedAt: string;
};
export type CompleteSnapshot<T> = {
  scopeKey: string;
  complete: true;
  evidence: { source: string; expectedCount: number; capturedAt: string };
  items: T[];
};
export type DocumentSnapshot = CompleteSnapshot<CanonicalRow>;
export type InventorySnapshot = CompleteSnapshot<InventoryObject> & {
  coverage: 'all-objects' | 'referenced-only';
};
export type PendingSnapshot = CompleteSnapshot<{ key: string }>;

export interface AssetReader { read(key: string): Promise<Buffer> }
export interface AssetDeleter { delete(key: string, expected: InventoryObject): Promise<void> }
export interface SnapshotReader {
  documents(): Promise<DocumentSnapshot>;
  inventory(): Promise<InventorySnapshot>;
  pendingUploads(): Promise<PendingSnapshot>;
}

export function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function iso(value: string): number {
  const time = Date.parse(value);
  assert(Number.isFinite(time) && new Date(time).toISOString() === value, 'Data ISO inválida');
  return time;
}

function snapshot<T>(value: CompleteSnapshot<T>, label: string): void {
  assert(value?.scopeKey === GLOBAL_SCOPE && value.complete === true, `${label}: escopo ou completude inválido`);
  assert(Array.isArray(value.items) && value.evidence?.source?.trim(), `${label}: evidência ausente`);
  assert(Number.isSafeInteger(value.evidence.expectedCount) && value.evidence.expectedCount === value.items.length,
    `${label}: contagem de completude divergente`);
  iso(value.evidence.capturedAt);
}

export function validKey(key: string): string {
  assert(typeof key === 'string' && key.length > 0 && key.length <= 1024, 'Chave inválida');
  assert(!key.startsWith('/') && !key.includes('\\') && !key.includes('?') && !key.includes('#') && !key.includes('%'),
    `Chave insegura: ${key}`);
  assert(key.split('/').every(part => part && part !== '.' && part !== '..' &&
    ![...part].some(character => character.charCodeAt(0) < 32)),
    `Chave insegura: ${key}`);
  return key;
}

export function references(document: unknown): string[] {
  const found = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      const route = ROUTES.find(prefix => value.startsWith(prefix));
      if (route) found.add(validKey(value.slice(route.length)));
      else assert(!ROUTES.some(prefix => value.includes(prefix)), `Referência de Storage inválida: ${value}`);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      for (const [name, child] of Object.entries(value)) {
        if (name === 'storageKey') {
          assert(typeof child === 'string', 'storageKey inválida');
          found.add(validKey(child));
        } else visit(child);
      }
    }
  };
  visit(document);
  return [...found].sort();
}

function checkedDocuments(value: DocumentSnapshot): CanonicalRow[] {
  snapshot(value, 'documentos');
  const ids = new Set<string>();
  for (const row of value.items) {
    assert(row.scopeKey === GLOBAL_SCOPE && typeof row.id === 'string' && row.id.length > 0 && !ids.has(row.id),
      'ID ou escopo de documento inválido/duplicado');
    ids.add(row.id);
    assert(Number.isSafeInteger(row.documentVersion) && row.documentVersion > 0, 'Versão de documento inválida');
    assert(typeof row.externalCode === 'string' && typeof row.status === 'string', 'Metadados de documento inválidos');
    iso(row.createdAt); iso(row.updatedAt);
    assert(row.document && typeof row.document === 'object', 'Payload de documento inválido');
    const site = (row.document as { constructionSite?: { id?: unknown; documentVersion?: unknown } }).constructionSite;
    assert(site?.id === row.id && site?.documentVersion === row.documentVersion,
      'ID/versão do payload diverge do registro canônico');
    references(row.document);
  }
  return [...value.items].sort((a, b) => a.id.localeCompare(b.id));
}

export function referencedKeys(value: DocumentSnapshot): string[] {
  return [...new Set(checkedDocuments(value).flatMap(row => references(row.document)))].sort();
}

function checkedInventory(value: InventorySnapshot): Map<string, InventoryObject> {
  snapshot(value, 'inventário');
  assert(value.coverage === 'all-objects' || value.coverage === 'referenced-only',
    'Cobertura do inventário inválida');
  const objects = new Map<string, InventoryObject>();
  for (const object of value.items) {
    validKey(object.key);
    assert(!objects.has(object.key), 'Chave duplicada no inventário');
    assert(Number.isSafeInteger(object.sizeBytes) && object.sizeBytes >= 0 && object.sizeBytes <= MAX_ASSET_BYTES,
      `Asset acima do limite ou tamanho inválido: ${object.key}`);
    assert(/^[a-f0-9]{64}$/.test(object.sha256) && typeof object.contentType === 'string' && object.contentType.length > 0,
      'Hash ou tipo de asset inválido');
    iso(object.updatedAt);
    objects.set(object.key, object);
  }
  return objects;
}

function checkImageSignature(object: InventoryObject, data: Buffer): void {
  const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255;
  const webp = data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
  if (object.contentType === 'image/png') assert(png, `Assinatura PNG inválida: ${object.key}`);
  if (object.contentType === 'image/jpeg') assert(jpeg, `Assinatura JPEG inválida: ${object.key}`);
  if (object.contentType === 'image/webp') assert(webp, `Assinatura WebP inválida: ${object.key}`);
}

function checkedPending(value: PendingSnapshot): Set<string> {
  snapshot(value, 'uploads pendentes');
  const keys = new Set<string>();
  for (const item of value.items) {
    validKey(item.key);
    assert(!keys.has(item.key), 'Upload pendente duplicado');
    keys.add(item.key);
  }
  return keys;
}

type BackupManifest = {
  formatVersion: 1;
  scopeKey: string;
  capturedAt: string;
  documentEvidence: DocumentSnapshot['evidence'];
  inventoryEvidence: InventorySnapshot['evidence'];
  inventoryCoverage: 'referenced-only';
  documents: { id: string; path: string; sha256: string }[];
  assets: (InventoryObject & { path: string })[];
};

export async function createBackup(documents: DocumentSnapshot, inventory: InventorySnapshot,
  reader: AssetReader): Promise<Buffer> {
  const rows = checkedDocuments(documents);
  const objects = checkedInventory(inventory);
  const keys = new Set(rows.flatMap(row => references(row.document)));
  const zip = new JSZip();
  const manifest: BackupManifest = {
    formatVersion: FORMAT_VERSION, scopeKey: GLOBAL_SCOPE, capturedAt: new Date().toISOString(),
    documentEvidence: documents.evidence, inventoryEvidence: inventory.evidence,
    inventoryCoverage: 'referenced-only', documents: [], assets: [],
  };
  for (const [index, row] of rows.entries()) {
    const bytes = Buffer.from(JSON.stringify(row));
    const path = `documents/${String(index).padStart(6, '0')}.json`;
    zip.file(path, bytes);
    manifest.documents.push({ id: row.id, path, sha256: sha256(bytes) });
  }
  for (const [index, key] of [...keys].sort().entries()) {
    const object = objects.get(key);
    assert(object, `Referência sem objeto no inventário: ${key}`);
    const bytes = await reader.read(key);
    assert(bytes.length === object.sizeBytes && bytes.length <= MAX_ASSET_BYTES && sha256(bytes) === object.sha256,
      `Binário ausente/corrompido: ${key}`);
    checkImageSignature(object, bytes);
    const path = `assets/${String(index).padStart(6, '0')}.bin`;
    zip.file(path, bytes);
    manifest.assets.push({ ...object, path });
  }
  zip.file('manifest.json', JSON.stringify(manifest));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function verifyBackup(bytes: Buffer, expectedArchiveHash: string): Promise<{
  manifest: BackupManifest; documents: CanonicalRow[]; assets: Map<string, Buffer>;
}> {
  assert(/^[a-f0-9]{64}$/.test(expectedArchiveHash) && sha256(bytes) === expectedArchiveHash,
    'Hash externo do arquivo de backup divergente');
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const manifestFile = zip.file('manifest.json');
  assert(manifestFile, 'Manifesto ausente');
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupManifest;
  assert(manifest.formatVersion === FORMAT_VERSION && manifest.scopeKey === GLOBAL_SCOPE, 'Formato/escopo incompatível');
  assert(Array.isArray(manifest.documents) && Array.isArray(manifest.assets), 'Manifesto incompleto');
  iso(manifest.capturedAt);
  const expectedPaths = new Set(['manifest.json', ...manifest.documents.map(item => item.path),
    ...manifest.assets.map(item => item.path)]);
  assert(expectedPaths.size === 1 + manifest.documents.length + manifest.assets.length,
    'Caminhos duplicados no backup');
  assert(Object.keys(zip.files).filter(path => !zip.files[path].dir).length === expectedPaths.size &&
    Object.keys(zip.files).filter(path => !zip.files[path].dir).every(path => expectedPaths.has(path)),
  'Arquivos não declarados no backup');
  const rows: CanonicalRow[] = [];
  for (const item of manifest.documents) {
    assert(/^documents\/\d{6}\.json$/.test(item.path) && zip.file(item.path), 'Caminho de documento inválido');
    const data = await zip.file(item.path)!.async('nodebuffer');
    assert(sha256(data) === item.sha256, 'Hash de documento divergente');
    const row = JSON.parse(data.toString()) as CanonicalRow;
    assert(row.id === item.id, 'ID de documento divergente');
    rows.push(row);
  }
  checkedDocuments({ scopeKey: GLOBAL_SCOPE, complete: true,
    evidence: { source: 'backup', expectedCount: rows.length, capturedAt: manifest.capturedAt }, items: rows });
  const assets = new Map<string, Buffer>();
  for (const item of manifest.assets) {
    assert(/^assets\/\d{6}\.bin$/.test(item.path) && zip.file(item.path), 'Caminho de asset inválido');
    const data = await zip.file(item.path)!.async('nodebuffer');
    assert(data.length === item.sizeBytes && data.length <= MAX_ASSET_BYTES && sha256(data) === item.sha256,
      `Hash/tamanho de asset divergente: ${item.key}`);
    checkImageSignature(item, data);
    assets.set(item.key, data);
  }
  checkedInventory({ scopeKey: GLOBAL_SCOPE, complete: true,
    evidence: { source: 'backup', expectedCount: manifest.assets.length, capturedAt: manifest.capturedAt },
    coverage: manifest.inventoryCoverage, items: manifest.assets });
  assert(assets.size === manifest.assets.length, 'Asset duplicado no backup');
  for (const row of rows) for (const key of references(row.document))
    assert(assets.has(key), `Referência não reconstituível: ${key}`);
  return { manifest, documents: rows, assets };
}

export type RetentionPolicy = { minAgeDays: number };
export type CleanupPlan = {
  scopeKey: string; plannedAt: string; policy: RetentionPolicy;
  candidates: string[]; snapshotHash: string; planHash: string;
};

export function planCleanup(documents: DocumentSnapshot, inventory: InventorySnapshot,
  pending: PendingSnapshot, policy: RetentionPolicy, plannedAt: string): CleanupPlan {
  const rows = checkedDocuments(documents);
  const objects = checkedInventory(inventory);
  assert(inventory.coverage === 'all-objects', 'Inventário global completo é obrigatório para limpeza');
  const pendingKeys = checkedPending(pending);
  assert(Number.isSafeInteger(policy.minAgeDays) && policy.minAgeDays >= 0, 'Política de retenção inválida');
  const cutoff = iso(plannedAt) - policy.minAgeDays * 86400000;
  const active = new Set(rows.flatMap(row => references(row.document)));
  const candidates = [...objects.values()].filter(item => !active.has(item.key) && !pendingKeys.has(item.key) &&
    iso(item.updatedAt) <= cutoff).map(item => item.key).sort();
  const state = { documents: rows, inventory: [...objects.values()].sort((a, b) => a.key.localeCompare(b.key)),
    pending: [...pendingKeys].sort() };
  const base = { scopeKey: GLOBAL_SCOPE, plannedAt, policy, candidates,
    snapshotHash: sha256(JSON.stringify(state)) };
  return { ...base, planHash: sha256(JSON.stringify(base)) };
}

export async function applyCleanup(saved: CleanupPlan, current: SnapshotReader, deleter: AssetDeleter,
  authorization: string, policy: RetentionPolicy): Promise<string[]> {
  assert(authorization === `DELETE ORPHANS ${saved.planHash}`, 'Autorização específica ausente');
  assert(JSON.stringify(policy) === JSON.stringify(saved.policy), 'Política de retenção divergente');
  const base = { scopeKey: saved.scopeKey, plannedAt: saved.plannedAt, policy: saved.policy,
    candidates: saved.candidates, snapshotHash: saved.snapshotHash };
  assert(sha256(JSON.stringify(base)) === saved.planHash, 'Conteúdo do plano alterado');
  const deleted: string[] = [];
  for (const key of saved.candidates) {
    const [documents, inventory, pending] = await Promise.all([
      current.documents(), current.inventory(), current.pendingUploads(),
    ]);
    const fresh = planCleanup(documents, inventory, pending, policy, saved.plannedAt);
    assert(fresh.planHash === saved.planHash, 'Plano desatualizado; refaça o dry-run');
    assert(fresh.candidates.includes(key), 'Objeto não elegível para exclusão');
    const item = inventory.items.find(object => object.key === key);
    assert(item && iso(item.updatedAt) <= Date.now() - policy.minAgeDays * 86400000,
      'Retenção não satisfeita no momento da execução');
    await deleter.delete(key, item);
    deleted.push(key);
  }
  return deleted;
}
