import {isSiteLabelEditorType} from '@shared/types/site-element.ts';
import {ensureCanvasObjectId, getCanvasGroupObjects, toCanvasGroup, type CanvasObject} from './canvas.ts';
import {readLinearObjectState, readWallObjectState} from './generic-object-state.ts';
import type {GenericCanvasObjectEditorType, LinearCanvasSelection, TerrainCanvasSelection, WallCanvasSelection} from '../ports/CanvasSelectionPort.ts';

export function getCanvasObjectEditorKind(object: CanvasObject): GenericCanvasObjectEditorType | 'terrain' | null {
  const kind = object.myType;
  const group = toCanvasGroup(object);
  if (group) {
    if (isSiteLabelEditorType(kind)) return kind;
    switch (kind) {
      case 'wall': case 'square': case 'triangle': case 'circle':
      case 'line': case 'arrow': case 'distance': return kind;
      case 'house':
        return group.houseView !== 'top' && getCanvasGroupObjects(group).some(child => child.isTerrainEditTarget) ? 'terrain' : null;
    }
  }
  if (kind === 'text') return 'text';
  if (kind === 'freehand' || object.type === 'path') return 'freehand';
  return null;
}

type CanvasObjectEditorSelection =
  | {kind: 'wall'; selection: WallCanvasSelection}
  | {kind: 'linear'; selection: LinearCanvasSelection}
  | {kind: 'terrain'; selection: TerrainCanvasSelection};

/** Usa os estados atuais do objeto e mantém a identidade lógica dos comandos existentes. */
export function createCanvasObjectEditorSelection(
  object: CanvasObject,
  screenPosition: {x: number; y: number},
  terrainType: number,
): CanvasObjectEditorSelection | null {
  const editorType = getCanvasObjectEditorKind(object);
  if (!editorType) return null;
  const objectId = ensureCanvasObjectId(object);
  if (editorType === 'terrain') {
    const group = toCanvasGroup(object)!;
    return {kind: 'terrain', selection: {
      group, terrainType, screenPosition,
      editorSelection: {type: 'terrain', viewId: group.houseInstanceId ?? objectId, terrainType, screenPosition},
    }};
  }
  if (editorType === 'line' || editorType === 'arrow' || editorType === 'distance') {
    const state = readLinearObjectState(object);
    return {kind: 'linear', selection: {
      objectId, myType: editorType, ...state, screenPosition,
      editorSelection: {type: 'linear', objectId, linearType: editorType, ...state, screenPosition},
    }};
  }
  const state = editorType === 'text' || editorType === 'freehand'
    ? {currentLabel: editorType === 'text' ? object.text ?? '' : '',
      currentColor: typeof (editorType === 'text' ? object.fill : object.stroke) === 'string'
        ? (editorType === 'text' ? object.fill : object.stroke) as string : '#333333'}
    : readWallObjectState(object);
  return {kind: 'wall', selection: {
    objectId, editorType, ...state, screenPosition,
    editorSelection: {type: 'wall', objectId, currentLabel: state.currentLabel, screenPosition},
  }};
}
