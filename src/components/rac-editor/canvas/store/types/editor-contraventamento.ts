import type {EditorPilotiId, EditorViewId} from './editor-ids.ts';
import type {EditorContraventamentoSide} from './editor-selection.ts';

export interface EditorContraventamentoDraft {
  viewId: EditorViewId;
  side: EditorContraventamentoSide;
  originPilotiId: EditorPilotiId;
  destinationPilotiId: EditorPilotiId | null;
  column: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isSide(value: unknown): value is EditorContraventamentoSide {
  return value === 'left' || value === 'right';
}

/**
 * Intenção serializável do fluxo de contraventamento.
 *
 * Representa origem, destino e lado escolhidos pelo usuário sem carregar grupo
 * Fabric, objetos de highlight ou estado visual transitório do canvas.
 */
export function isEditorContraventamentoDraft(value: unknown): value is EditorContraventamentoDraft {
  if (!isRecord(value)) return false;

  if ('group' in value || 'canvas' in value || 'target' in value) return false;

  const column = value.column;
  return isString(value.viewId)
    && isSide(value.side)
    && isString(value.originPilotiId)
    && (value.destinationPilotiId === null || isString(value.destinationPilotiId))
    && Number.isInteger(column)
    && typeof column === 'number'
    && column >= 0;
}
