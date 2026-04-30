import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {
  EditorLinearSelection,
  EditorTerrainSelection,
  EditorWallSelection,
} from '@/components/rac-editor/canvas/store/types.ts';

export interface ContraventamentoCanvasSelection {
  /** Grupo de casa onde o contraventamento foi selecionado. */
  group: CanvasGroup;

  /** Identificador lógico do contraventamento selecionado. */
  contraventamentoId: string;
}

export interface WallCanvasSelection {
  /** Grupo visual da parede selecionada. */
  object: CanvasGroup;

  /** Seleção lógica serializável associada à parede. */
  editorSelection: EditorWallSelection;

  /** Rótulo atual exibido para a parede. */
  currentLabel: string;

  /** Posição de tela usada para abrir o editor flutuante. */
  screenPosition: { x: number; y: number };
}

export type LinearCanvasSelectionType = 'line' | 'arrow' | 'distance';

export interface LinearCanvasSelection {
  /** Grupo visual do objeto linear selecionado. */
  object: CanvasGroup;

  /** Seleção lógica serializável associada ao objeto linear. */
  editorSelection: EditorLinearSelection;

  /** Tipo do objeto linear selecionado. */
  myType: LinearCanvasSelectionType;

  /** Rótulo atual exibido no objeto linear. */
  currentLabel: string;

  /** Cor atual aplicada ao objeto linear. */
  currentColor: string;

  /** Posição de tela usada para abrir o editor flutuante. */
  screenPosition: { x: number; y: number };
}

export interface TerrainCanvasSelection {
  /** Grupo visual da vista de casa cujo terreno foi selecionado. */
  group: CanvasGroup;

  /** Seleção lógica serializável associada ao terreno. */
  editorSelection: EditorTerrainSelection;

  /** Tipo de terreno atual da vista selecionada. */
  terrainType: number;

  /** Posição de tela usada para abrir o editor flutuante. */
  screenPosition: { x: number; y: number };
}
