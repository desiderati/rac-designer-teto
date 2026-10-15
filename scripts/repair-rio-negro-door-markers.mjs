#!/usr/bin/env node
/**
 * Corrige o deslocamento transversal dos marcadores de porta da Visão Planta.
 *
 * A posição longitudinal permanece a mesma; somente o centro transversal é
 * recuado pela metade da espessura visual do marcador, fazendo a porta entrar
 * na borda do corpo em vez de ficar totalmente para fora.
 *
 * Uso:
 *   node scripts/repair-rio-negro-door-markers.mjs            # dry-run
 *   node scripts/repair-rio-negro-door-markers.mjs --apply    # backup + update CAS
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
const FOOTPRINT_WIDTH = 610;
const FOOTPRINT_DEPTH = 300;
const FRONT_BACK_DOOR_SHIFT = 30;
const FRONT_BACK_WINDOW_SHIFT = 30;
const WINDOW_WIDTH = 80;
const DOOR_WIDTH = 80;
const SIDE_DOOR_SHIFT = 45;
const SOURCE_VIEW_BY_TYPE = {tipo6: 'front', tipo3: 'side2'};
const APPLY = process.argv.includes('--apply');
const EPSILON = 1e-6;

function finite(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nearlyEqual(a, b) {
  return Math.abs(finite(a) - finite(b)) <= EPSILON;
}

function getTopGroup(drawingDocument) {
  return drawingDocument?.canvas?.objects?.find((object) =>
    object?.kind === 'house' && object?.metadata?.houseView === 'top');
}

function resolveMarkerSide(houseState) {
  const sourceView = SOURCE_VIEW_BY_TYPE[houseState?.houseType];
  if (!sourceView) return null;
  const sideMappings = houseState.sideMappings ?? {};
  for (const side of ['top', 'bottom', 'left', 'right']) {
    if (sideMappings[side] === sourceView) return side;
  }
  const preAssigned = houseState.preAssignedSides ?? {};
  return ['top', 'bottom', 'left', 'right'].includes(preAssigned[sourceView])
    ? preAssigned[sourceView]
    : null;
}

function calculateDoorGeometry(side, bodyWidth, bodyHeight) {
  if (side === 'top' || side === 'bottom') {
    const scale = bodyWidth / FOOTPRINT_WIDTH;
    const doorWidth = DOOR_WIDTH * scale;
    const doorX = bodyWidth - WINDOW_WIDTH * scale - FRONT_BACK_WINDOW_SHIFT * scale
      - doorWidth - FRONT_BACK_DOOR_SHIFT * scale;
    return {doorX, doorWidth};
  }

  const scale = bodyHeight / FOOTPRINT_DEPTH;
  return {
    doorX: bodyHeight - DOOR_WIDTH * scale - SIDE_DOOR_SHIFT * scale,
    doorWidth: DOOR_WIDTH * scale,
  };
}

function calculatePlacement({side, doorX, doorWidth, bodyWidth, bodyHeight, markerThickness}) {
  const axisLength = side === 'top' || side === 'bottom' ? bodyWidth : bodyHeight;
  const doorCenter = Math.max(0, Math.min(axisLength, doorX + doorWidth / 2));
  const inset = Math.max(0, markerThickness) / 2;
  if (side === 'top') return {left: bodyWidth / 2 - doorCenter, top: -bodyHeight / 2 + inset};
  if (side === 'bottom') return {left: -bodyWidth / 2 + doorCenter, top: bodyHeight / 2 - inset};
  if (side === 'left') return {left: -bodyWidth / 2 + inset, top: -bodyHeight / 2 + doorCenter};
  return {left: bodyWidth / 2 - inset, top: bodyHeight / 2 - doorCenter};
}

function repairHouse(house) {
  const drawingDocument = house?.drawingDocument;
  const houseState = drawingDocument?.house;
  const topGroup = getTopGroup(drawingDocument);
  const side = resolveMarkerSide(houseState);
  if (!topGroup || !houseState?.houseType || !side) {
    return {changed: false, reason: 'Planta, tipo ou lado ativo ausente'};
  }

  const body = topGroup.children?.find((child) => child?.metadata?.isHouseBody);
  const marker = topGroup.children?.find((child) =>
    child?.metadata?.isTopDoorMarker
    && child?.metadata?.doorMarkerSide === side
    && child?.style?.visible === true);
  if (!body || !marker) {
    return {changed: false, reason: 'corpo ou marcador ativo ausente', side};
  }

  const bodyWidth = Math.max(1, finite(body.geometry?.width) * finite(body.geometry?.scaleX, 1));
  const bodyHeight = Math.max(1, finite(body.geometry?.height) * finite(body.geometry?.scaleY, 1));
  const markerWidth = Math.abs(finite(marker.geometry?.width) * finite(marker.geometry?.scaleX, 1));
  const markerHeight = Math.abs(finite(marker.geometry?.height) * finite(marker.geometry?.scaleY, 1));
  const markerThickness = side === 'top' || side === 'bottom' ? markerHeight : markerWidth;
  const door = calculateDoorGeometry(side, bodyWidth, bodyHeight);
  const target = calculatePlacement({side, ...door, bodyWidth, bodyHeight, markerThickness});
  const before = {left: marker.geometry?.left, top: marker.geometry?.top};
  const changed = !nearlyEqual(before.left, target.left) || !nearlyEqual(before.top, target.top);

  if (changed) {
    marker.geometry.left = target.left;
    marker.geometry.top = target.top;
  }

  return {
    changed,
    reason: changed ? 'encaixe transversal dentro da borda' : 'já encaixado',
    side,
    houseType: houseState.houseType,
    before,
    after: target,
    body: {width: bodyWidth, height: bodyHeight},
    markerThickness,
  };
}

function format(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(4)) : value;
}

function reportRow({familyName, houseId, result}) {
  return {
    familyName,
    houseId,
    type: result.houseType ?? null,
    side: result.side ?? null,
    changed: result.changed,
    reason: result.reason,
    before: result.before ? `${format(result.before.left)}, ${format(result.before.top)}` : null,
    after: result.after ? `${format(result.after.left)}, ${format(result.after.top)}` : null,
    markerThickness: format(result.markerThickness),
  };
}

async function writeBackup(payload, documentVersion) {
  const directory = path.resolve('recovery-backups');
  await fs.mkdir(directory, {recursive: true, mode: 0o700});
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(directory, `rio-negro-before-door-repair-v${documentVersion}-${timestamp}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {mode: 0o600});
  return filePath;
}

function readDocument(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function getTargetHouses(document) {
  const familyNames = new Map((document.families ?? []).map((family) => [family.id, family.name]));
  const targetHouses = (document.houses ?? []).filter((house) =>
    TARGET_FAMILY_NAMES.has(familyNames.get(house.familyId)));
  const foundNames = new Set(targetHouses.map((house) => familyNames.get(house.familyId)));
  const missingNames = [...TARGET_FAMILY_NAMES].filter((name) => !foundNames.has(name));
  if (missingNames.length > 0) {
    throw new Error(`Famílias-alvo não encontradas: ${missingNames.join(', ')}.`);
  }
  return {familyNames, targetHouses};
}

async function verifyDocument(db, expectedVersion, expectedDocument) {
  const [rows] = await db.execute(
    `SELECT document, documentVersion
       FROM construction_site_documents
      WHERE id = ? AND scopeKey = ?`,
    [CONSTRUCTION_SITE_ID, SCOPE_KEY],
  );
  const persisted = rows[0];
  if (!persisted || Number(persisted.documentVersion) !== expectedVersion) {
    throw new Error('Verificação pós-gravação falhou: versão remota inesperada.');
  }
  const actual = readDocument(persisted.document);
  const {familyNames, targetHouses} = getTargetHouses(actual);
  for (const house of targetHouses) {
    const result = repairHouse(clone(house));
    if (result.changed) {
      throw new Error(`Verificação pós-gravação falhou para ${familyNames.get(house.familyId)}: marcador não está idempotente.`);
    }
  }
  void expectedDocument;
  return persisted;
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

    const originalDocument = readDocument(persisted.document);
    const repairedDocument = clone(originalDocument);
    const {familyNames, targetHouses} = getTargetHouses(repairedDocument);
    const results = targetHouses.map((house) => ({
      familyName: familyNames.get(house.familyId),
      houseId: house.id,
      result: repairHouse(house.drawingDocument ? house : null),
    }));
    console.table(results.map(reportRow));

    const changed = results.some(({result}) => result.changed);
    if (!APPLY) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        constructionSiteId: CONSTRUCTION_SITE_ID,
        documentVersion: persisted.documentVersion,
        changed,
        changedHouses: results.filter(({result}) => result.changed).map(({familyName, houseId, result}) => ({
          familyName,
          houseId,
          side: result.side,
          before: result.before,
          after: result.after,
        })),
      }, null, 2));
      return;
    }

    if (!changed) {
      await db.rollback();
      console.log('Nenhum marcador precisava de reparação; transação revertida.');
      return;
    }

    const previousVersion = Number(persisted.documentVersion);
    const nextVersion = previousVersion + 1;
    repairedDocument.constructionSite = {
      ...repairedDocument.constructionSite,
      documentVersion: nextVersion,
    };
    const backupPath = await writeBackup({
      constructionSiteId: CONSTRUCTION_SITE_ID,
      scopeKey: SCOPE_KEY,
      documentVersion: previousVersion,
      updatedAt: persisted.updatedAt,
      repairedFamilies: results.filter(({result}) => result.changed).map(({familyName, houseId}) => ({familyName, houseId})),
      document: originalDocument,
    }, previousVersion);

    const [update] = await db.execute(
      `UPDATE construction_site_documents
          SET document = ?, documentVersion = documentVersion + 1, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND scopeKey = ? AND documentVersion = ?`,
      [JSON.stringify(repairedDocument), CONSTRUCTION_SITE_ID, SCOPE_KEY, previousVersion],
    );
    if (update.affectedRows !== 1) {
      throw new Error('A versão do documento mudou durante a reparação; nenhuma alteração foi confirmada.');
    }
    await db.commit();
    await verifyDocument(db, nextVersion, repairedDocument);
    console.log(JSON.stringify({
      mode: 'applied',
      constructionSiteId: CONSTRUCTION_SITE_ID,
      previousDocumentVersion: previousVersion,
      documentVersion: nextVersion,
      backupPath,
      repairedFamilies: results.filter(({result}) => result.changed).map(({familyName, houseId, result}) => ({
        familyName,
        houseId,
        side: result.side,
        before: result.before,
        after: result.after,
      })),
      verification: 'idempotente',
    }, null, 2));
  } catch (error) {
    if (APPLY) await db.rollback().catch(() => undefined);
    throw error;
  } finally {
    await db.end();
  }
}

await main();
