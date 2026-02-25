import {
  faArrowRightLong,
  faArrowsLeftRight,
  faBars,
  faCube,
  faDoorOpen,
  faEllipsisVertical,
  faFileDownload,
  faFilePdf,
  faFolderOpen,
  faFont,
  faGear,
  faHome,
  faHouseChimney,
  faHouseChimneyWindow,
  faLightbulb,
  faLock,
  faLockOpen,
  faMagnifyingGlass,
  faPenNib,
  faPlus,
  faRotateLeft,
  faShapes,
  faSlash,
  faSquareFull,
  faStairs,
  faTimes,
  faToilet,
  faTrash,
  faTree,
  faTrowelBricks,
  faWater,
} from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import type {ToolbarActionMap} from './toolbar-types.ts';

export type HouseMenuLimitKey = 'front' | 'back' | 'side1' | 'side2';

export type ToolbarVoidActionKey = NonNullable<{
  [K in keyof ToolbarActionMap]: ToolbarActionMap[K] extends () => void ? K : never
}[keyof ToolbarActionMap]>;

export type OverflowActionKey = 'exportJSON' | 'savePDF' | 'open3DViewer' | 'restartTutorial' | 'toggleTips' | 'openSettings';

export interface ToolbarCommandConfig {
  action: ToolbarVoidActionKey;
  icon: IconDefinition;
  title: string;
  color?: string;
  disabled?: boolean;
}

export interface HouseMenuCommandConfig extends ToolbarCommandConfig {
  limitKey: HouseMenuLimitKey;
}

export interface OverflowImportCommandConfig {
  kind: 'import';
  icon: IconDefinition;
  title: string;
  color?: string;
}

export interface OverflowActionCommandConfig {
  kind: 'action';
  action: OverflowActionKey;
  icon: IconDefinition;
  title: string;
  color?: string;
}

export type OverflowMenuCommandConfig = OverflowImportCommandConfig | OverflowActionCommandConfig;

export const MAIN_MENU_ICONS = {
  open: faPlus,
  close: faTimes,
  house: faHome,
  unlock: faLockOpen,
  lock: faLock,
  elements: faShapes,
  lines: faBars,
  pencil: faPenNib,
  text: faFont,
  zoom: faMagnifyingGlass,
  delete: faTrash,
  overflow: faEllipsisVertical,
} as const;

export const HOUSE_MENU_CONFIG: Record<'tipo6' | 'tipo3', HouseMenuCommandConfig[]> = {
  tipo6: [
    {action: 'addHouseFront', icon: faHouseChimney, title: 'Visão Frontal', limitKey: 'front'},
    {action: 'addHouseSide1', icon: faSquareFull, title: 'Quadrado Fechado', limitKey: 'side1'},
    {action: 'addHouseBack', icon: faHouseChimneyWindow, title: 'Visão Traseira', limitKey: 'back'},
  ],
  tipo3: [
    {action: 'addHouseSide2', icon: faDoorOpen, title: 'Quadrado Aberto', limitKey: 'side2'},
    {action: 'addHouseBack', icon: faHouseChimneyWindow, title: 'Visão Lateral', limitKey: 'back'},
    {action: 'addHouseSide1', icon: faSquareFull, title: 'Quadrado Fechado', limitKey: 'side1'},
  ],
};

export const ELEMENTS_MENU_CONFIG: ToolbarCommandConfig[] = [
  {action: 'addWall', icon: faTrowelBricks, title: 'Objeto / Muro'},
  {action: 'addDoor', icon: faDoorOpen, title: 'Porta - Em breve', disabled: true},
  {action: 'addStairs', icon: faStairs, title: 'Escada'},
  {action: 'addTree', icon: faTree, title: 'Árvore'},
  {action: 'addWater', icon: faWater, title: 'Água / Rio'},
  {action: 'addFossa', icon: faToilet, title: 'Fossa'},
];

export const LINES_MENU_CONFIG: ToolbarCommandConfig[] = [
  {action: 'addLine', icon: faSlash, title: 'Linha Reta'},
  {action: 'addArrow', icon: faArrowRightLong, title: 'Seta Simples'},
  {action: 'addDistance', icon: faArrowsLeftRight, title: 'Distância'},
];

export const OVERFLOW_MENU_CONFIG: OverflowMenuCommandConfig[] = [
  {kind: 'import', icon: faFolderOpen, title: 'Abrir Projeto (JSON)', color: '#ffeaa7'},
  {kind: 'action', action: 'exportJSON', icon: faFileDownload, title: 'Exportar Projeto (JSON)', color: '#ffeaa7'},
  {kind: 'action', action: 'savePDF', icon: faFilePdf, title: 'Salvar PDF', color: '#ffeaa7'},
  {kind: 'action', action: 'open3DViewer', icon: faCube, title: 'Visualizar em 3D', color: '#74b9ff'},
  {kind: 'action', action: 'restartTutorial', icon: faRotateLeft, title: 'Reiniciar Canvas', color: '#74b9ff'},
  {kind: 'action', action: 'toggleTips', icon: faLightbulb, title: 'Dicas', color: '#f1c40f'},
  {kind: 'action', action: 'openSettings', icon: faGear, title: 'Configurações', color: '#dfe6e9'},
];
