import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {
  EditorLinearSelection,
  EditorTerrainSelection,
  EditorWallSelection,
} from '@/components/rac-editor/canvas/store/types.ts';

export interface ContraventamentoCanvasSelection {
  group: CanvasGroup;
  contraventamentoId: string;
}

export interface WallCanvasSelection {
  object: CanvasGroup;
  editorSelection: EditorWallSelection;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

export type LinearCanvasSelectionType = 'line' | 'arrow' | 'distance';

export interface LinearCanvasSelection {
  object: CanvasGroup;
  editorSelection: EditorLinearSelection;
  myType: LinearCanvasSelectionType;
  currentLabel: string;
  currentColor: string;
  screenPosition: { x: number; y: number };
}

export interface TerrainCanvasSelection {
  group: CanvasGroup;
  editorSelection: EditorTerrainSelection;
  terrainType: number;
  screenPosition: { x: number; y: number };
}
