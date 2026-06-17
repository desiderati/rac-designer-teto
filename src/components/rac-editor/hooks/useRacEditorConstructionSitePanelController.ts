import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from 'react';
import type {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import type {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import type {ConstructionSiteManagementScreen} from '@/components/construction-site/ui/lib/types.ts';

type ConstructionSiteManagementController = ReturnType<typeof useConstructionSiteManagementController>;

interface UseRacEditorConstructionSitePanelControllerArgs {
  constructionSiteManagement: ConstructionSiteManagementController;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  setConstructionSiteManagementOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacEditorConstructionSitePanelController({
  constructionSiteManagement,
  setActiveSubmenu,
  setIsMenuOpen,
  setConstructionSiteManagementOpen,
}: UseRacEditorConstructionSitePanelControllerArgs) {
  const [constructionSiteManagementInitialScreen, setConstructionSiteManagementInitialScreen] =
    useState<ConstructionSiteManagementScreen>('construction-list');

  const openConstructionSiteManagement = useCallback((initialScreen: ConstructionSiteManagementScreen) => {
    void constructionSiteManagement.flushActiveHouseDocumentSave({force: true})
      .catch(() => undefined)
      .finally(() => {
        setConstructionSiteManagementInitialScreen(initialScreen);
        setActiveSubmenu(null);
        setIsMenuOpen(false);
        setConstructionSiteManagementOpen(true);
      });
  }, [constructionSiteManagement, setActiveSubmenu, setIsMenuOpen, setConstructionSiteManagementOpen]);

  const handleOpenConstructionSites = useCallback(() => {
    openConstructionSiteManagement('construction-list');
  }, [openConstructionSiteManagement]);

  const handleCanvasDocumentChange = useCallback(() => {
    void constructionSiteManagement.notifyActiveHouseDocumentChanged();
  }, [constructionSiteManagement]);

  const handleActivateHouse = useCallback((constructionId: string, houseId: string) => {
    const activation = constructionSiteManagement.actions.activateHouse(constructionId, houseId);
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    return activation;
  }, [constructionSiteManagement, setActiveSubmenu, setIsMenuOpen]);

  const closeConstructionSiteManagement = useCallback(() => {
    if (!constructionSiteManagement.canOpenRacEditor) return;
    setConstructionSiteManagementOpen(false);
    constructionSiteManagement.hydrateActiveHouseDocument();
  }, [constructionSiteManagement, setConstructionSiteManagementOpen]);

  return {
    constructionSiteManagementInitialScreen,
    handleOpenConstructionSites,
    handleCanvasDocumentChange,
    handleActivateHouse,
    closeConstructionSiteManagement,
  };
}
