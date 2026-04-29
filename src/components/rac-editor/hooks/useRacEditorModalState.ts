import {Dispatch, SetStateAction, useState} from 'react';
import {getSettings} from '@/infra/settings.ts';
import {CanvasToolMode, MenuSubmenu} from '@/components/rac-editor/menus/lib/menu-types.ts';

interface UseRacEditorModalStateResult {
  activeSubmenu: MenuSubmenu;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  showTips: boolean;
  setShowTips: Dispatch<SetStateAction<boolean>>;
  showZoomControls: boolean;
  setShowZoomControls: Dispatch<SetStateAction<boolean>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  showRestartConfirm: boolean;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
  sideSelectorOpen: boolean;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  houseTypeSelectorOpen: boolean;
  setHouseTypeSelectorOpen: Dispatch<SetStateAction<boolean>>;
  is3DViewerOpen: boolean;
  setIs3DViewerOpen: Dispatch<SetStateAction<boolean>>;
  nivelDefinitionOpen: boolean;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
  familySetupOpen: boolean;
  setFamilySetupOpen: Dispatch<SetStateAction<boolean>>;
  /** Active canvas tool mode (select / pan), driven by the zoom-menu submenu. */
  canvasToolMode: CanvasToolMode;
  setCanvasToolMode: Dispatch<SetStateAction<CanvasToolMode>>;
  /** Live zoom value mirrored from the canvas (1 = 100%). */
  displayZoom: number;
  setDisplayZoom: Dispatch<SetStateAction<number>>;
}

export function useRacEditorModalState(): UseRacEditorModalStateResult {

  const [activeSubmenu, setActiveSubmenu] = useState<MenuSubmenu>(null);
  const [showTips, setShowTips] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(() => getSettings().zoomEnabledByDefault);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [sideSelectorOpen, setSideSelectorOpen] = useState(false);
  const [houseTypeSelectorOpen, setHouseTypeSelectorOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [nivelDefinitionOpen, setNivelDefinitionOpen] = useState(false);
  const [familySetupOpen, setFamilySetupOpen] = useState(false);
  const [canvasToolMode, setCanvasToolMode] = useState<CanvasToolMode>('select');
  const [displayZoom, setDisplayZoom] = useState(1);

  return {
    activeSubmenu,
    setActiveSubmenu,
    showTips,
    setShowTips,
    showZoomControls,
    setShowZoomControls,
    isSettingsOpen,
    setIsSettingsOpen,
    isMenuOpen,
    setIsMenuOpen,
    showRestartConfirm,
    setShowRestartConfirm,
    sideSelectorOpen,
    setSideSelectorOpen,
    houseTypeSelectorOpen,
    setHouseTypeSelectorOpen,
    is3DViewerOpen,
    setIs3DViewerOpen,
    nivelDefinitionOpen,
    setNivelDefinitionOpen,
    familySetupOpen,
    setFamilySetupOpen,
    canvasToolMode,
    setCanvasToolMode,
    displayZoom,
    setDisplayZoom,
  };
}
