import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useRef,
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
  const houseBeforeAdd = useRef<{constructionId: string; houseId: string} | null>(null);

  const openConstructionSiteManagement = useCallback((initialScreen: ConstructionSiteManagementScreen) => {
    void constructionSiteManagement.flushActiveHouseDocumentSave()
      .catch(() => undefined)
      .finally(() => {
        setConstructionSiteManagementInitialScreen(initialScreen);
        setActiveSubmenu(null);
        setIsMenuOpen(false);
        setConstructionSiteManagementOpen(true);
      });
  }, [constructionSiteManagement, setActiveSubmenu, setIsMenuOpen, setConstructionSiteManagementOpen]);

  const handleOpenConstructionSites = useCallback(() => {
    houseBeforeAdd.current = null;
    openConstructionSiteManagement('construction-list');
  }, [openConstructionSiteManagement]);

  const handleCanvasDocumentChange = useCallback(() => {
    void constructionSiteManagement.notifyActiveHouseDocumentChanged();
  }, [constructionSiteManagement]);

  const handleOpenHouseEdit = useCallback(async (constructionId: string, houseId: string) => {
    houseBeforeAdd.current = null;
    await constructionSiteManagement.actions.activateHouse(constructionId, houseId);
    openConstructionSiteManagement('house-detail');
  }, [constructionSiteManagement, openConstructionSiteManagement]);

  const handleAddHouse = useCallback(async (constructionId: string) => {
    const target = constructionSiteManagement.summaries.find((summary) => summary.id === constructionId);
    if (!target || target.status !== 'in_progress') return;
    const previousSite = constructionSiteManagement.constructionSite;
    const previous = previousSite?.constructionSite;
    const previousHouse = previousSite?.houses.find((house) => house.id === previous?.activeHouseId && house.status !== 'archived')
      ?? previousSite?.houses.find((house) => house.status !== 'archived');
    houseBeforeAdd.current = previous && previousHouse
      ? {constructionId: previous.id, houseId: previousHouse.id}
      : null;
    await constructionSiteManagement.flushActiveHouseDocumentSave();
    await constructionSiteManagement.actions.activateConstructionSite(constructionId);
    openConstructionSiteManagement('house-create');
  }, [constructionSiteManagement, openConstructionSiteManagement]);

  const handleActivateHouse = useCallback((constructionId: string, houseId: string) => {
    houseBeforeAdd.current = null;
    const activation = constructionSiteManagement.actions.activateHouse(constructionId, houseId);
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    return activation;
  }, [constructionSiteManagement, setActiveSubmenu, setIsMenuOpen]);

  const closeConstructionSiteManagement = useCallback(async (preferSelectedHouse = false) => {
    const previous = houseBeforeAdd.current;
    houseBeforeAdd.current = null;
    if (previous && !preferSelectedHouse) {
      await constructionSiteManagement.actions.activateHouse(previous.constructionId, previous.houseId);
    }
    if (!previous && !constructionSiteManagement.canOpenRacEditor) return;
    const document = constructionSiteManagement.prepareRacEditorOpening();
    if (!document) return;
    setConstructionSiteManagementOpen(false);
    constructionSiteManagement.hydrateActiveHouseDocument(document);
  }, [constructionSiteManagement, setConstructionSiteManagementOpen]);

  return {
    constructionSiteManagementInitialScreen,
    handleOpenConstructionSites,
    handleOpenHouseEdit,
    handleAddHouse,
    handleCanvasDocumentChange,
    handleActivateHouse,
    closeConstructionSiteManagement,
  };
}
