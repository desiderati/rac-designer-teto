import type {
  EditorObjectId,
  EditorPilotiId,
  EditorScreenPoint,
  EditorViewId,
} from './editor-ids.ts';
import type {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';

export const EDITOR_SELECTION_KINDS = [
  'piloti',
  'wall',
  'linear',
  'terrain',
  'contraventamento',
] as const;

export type EditorSelectionKind = typeof EDITOR_SELECTION_KINDS[number];

export type EditorHouseViewKind = 'top' | 'front' | 'back' | 'side';

export type EditorLinearSelectionKind = 'line' | 'arrow' | 'distance';

export type EditorContraventamentoSide = ContraventamentoSide;

export interface EditorPilotiSelection {
  type: 'piloti';
  pilotiId: EditorPilotiId;
  houseView: EditorHouseViewKind;
  screenPosition: EditorScreenPoint;
}

export interface EditorWallSelection {
  type: 'wall';
  objectId: EditorObjectId;
  currentLabel: string;
  screenPosition: EditorScreenPoint;
}

export interface EditorLinearSelection {
  type: 'linear';
  objectId: EditorObjectId;
  linearType: EditorLinearSelectionKind;
  currentLabel: string;
  currentColor: string;
  screenPosition: EditorScreenPoint;
}

export interface EditorTerrainSelection {
  type: 'terrain';
  viewId: EditorViewId;
  terrainType: number;
  screenPosition: EditorScreenPoint;
}

export interface EditorContraventamentoSelection {
  type: 'contraventamento';
  viewId: EditorViewId;
  contraventamentoId: EditorObjectId;
  side: EditorContraventamentoSide;
}

/**
 * Seleção pública do editor.
 *
 * Este contrato representa a intenção sem carregar objetos de runtime gráfico.
 * Ele pode ser salvo, testado e trafegado entre UI, store e commands sem Fabric.
 */
export type EditorSelection =
  | EditorPilotiSelection
  | EditorWallSelection
  | EditorLinearSelection
  | EditorTerrainSelection
  | EditorContraventamentoSelection;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasRuntimeLeak(value: Record<string, unknown>): boolean {
  return 'group' in value
    || 'canvas' in value
    || 'target' in value
    || 'subTargets' in value
    || 'runtimeCanvas' in value;
}

function isPoint(value: unknown): value is EditorScreenPoint {
  return isRecord(value)
    && Number.isFinite(value.x)
    && Number.isFinite(value.y);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isHouseViewKind(value: unknown): value is EditorHouseViewKind {
  return value === 'top' || value === 'front' || value === 'back' || value === 'side';
}

function isLinearSelectionKind(value: unknown): value is EditorLinearSelectionKind {
  return value === 'line' || value === 'arrow' || value === 'distance';
}

function isContraventamentoSide(value: unknown): value is EditorContraventamentoSide {
  return isContraventamentoVerticalSide(value) || isContraventamentoHorizontalSide(value);
}

/**
 * Verifica em runtime se um valor respeita o contrato público de seleção.
 *
 * O guard rejeita propriedades típicas de eventos/objetos Fabric para evitar
 * que a camada pública volte a carregar runtime visual por conveniência.
 */
export function isEditorSelection(value: unknown): value is EditorSelection {
  if (!isRecord(value) || hasRuntimeLeak(value)) return false;

  switch (value.type) {
    case 'piloti':
      return isString(value.pilotiId)
        && isHouseViewKind(value.houseView)
        && isPoint(value.screenPosition);

    case 'wall':
      return isString(value.objectId)
        && isText(value.currentLabel)
        && isPoint(value.screenPosition);

    case 'linear':
      return isString(value.objectId)
        && isLinearSelectionKind(value.linearType)
        && isText(value.currentLabel)
        && isString(value.currentColor)
        && isPoint(value.screenPosition);

    case 'terrain':
      return isString(value.viewId)
        && Number.isFinite(value.terrainType)
        && isPoint(value.screenPosition);

    case 'contraventamento':
      return isString(value.viewId)
        && isString(value.contraventamentoId)
        && isContraventamentoSide(value.side);

    default:
      return false;
  }
}
