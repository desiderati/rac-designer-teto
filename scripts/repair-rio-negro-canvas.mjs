#!/usr/bin/env node
/**
 * Repara documentos RAC cuja geometria inteira foi persistida em torno da
 * origem (0, 0), em vez do centro da superfície lógica. A reparação traduz
 * apenas os objetos de primeiro nível: filhos, escalas, ângulos, textos,
 * imagens, pilotis, níveis e metadados permanecem intactos.
 *
 * Uso:
 *   node scripts/repair-rio-negro-canvas.mjs            # relatório, sem escrita
 *   node scripts/repair-rio-negro-canvas.mjs --apply    # backup + update CAS
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const CONSTRUCTION_SITE_ID = 'construction_1790293794322_1s9a7e';
const SCOPE_KEY = 'rac-designer-teto-global';
const TARGET_FAMILY_NAMES = new Set([
  'Aline',
  'Ana Beatriz',
  'Patrícia',
  'Rose',
  'Teresinha do Carmo',
  'Vanderlei Norio',
]);

// Valores de CANVAS_DEFAULTS em client/src/shared/config.ts.
const CANVAS_WIDTH = 1667;
const CANVAS_HEIGHT = 1300;
const MISPLACED_TOLERANCE_PX = 32;
const APPLY = process.argv.includes('--apply');

function finite(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function originOffset(origin, span) {
  if (origin === 'center') return 0;
  if (origin === 'right' || origin === 'bottom') return -span / 2;
  return span / 2;
}

function getElementBounds(element) {
  const geometry = element?.geometry ?? {};
  const style = element?.style ?? {};
  const width = Math.abs(finite(geometry.width) * finite(geometry.scaleX, 1));
  const height = Math.abs(finite(geometry.height) * finite(geometry.scaleY, 1));
  const angle = finite(geometry.angle) * Math.PI / 180;
  const rotatedWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
  const rotatedHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));

  const centerX = finite(geometry.left) + originOffset(style.originX, width);
  const centerY = finite(geometry.top) + originOffset(style.originY, height);

  return {
    left: centerX - rotatedWidth / 2,
    top: centerY - rotatedHeight / 2,
    right: centerX + rotatedWidth / 2,
    bottom: centerY + rotatedHeight / 2,
  };
}

function getCanvasBounds(objects) {
  if (!Array.isArray(objects) || objects.length === 0) return null;
  return objects.map(getElementBounds).reduce((bounds, next) => ({
    left: Math.min(bounds.left, next.left),
    top: Math.min(bounds.top, next.top),
    right: Math.max(bounds.right, next.right),
    bottom: Math.max(bounds.bottom, next.bottom),
  }), {
    left: Number.POSITIVE_INFINITY,
    top: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    bottom: Number.NEGATIVE_INFINITY,
  });
}

function getBoundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

function repairDrawingPlacement(drawingDocument) {
  const objects = drawingDocument?.canvas?.objects;
  const boundsBefore = getCanvasBounds(objects);
  if (!boundsBefore) return {changed: false, reason: 'sem objetos', boundsBefore, boundsAfter: boundsBefore, delta: null};

  const centerBefore = getBoundsCenter(boundsBefore);
  const targetCenter = {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2};
  const delta = {
    x: targetCenter.x - centerBefore.x,
    y: targetCenter.y - centerBefore.y,
  };

  const isMisplaced = Math.abs(delta.x) > MISPLACED_TOLERANCE_PX
    || Math.abs(delta.y) > MISPLACED_TOLERANCE_PX;
  if (!isMisplaced) {
    return {changed: false, reason: 'já centralizado', boundsBefore, boundsAfter: boundsBefore, delta};
  }

  for (const element of objects) {
    if (!element?.geometry) continue;
    if (typeof element.geometry.left === 'number') element.geometry.left += delta.x;
    if (typeof element.geometry.top === 'number') element.geometry.top += delta.y;
  }

  return {
    changed: true,
    reason: 'translação conjunta dos objetos de primeiro nível',
    boundsBefore,
    boundsAfter: getCanvasBounds(objects),
    delta,
  };
}

function format(value) {
  return Number(value.toFixed(2));
}

function reportRow({familyName, houseId, result}) {
  const before = result.boundsBefore;
  const after = result.boundsAfter;
  return {
    familyName,
    houseId,
    changed: result.changed,
    reason: result.reason,
    deltaX: result.delta ? format(result.delta.x) : null,
    deltaY: result.delta ? format(result.delta.y) : null,
    before: before ? `${format(before.left)}, ${format(before.top)} → ${format(before.right)}, ${format(before.bottom)}` : null,
    after: after ? `${format(after.left)}, ${format(after.top)} → ${format(after.right)}, ${format(after.bottom)}` : null,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeBackup(payload, documentVersion) {
  const directory = path.resolve('recovery-backups');
  await fs.mkdir(directory, {recursive: true, mode: 0o700});
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(directory, `rio-negro-before-repair-v${documentVersion}-${timestamp}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {mode: 0o600});
  return filePath;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não está disponível.');
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    if (APPLY) await db.beginTransaction();

    const [rows] = await db.execute(
      `SELECT document, documentVersion, updatedAt
       FROM construction_site_documents
       WHERE id = ? AND scopeKey = ?${APPLY ? ' FOR UPDATE' : ''}`,
      [CONSTRUCTION_SITE_ID, SCOPE_KEY],
    );
    const persisted = rows[0];
    if (!persisted) throw new Error('A Construção TETO de Rio Negro não foi localizada.');

    const originalDocument = typeof persisted.document === 'string'
      ? JSON.parse(persisted.document)
      : persisted.document;
    const repairedDocument = clone(originalDocument);
    const familyNames = new Map(repairedDocument.families.map((family) => [family.id, family.name]));
    const targetHouses = repairedDocument.houses.filter((house) => TARGET_FAMILY_NAMES.has(familyNames.get(house.familyId)));

    const foundNames = new Set(targetHouses.map((house) => familyNames.get(house.familyId)));
    const missingNames = [...TARGET_FAMILY_NAMES].filter((name) => !foundNames.has(name));
    if (missingNames.length > 0) throw new Error(`Famílias-alvo não encontradas: ${missingNames.join(', ')}.`);

    const results = targetHouses.map((house) => ({
      familyName: familyNames.get(house.familyId),
      houseId: house.id,
      result: repairDrawingPlacement(house.drawingDocument),
    }));
    console.table(results.map(reportRow));

    const changed = results.some(({result}) => result.changed);
    if (!APPLY) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        constructionSiteId: CONSTRUCTION_SITE_ID,
        documentVersion: persisted.documentVersion,
        changed,
      }, null, 2));
      return;
    }

    if (!changed) {
      await db.rollback();
      console.log('Nenhuma geometria precisava de reparação; transação revertida.');
      return;
    }

    const nextDocumentVersion = Number(persisted.documentVersion) + 1;
    repairedDocument.constructionSite = {
      ...repairedDocument.constructionSite,
      documentVersion: nextDocumentVersion,
    };

    const backupPath = await writeBackup({
      constructionSiteId: CONSTRUCTION_SITE_ID,
      scopeKey: SCOPE_KEY,
      documentVersion: persisted.documentVersion,
      updatedAt: persisted.updatedAt,
      repairedFamilies: results.map(({familyName, houseId}) => ({familyName, houseId})),
      document: originalDocument,
    }, persisted.documentVersion);

    const [update] = await db.execute(
      `UPDATE construction_site_documents
       SET document = ?, documentVersion = documentVersion + 1, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND scopeKey = ? AND documentVersion = ?`,
      [JSON.stringify(repairedDocument), CONSTRUCTION_SITE_ID, SCOPE_KEY, persisted.documentVersion],
    );
    if (update.affectedRows !== 1) {
      throw new Error('A versão do documento mudou durante a reparação; nenhuma alteração foi confirmada.');
    }

    await db.commit();
    console.log(JSON.stringify({
      mode: 'applied',
      constructionSiteId: CONSTRUCTION_SITE_ID,
      previousDocumentVersion: persisted.documentVersion,
      documentVersion: nextDocumentVersion,
      backupPath,
      repairedFamilies: results.filter(({result}) => result.changed).map(({familyName, houseId}) => ({familyName, houseId})),
    }, null, 2));
  } catch (error) {
    if (APPLY) await db.rollback().catch(() => undefined);
    throw error;
  } finally {
    await db.end();
  }
}

await main();
