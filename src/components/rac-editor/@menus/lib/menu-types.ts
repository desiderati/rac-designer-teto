import {HouseType} from '@/shared/types/house.ts';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';

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
  openImageUpload: () => void;
  openConstructionSites: () => void;
  activateHouse: (constructionId: string, houseId: string) => Promise<void>;
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
  restartDrawing: () => void;
  openSettings?: () => void;
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

export interface MenuHouseOption {
  id: string;
  label: string;
  active: boolean;
}

export interface MenuConstructionGroup {
  id: string;
  code: string;
  communityName?: string;
  active: boolean;
  houses: MenuHouseOption[];
}

export interface RacEditorMenusProps {
  actions: MenuActionMap;
  constructionGroups: MenuConstructionGroup[];
  isDrawing: boolean;
  activeSubmenu: MenuSubmenu;
  showTips: boolean;
  showZoomControls: boolean;
  isMenuOpen: boolean;
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
  /** Estado de persistência do documento visual da casa ativa. */
  documentSaveStatus: HouseDocumentSaveStatus;
  /** Indica se uma troca/hidratação de documento de casa está em andamento. */
  documentTransitioning: boolean;
  /** Indica se já existe ao menos uma vista de casa inserida no canvas para exportar em PDF. */
  canExportPDF: boolean;
  /** Bloqueia ações editoriais quando a casa ativa foi marcada como construída. */
  isReadOnly?: boolean;
}
