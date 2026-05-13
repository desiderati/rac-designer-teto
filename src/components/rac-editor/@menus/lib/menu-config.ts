import {
  faArrowPointer,
  faArrowLeft,
  faArrowRightLong,
  faArrowsLeftRight,
  faBars,
  faCircleQuestion,
  faCircleUser,
  faCube,
  faDoorOpen,
  faEllipsisVertical,
  faExpand,
  faFileDownload,
  faFileExport,
  faFilePdf,
  faFolder,
  faFolderOpen,
  faFont,
  faGear,
  faGraduationCap,
  faHand,
  faHome,
  faHouseChimney,
  faHouseChimneyWindow,
  faLightbulb,
  faLock,
  faLockOpen,
  faMagnifyingGlass,
  faPenNib,
  faPenToSquare,
  faPeopleRoof,
  faPlus,
  faRightFromBracket,
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
import type {MenuActionMap} from './menu-types.ts';
import {TOOLBAR_THEME} from '@/shared/config.ts';

export type HouseMenuLimitKey = 'front' | 'back' | 'side1' | 'side2';

export type MenuVoidActionKey = NonNullable<{
  [K in keyof MenuActionMap]: MenuActionMap[K] extends () => void ? K : never
}[keyof MenuActionMap]>;

export type OverflowActionKey =
  'savePDF'
  | 'open3DViewer'
  | 'restartDrawing'
  | 'toggleTips'
  | 'openSettings';

export interface MenuCommandConfig {
  action: MenuVoidActionKey;
  icon: IconDefinition;
  title: string;
  color?: string;
  disabled?: boolean;
  guidedTourId?: string;
}

export interface HouseMenuCommandConfig extends MenuCommandConfig {
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

/**
 * Refined-canvas top-bar icons (Stitch-aligned).
 * Used by TopBar, ZoomMenu, UserMenu, HamburgerMenu and FamilyName.
 */
export const TOP_BAR_ICONS = {
  hamburger: faBars,
  edit: faPenToSquare,
  zoom: faMagnifyingGlass,
  view3d: faCube,
  export: faFileExport,
  user: faCircleUser,
  // Zoom submenu
  toolSelect: faArrowPointer,
  toolPan: faHand,
  toolFitView: faExpand,
  // Avatar dropdown
  restart: faRotateLeft,
  tips: faLightbulb,
  guidedTour: faGraduationCap,
  settings: faGear,
  exit: faRightFromBracket,
  // Hamburger dropdown
  constructionSites: faPeopleRoof,
  workspace: faFolderOpen,
  workspaceOpen: faFolderOpen,
  workspaceClosed: faFolder,
  backToCanvas: faArrowLeft,
  importJson: faFolderOpen,
  exportJson: faFileDownload,
  savePdf: faFilePdf,
  help: faCircleQuestion,
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

export const ELEMENTS_MENU_CONFIG: MenuCommandConfig[] = [
  {
    action: 'addWall',
    icon: faTrowelBricks,
    title: 'Objeto / Muro',
    guidedTourId: 'rac-tool-wall',
  },
  {action: 'addDoor', icon: faDoorOpen, title: 'Porta - Out Of Service', disabled: true},
  {action: 'addStairs', icon: faStairs, title: 'Escada - Out Of Service', disabled: true},
  {action: 'addTree', icon: faTree, title: 'Árvore'},
  {action: 'addWater', icon: faWater, title: 'Água / Rio'},
  {action: 'addFossa', icon: faToilet, title: 'Fossa'},
];

export const LINES_MENU_CONFIG: MenuCommandConfig[] = [
  {
    action: 'addLine',
    icon: faSlash,
    title: 'Linha Reta',
    guidedTourId: 'rac-tool-line',
  },
  {
    action: 'addArrow',
    icon: faArrowRightLong,
    title: 'Seta Simples',
    guidedTourId: 'rac-tool-arrow',
  },
  {
    action: 'addDistance',
    icon: faArrowsLeftRight,
    title: 'Distância',
    guidedTourId: 'rac-tool-distance',
  },
];

export const OVERFLOW_MENU_CONFIG: OverflowMenuCommandConfig[] = [
  {
    kind: 'action',
    action: 'savePDF',
    icon: faFilePdf,
    title: 'Salvar PDF',
    color: TOOLBAR_THEME.overflowFileActionIconColor,
  },
  {
    kind: 'action',
    action: 'open3DViewer',
    icon: faCube,
    title: 'Visualizar em 3D',
    color: TOOLBAR_THEME.overflowViewerActionIconColor,
  },
  {
    kind: 'action',
    action: 'restartDrawing',
    icon: faRotateLeft,
    title: 'Reiniciar Canvas',
    color: TOOLBAR_THEME.overflowViewerActionIconColor,
  },
  {
    kind: 'action',
    action: 'toggleTips',
    icon: faLightbulb,
    title: 'Dicas',
    color: TOOLBAR_THEME.overflowTipsActionIconColor,
  },
  {
    kind: 'action',
    action: 'openSettings',
    icon: faGear,
    title: 'Configurações',
    color: TOOLBAR_THEME.overflowSettingsActionIconColor,
  },
];
