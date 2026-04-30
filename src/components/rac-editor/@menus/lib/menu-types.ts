import {HouseType} from '@/shared/types/house.ts';
import {TutorialHighlight} from '@/components/rac-editor/lib/tutorial.ts';

export type CanvasToolMode = 'select' | 'pan';

export interface MenuActionMap {
  openHouseTypeSelector: () => void;
  addHouseFront: () => void;
  addHouseBack: () => void;
  addHouseSide1: () => void;
  addHouseSide2: () => void;
  addWall: () => void;
  addDoor: () => void;
  addStairs: () => void;
  addTree: () => void;
  addWater: () => void;
  addFossa: () => void;
  addLine: () => void;
  addArrow: () => void;
  addDistance: () => void;
  toggleDrawMode: () => void;
  addText: () => void;
  exportJSON: () => void;
  importJSON: (file: File) => void;
  deleteSelection: () => void;
  savePDF: () => void;
  toggleHouseMenu: () => void;
  toggleElementsMenu: () => void;
  toggleLinesMenu: () => void;
  toggleOverflowMenu: () => void;
  toggleTips: () => void;
  toggleZoomControls: () => void;
  open3DViewer: () => void;
  toggleMenu: () => void;
  restartTutorial: () => void;
  openSettings?: () => void;
  /** Opens the project tutorial without resetting the canvas. */
  openTutorial: () => void;
  /** User exit / sign-out hook. Currently a no-op stub. */
  exit: () => void;
  /** Persists a new family name from the inline top-bar editor. */
  renameFamily: (newName: string) => void;
  /** Switches the canvas tool mode (select vs pan). */
  setCanvasToolMode: (mode: CanvasToolMode) => void;
  /** Resets viewport to fit the canvas in the visible container. */
  fitToView: () => void;
}

export type MenuSubmenu = 'house' | 'elements' | 'lines' | 'overflow' | null;

export interface MenuViewCount {
  current: number;
  max: number;
}

export interface RacEditorMenusProps {
  actions: MenuActionMap;
  isDrawing: boolean;
  activeSubmenu: MenuSubmenu;
  showTips: boolean;
  showZoomControls: boolean;
  tutorialHighlight?: TutorialHighlight;
  isMenuOpen: boolean;
  isTutorialActive?: boolean;
  houseType: HouseType;
  frontViewCount?: MenuViewCount;
  backViewCount?: MenuViewCount;
  side1ViewCount?: MenuViewCount;
  side2ViewCount?: MenuViewCount;
  /** Nome da família exibido na barra superior. String vazia oculta o rótulo. */
  familyName: string;
  /** Zoom atual do canvas (1 = 100%). */
  zoom: number;
  /** Modo ativo da ferramenta do canvas (seleção / pan). */
  canvasToolMode: CanvasToolMode;
  /** Indica se o editor está renderizado no layout mobile. */
  isMobile: boolean;
}
