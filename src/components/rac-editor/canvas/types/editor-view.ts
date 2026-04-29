import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {EditorViewId} from './editor-ids.ts';

export interface EditorViewRef {
  viewId: EditorViewId;
  viewType: HouseViewType;
  side?: HouseSide;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHouseViewType(value: unknown): value is HouseViewType {
  return value === 'top'
    || value === 'front'
    || value === 'back'
    || value === 'side1'
    || value === 'side2';
}

function isHouseSide(value: unknown): value is HouseSide {
  return value === 'top'
    || value === 'bottom'
    || value === 'left'
    || value === 'right';
}

/**
 * Referência serializável de uma vista da casa.
 *
 * Substitui gradualmente o uso público de objetos do runtime visual como
 * identificadores de vista, mantendo apenas identidade, tipo e lado lógico.
 */
export function isEditorViewRef(value: unknown): value is EditorViewRef {
  if (!isRecord(value)) return false;
  if ('group' in value || 'canvas' in value || 'target' in value) return false;
  if (typeof value.viewId !== 'string' || value.viewId.length === 0) return false;
  if (!isHouseViewType(value.viewType)) return false;
  return value.side === undefined || isHouseSide(value.side);
}
