import {Dispatch, SetStateAction, useState} from 'react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {CanvasToolMode, MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';

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
  pilotisSetupOpen: boolean;
  setPilotisSetupOpen: Dispatch<SetStateAction<boolean>>;
  constructionSiteManagementOpen: boolean;
  setConstructionSiteManagementOpen: Dispatch<SetStateAction<boolean>>;
  /** Modo ativo da ferramenta do canvas (seleção / pan), controlado pelo submenu de zoom. */
  canvasToolMode: CanvasToolMode;
  setCanvasToolMode: Dispatch<SetStateAction<CanvasToolMode>>;
  /** Valor vivo de zoom espelhado do canvas (1 = 100%). */
  displayZoom: number;
  setDisplayZoom: Dispatch<SetStateAction<number>>;
}

export function useRacEditorModalState(): UseRacEditorModalStateResult {
  const {settingsPort} = useEditorPorts();

  const [activeSubmenu, setActiveSubmenu] = useState<MenuSubmenu>(null);
  const [showTips, setShowTips] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(() => settingsPort.getSettings().zoomEnabledByDefault);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [sideSelectorOpen, setSideSelectorOpen] = useState(false);
  const [houseTypeSelectorOpen, setHouseTypeSelectorOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [nivelDefinitionOpen, setNivelDefinitionOpen] = useState(false);
  const [pilotisSetupOpen, setPilotisSetupOpen] = useState(false);
  const [constructionSiteManagementOpen, setConstructionSiteManagementOpen] = useState(false);
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
    pilotisSetupOpen,
    setPilotisSetupOpen,
    constructionSiteManagementOpen,
    setConstructionSiteManagementOpen,
    canvasToolMode,
    setCanvasToolMode,
    displayZoom,
    setDisplayZoom,
  };
}
