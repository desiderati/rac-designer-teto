import type {HouseType} from '@/lib/house-manager';

export interface ToolbarActionMap {
  openHouseTypeSelector: () => void;
  addHouseFront: () => void;
  addHouseBack: () => void;
  addHouseSide1: () => void;
  addHouseSide2: () => void;
  ungroup: () => void;
  group: () => void;
  addWall: () => void;
  addDoor: () => void;
  addStairs: () => void;
  addTree: () => void;
  addWater: () => void;
  addFossa: () => void;
  addLine: () => void;
  addArrow: () => void;
  addDimension: () => void;
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
}

export type ToolbarSubmenu = 'house' | 'elements' | 'lines' | 'overflow' | null;
export type TutorialHighlight = 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;

export interface ToolbarViewCount {
  current: number;
  max: number;
}

export interface ToolbarProps {
  actions: ToolbarActionMap;
  isDrawing: boolean;
  activeSubmenu: ToolbarSubmenu;
  showTips: boolean;
  showZoomControls: boolean;
  tutorialHighlight?: TutorialHighlight;
  isMenuOpen: boolean;
  isTutorialActive?: boolean;
  houseType: HouseType;
  frontViewCount?: ToolbarViewCount;
  backViewCount?: ToolbarViewCount;
  side1ViewCount?: ToolbarViewCount;
  side2ViewCount?: ToolbarViewCount;
}
