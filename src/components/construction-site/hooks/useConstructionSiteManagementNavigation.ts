import {useMemo, useState} from 'react';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
} from '@/shared/types/construction-site.ts';
import {formatConstructionLabel, getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import type {
  ConstructionSiteManagementActions,
  ConstructionSiteManagementScreen,
  StatusChangeAction,
} from '@/components/construction-site/ui/lib/types.ts';
import {
  getActiveHouse,
  getConstructionCode,
  getHouseFamilyName,
  getSelectedConstructionFields,
} from '@/components/construction-site/ui/lib/view-model.ts';

export interface UseConstructionSiteManagementNavigationInput {
  constructionSite: ConstructionSiteState | null;
  summaries: ConstructionSiteSummary[];
  canOpenRacEditor: boolean;
  onBackToCanvas?: () => void;
  actions: ConstructionSiteManagementActions;
}

export function useConstructionSiteManagementNavigation({
  constructionSite,
  summaries,
  canOpenRacEditor,
  onBackToCanvas,
  actions,
}: UseConstructionSiteManagementNavigationInput) {

  const [screen, setScreen] = useState<ConstructionSiteManagementScreen>('construction-list');

  const [selectedConstructionId, setSelectedConstructionId] = useState<string | null>(
    constructionSite?.constructionSite.id ?? null,
  );

  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);

  const [pendingHouseStatusChange, setPendingHouseStatusChange] = useState<{
    houseId: string;
    action: StatusChangeAction;
  } | null>(null);

  const [pendingConstructionStatusChange, setPendingConstructionStatusChange] = useState<{
    summary: ConstructionSiteSummary;
    action: StatusChangeAction;
  } | null>(null);

  const activeHouse = useMemo(() => constructionSite ? getActiveHouse(constructionSite) : null, [constructionSite]);

  const selectedHouse = useMemo(() => {
    if (!constructionSite) return null;
    return constructionSite.houses.find((house) => house.id === selectedHouseId) ?? activeHouse;
  }, [activeHouse, constructionSite, selectedHouseId]);

  const activeCommunityName = constructionSite ? getConstructionSiteCommunityName(constructionSite) : undefined;

  const constructionLabel = constructionSite
    ? formatConstructionLabel(constructionSite.constructionSite.externalCode, activeCommunityName)
    : 'Nova Construção TETO';

  const selectedSummary = summaries.find((summary) => summary.id === selectedConstructionId)
    ?? summaries.find((summary) => summary.id === constructionSite?.constructionSite.id)
    ?? null;

  const selectedConstructionFields = getSelectedConstructionFields(constructionSite, selectedSummary);

  const housePendingStatusChange = constructionSite?.houses.find((house) => house.id === pendingHouseStatusChange?.houseId)
    ?? null;

  const canNavigateBack = screen !== 'construction-list' || Boolean(canOpenRacEditor && onBackToCanvas);

  const pendingConstructionCode = pendingConstructionStatusChange
    ? getConstructionCode(pendingConstructionStatusChange.summary)
    : '';

  const pendingHouseFamilyName = constructionSite && housePendingStatusChange
    ? getHouseFamilyName(constructionSite, housePendingStatusChange)
    : '';

  const openConstructionDetail = async (summary: ConstructionSiteSummary) => {
    setSelectedConstructionId(summary.id);
    await actions.activateConstructionSite(summary.id);
    setScreen('construction-detail');
  };

  const openHouses = async () => {
    const constructionSiteId = selectedConstructionId ?? selectedSummary?.id ?? constructionSite?.constructionSite.id;
    if (constructionSiteId) {
      await actions.activateConstructionSite(constructionSiteId);
      setSelectedConstructionId(constructionSiteId);
    }
    setSelectedHouseId(null);
    setScreen('houses');
  };

  const showConstructionList = () => {
    setSelectedConstructionId(constructionSite?.constructionSite.id ?? null);
    setScreen('construction-list');
  };

  const showHouses = () => {
    setSelectedHouseId(null);
    setScreen('houses');
  };

  const openHouseCreate = () => {
    setSelectedHouseId(null);
    setScreen('house-create');
  };

  const openHouseDetail = async (houseId: string) => {
    if (!constructionSite) return;

    const house = constructionSite.houses.find((entry) => entry.id === houseId);
    if (!house || house.status === 'archived') return;

    await actions.activateHouse(constructionSite.constructionSite.id, houseId);
    setSelectedHouseId(houseId);
    setScreen('house-detail');
  };

  const navigateBack = () => {
    if (screen === 'construction-list') {
      if (canOpenRacEditor) onBackToCanvas?.();
      return;
    }

    if (screen === 'construction-create' || screen === 'construction-detail') {
      showConstructionList();
      return;
    }

    if (screen === 'houses') {
      setScreen(selectedConstructionId ? 'construction-detail' : 'construction-list');
      return;
    }

    setScreen('houses');
  };

  const confirmHouseStatusChange = async () => {
    if (!housePendingStatusChange || !pendingHouseStatusChange) return;
    if (pendingHouseStatusChange.action === 'archive') {
      await actions.archiveHouse(housePendingStatusChange.id);
    } else {
      await actions.unarchiveHouse(housePendingStatusChange.id);
    }
    if (selectedHouseId === housePendingStatusChange.id) {
      setSelectedHouseId(null);
    }
    setPendingHouseStatusChange(null);
  };

  const confirmConstructionStatusChange = async () => {
    if (!pendingConstructionStatusChange) return;
    if (pendingConstructionStatusChange.action === 'archive') {
      await actions.archiveConstructionSite(pendingConstructionStatusChange.summary.id);
    } else {
      await actions.unarchiveConstructionSite(pendingConstructionStatusChange.summary.id);
    }
    if (selectedConstructionId === pendingConstructionStatusChange.summary.id) {
      setSelectedConstructionId(constructionSite?.constructionSite.id ?? null);
    }
    setPendingConstructionStatusChange(null);
  };

  return {
    screen,
    activeHouse,
    selectedHouse,
    selectedSummary,
    selectedConstructionFields,
    constructionLabel,
    canNavigateBack,
    pendingConstructionStatusChange,
    pendingHouseStatusChange,
    housePendingStatusChange,
    pendingConstructionCode,
    pendingHouseFamilyName,
    setScreen,
    openConstructionDetail,
    openHouses,
    openHouseCreate,
    openHouseDetail,
    showConstructionList,
    showHouses,
    navigateBack,
    requestConstructionStatusChange: (summary: ConstructionSiteSummary, action: StatusChangeAction) => {
      setPendingConstructionStatusChange({summary, action});
    },
    requestHouseStatusChange: (houseId: string, action: StatusChangeAction) => {
      setPendingHouseStatusChange({houseId, action});
    },
    cancelConstructionStatusChange: () => setPendingConstructionStatusChange(null),
    cancelHouseStatusChange: () => setPendingHouseStatusChange(null),
    confirmConstructionStatusChange,
    confirmHouseStatusChange,
  };
}
