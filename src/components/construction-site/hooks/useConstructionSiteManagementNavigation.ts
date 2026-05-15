import {useEffect, useMemo, useState} from 'react';
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
  initialScreen?: ConstructionSiteManagementScreen;
}

export function useConstructionSiteManagementNavigation({
  constructionSite,
  summaries,
  canOpenRacEditor,
  onBackToCanvas,
  actions,
  initialScreen = 'construction-list',
}: UseConstructionSiteManagementNavigationInput) {

  const [screen, setScreen] = useState<ConstructionSiteManagementScreen>(initialScreen);

  const [selectedConstructionId, setSelectedConstructionId] = useState<string | null>(
    constructionSite?.constructionSite.id ?? null,
  );

  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);

  const [pendingHouseStatusChange, setPendingHouseStatusChange] = useState<{
    houseId: string;
    action: StatusChangeAction;
  } | null>(null);

  const [pendingMonitorStatusChange, setPendingMonitorStatusChange] = useState<{
    monitorId: string;
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

  const selectedMonitor = useMemo(() => {
    if (!constructionSite || !selectedMonitorId) return null;
    return constructionSite.monitors.find((monitor) => monitor.id === selectedMonitorId) ?? null;
  }, [constructionSite, selectedMonitorId]);

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

  const monitorPendingStatusChange = constructionSite?.monitors.find((monitor) => monitor.id === pendingMonitorStatusChange?.monitorId)
    ?? null;

  const canNavigateBack = screen !== 'construction-list' || Boolean(canOpenRacEditor && onBackToCanvas);

  const pendingConstructionCode = pendingConstructionStatusChange
    ? getConstructionCode(pendingConstructionStatusChange.summary)
    : '';

  const pendingHouseFamilyName = constructionSite && housePendingStatusChange
    ? getHouseFamilyName(constructionSite, housePendingStatusChange)
    : '';

  const pendingMonitorName = monitorPendingStatusChange?.name ?? '';

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  const activateConstructionSummary = async (summary: ConstructionSiteSummary) => {
    setSelectedConstructionId(summary.id);
    await actions.activateConstructionSite(summary.id);
  };

  const openConstructionDetail = async (summary: ConstructionSiteSummary) => {
    await activateConstructionSummary(summary);
    setScreen('construction-detail');
  };

  const openConstructionHouses = async (summary: ConstructionSiteSummary) => {
    await activateConstructionSummary(summary);
    setSelectedHouseId(null);
    setScreen('houses');
  };

  const openConstructionMonitors = async (summary: ConstructionSiteSummary) => {
    await activateConstructionSummary(summary);
    setSelectedMonitorId(null);
    setScreen('monitors');
  };

  const showConstructionList = () => {
    setSelectedConstructionId(constructionSite?.constructionSite.id ?? null);
    setScreen('construction-list');
  };

  const showHouses = () => {
    setSelectedHouseId(null);
    setScreen('houses');
  };

  const showMonitors = () => {
    setSelectedMonitorId(null);
    setScreen('monitors');
  };

  const openHouseCreate = () => {
    setSelectedHouseId(null);
    setScreen('house-create');
  };

  const openMonitorCreate = () => {
    setSelectedMonitorId(null);
    setScreen('monitor-create');
  };

  const openHouseDetail = async (houseId: string) => {
    if (!constructionSite) return;

    const house = constructionSite.houses.find((entry) => entry.id === houseId);
    if (!house || house.status === 'archived') return;

    await actions.activateHouse(constructionSite.constructionSite.id, houseId);
    setSelectedHouseId(houseId);
    setScreen('house-detail');
  };

  const openMonitorDetail = (monitorId: string) => {
    if (!constructionSite) return;
    const monitor = constructionSite.monitors.find((entry) => entry.id === monitorId);
    if (!monitor) return;

    setSelectedMonitorId(monitorId);
    setScreen('monitor-detail');
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

    if (screen === 'houses' || screen === 'monitors') {
      setScreen('construction-list');
      return;
    }

    if (screen === 'monitor-create' || screen === 'monitor-detail') {
      setScreen('monitors');
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

  const confirmMonitorStatusChange = () => {
    if (!monitorPendingStatusChange || !pendingMonitorStatusChange) return;
    if (pendingMonitorStatusChange.action === 'archive') {
      actions.inactivateMonitor(monitorPendingStatusChange.id);
    } else {
      actions.reactivateMonitor(monitorPendingStatusChange.id);
    }
    if (selectedMonitorId === monitorPendingStatusChange.id) {
      setSelectedMonitorId(null);
    }
    setPendingMonitorStatusChange(null);
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
    selectedMonitor,
    selectedSummary,
    selectedConstructionFields,
    constructionLabel,
    canNavigateBack,
    pendingConstructionStatusChange,
    pendingHouseStatusChange,
    pendingMonitorStatusChange,
    housePendingStatusChange,
    monitorPendingStatusChange,
    pendingConstructionCode,
    pendingHouseFamilyName,
    pendingMonitorName,
    setScreen,
    openConstructionDetail,
    openConstructionHouses,
    openConstructionMonitors,
    openHouseCreate,
    openMonitorCreate,
    openHouseDetail,
    openMonitorDetail,
    showConstructionList,
    showHouses,
    showMonitors,
    navigateBack,
    requestConstructionStatusChange: (summary: ConstructionSiteSummary, action: StatusChangeAction) => {
      setPendingConstructionStatusChange({summary, action});
    },
    requestHouseStatusChange: (houseId: string, action: StatusChangeAction) => {
      setPendingHouseStatusChange({houseId, action});
    },
    requestMonitorStatusChange: (monitorId: string, action: StatusChangeAction) => {
      setPendingMonitorStatusChange({monitorId, action});
    },
    cancelConstructionStatusChange: () => setPendingConstructionStatusChange(null),
    cancelHouseStatusChange: () => setPendingHouseStatusChange(null),
    cancelMonitorStatusChange: () => setPendingMonitorStatusChange(null),
    confirmConstructionStatusChange,
    confirmHouseStatusChange,
    confirmMonitorStatusChange,
  };
}
