import {Dispatch, SetStateAction, useState} from 'react';
import {getSettings} from '@/infra/settings.ts';
import {ToolbarSubmenu} from '@/components/rac-editor/toolbar/helpers/toolbar-types.ts';

interface UseRacEditorModalStateResult {
  activeSubmenu: ToolbarSubmenu;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
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
  showUngroupConfirm: boolean;
  setShowUngroupConfirm: Dispatch<SetStateAction<boolean>>;
  sideSelectorOpen: boolean;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  houseTypeSelectorOpen: boolean;
  setHouseTypeSelectorOpen: Dispatch<SetStateAction<boolean>>;
  is3DViewerOpen: boolean;
  setIs3DViewerOpen: Dispatch<SetStateAction<boolean>>;
  nivelDefinitionOpen: boolean;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacEditorModalState(): UseRacEditorModalStateResult {

  const [activeSubmenu, setActiveSubmenu] = useState<ToolbarSubmenu>(null);
  const [showTips, setShowTips] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(() => getSettings().zoomEnabledByDefault);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showUngroupConfirm, setShowUngroupConfirm] = useState(false);
  const [sideSelectorOpen, setSideSelectorOpen] = useState(false);
  const [houseTypeSelectorOpen, setHouseTypeSelectorOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [nivelDefinitionOpen, setNivelDefinitionOpen] = useState(false);

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
    showUngroupConfirm,
    setShowUngroupConfirm,
    sideSelectorOpen,
    setSideSelectorOpen,
    houseTypeSelectorOpen,
    setHouseTypeSelectorOpen,
    is3DViewerOpen,
    setIs3DViewerOpen,
    nivelDefinitionOpen,
    setNivelDefinitionOpen,
  };
}
