import {HouseType} from '@/shared/types/house.ts';
import {TutorialHighlight} from '@/components/rac-editor/tutorial/Tutorial.tsx';

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
}

export type ToolbarSubmenu = 'house' | 'elements' | 'lines' | 'overflow' | null;

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
