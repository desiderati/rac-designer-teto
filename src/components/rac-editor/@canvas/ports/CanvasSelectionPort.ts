import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {
  EditorPilotiSelection,
  EditorLinearSelection,
  EditorTerrainSelection,
  EditorWallSelection,
} from '@/components/rac-editor/@canvas/store/types.ts';

export interface ContraventamentoCanvasSelection {
  /** Identificador lógico do contraventamento selecionado. */
  contraventamentoId: string;

  /** Grupo de casa onde o contraventamento foi selecionado. */
  group: CanvasGroup;
}

export interface PilotiCanvasSelection {
  /** Identificador lógico do piloti selecionado. */
  pilotiId: string;

  /** Indica se o piloti selecionado é o mestre de nível. */
  currentIsMaster: boolean;

  /** Altura atual do piloti selecionado. */
  currentHeight: number;

  /** Nível atual do piloti selecionado. */
  currentNivel: number;

  /** Seleção lógica serializável equivalente à seleção de piloti. */
  editorSelection: EditorPilotiSelection;

  /** Ordem navegável dos pilotis visíveis na vista selecionada. */
  pilotiIds: string[];

  /** Posição de tela usada para abrir o editor flutuante. */
  screenPosition: { x: number; y: number };

  /** Tipo visual da vista onde o piloti foi selecionado. */
  houseView: 'top' | 'front' | 'back' | 'side';
}

export interface WallCanvasSelection {
  /** Identidade serializável do objeto visual selecionado. */
  objectId: string;

  /** Seleção lógica serializável associada à parede. */
  editorSelection: EditorWallSelection;

  /** Rótulo atual exibido para a parede. */
  currentLabel: string;

  /** Cor atual aplicada à parede. */
  currentColor: string;

  /** Posição de tela usada para abrir o editor flutuante. */
  screenPosition: { x: number; y: number };
}

export type GenericCanvasObjectEditorType = 'wall' | 'line' | 'arrow' | 'distance';
export type LinearCanvasSelectionType = Exclude<GenericCanvasObjectEditorType, 'wall'>;

export interface LinearCanvasSelection {
  /** Identidade serializável do objeto visual selecionado. */
  objectId: string;

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
