import {Dispatch, MutableRefObject, SetStateAction} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {toast} from 'sonner';
import {SideSelectorMode} from '@/components/rac-editor/hooks/useHouseTypeFlow';
import {NivelDefinition} from '@/components/rac-editor/modals/editors/NivelDefinitionEditor';
import {shouldResetHouseTypeOnSideSelectorCancel, shouldTransitionToNivelDefinition} from '@/components/rac-editor/utils/side-selector-flow';
import {createHouseGroupForView} from '@/components/rac-editor/utils/house-view-creation';
import {getViewLabelForHouseType} from '@/lib/domain/house-view-label-use-cases';
import {calculateStackedViewPositions, resolveViewInsertionRequest} from '@/lib/domain/house-view-layout-use-cases';
import {
  createHouseFrontBack,
  createHouseSide,
  createHouseTop,
} from '@/lib/canvas-utils';
import {houseManager, HouseSide, HouseType, ViewType} from '@/lib/house-manager';

interface HouseInstanceSlot {
  label: string;
  side: HouseSide;
  onCanvas: boolean;
}

interface UseRacViewActionsArgs {
  getCanvas: () => FabricCanvas | null;
  getVisibleCenter: () => { x: number; y: number };
  closeAllMenus: () => void;
  addObjectToCanvas: (obj: FabricObject) => void;
  showPilotiTutorialIfNeeded: (house: Group) => void;
  pendingViewType: ViewType | null;
  setPendingViewType: Dispatch<SetStateAction<ViewType | null>>;
  sideSelectorMode: SideSelectorMode;
  setSideSelectorMode: Dispatch<SetStateAction<SideSelectorMode>>;
  setInstanceSlots: Dispatch<SetStateAction<HouseInstanceSlot[]>>;
  pendingNivelSide: HouseSide | null;
  setPendingNivelSide: Dispatch<SetStateAction<HouseSide | null>>;
  niveisAppliedRef: MutableRefObject<boolean>;
  transitionToNivelRef: MutableRefObject<boolean>;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacViewActions({
  getCanvas,
  getVisibleCenter,
  closeAllMenus,
  addObjectToCanvas,
  showPilotiTutorialIfNeeded,
  pendingViewType,
  setPendingViewType,
  sideSelectorMode,
  setSideSelectorMode,
  setInstanceSlots,
  pendingNivelSide,
  setPendingNivelSide,
  niveisAppliedRef,
  transitionToNivelRef,
  setSideSelectorOpen,
  setNivelDefinitionOpen,
}: UseRacViewActionsArgs) {

  const addViewToCanvas = (viewType: ViewType, side?: HouseSide) => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return;

    const house = createHouseGroupForView({
      canvas,
      viewType,
      side,
      factories: {
        createHouseTop,
        createHouseFrontBack,
        createHouseSide,
      },
    });

    // Register with house manager (this applies synced piloti data)
    houseManager.registerView(viewType, house, side);

    addObjectToCanvas(house);

    if (viewType === 'top') {
      showPilotiTutorialIfNeeded(house);
    }

    const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
    toast.success(`Vista ${label} adicionada!`);
  };

  // Helper to add a view with side selection logic
  const requestAddView = (viewType: ViewType) => {
    const slots = houseManager.getPreAssignedSlots(viewType);
    const availableSides = houseManager.getAvailableSides(viewType);
    const decision = resolveViewInsertionRequest({
      viewType,
      isAtLimit: houseManager.isViewAtLimit(viewType),
      preAssignedSlots: slots,
      availableSides,
    });

    switch (decision.type) {
      case 'blocked_limit': {
        const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
        toast.error(`Limite de ${label} atingido para este tipo de casa.`);
        return;
      }

      case 'add_direct':
        addViewToCanvas(viewType, decision.side);
        return;

      case 'blocked_no_instance_slots': {
        const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
        toast.error(`Todas as instâncias de ${label} já estão no canvas.`);
        return;
      }

      case 'open_instance_selector':
        setPendingViewType(viewType);
        setInstanceSlots(decision.slots);
        setSideSelectorMode('choose-instance');
        setSideSelectorOpen(true);
        return;

      case 'blocked_no_sides':
        toast.error('Nenhum lado disponível para esta vista.');
        return;

      case 'open_side_selector':
        setPendingViewType(viewType);
        setSideSelectorMode('position');
        setSideSelectorOpen(true);
        return;
    }
  };

  const handleSideSelected = (side: HouseSide) => {
    if (!pendingViewType) {
      setSideSelectorOpen(false);
      return;
    }

    if (
      shouldTransitionToNivelDefinition({
        sideSelectorMode,
        hasPreAssignedSlots: houseManager.hasPreAssignedSlots(),
      })
    ) {
      // Initial positioning - open NivelDefinitionEditor instead of adding immediately
      houseManager.autoAssignAllSides(pendingViewType, side);
      setPendingNivelSide(side);
      niveisAppliedRef.current = false;
      // Use a flag to prevent handleSideSelectorClose from clearing pendingViewType
      transitionToNivelRef.current = true;
      setSideSelectorOpen(false);
      setNivelDefinitionOpen(true);
      return;
    } else {
      // Regular side selection or choose-instance
      addViewToCanvas(pendingViewType, side);
    }

    setPendingViewType(null);
    setSideSelectorOpen(false);
  };

  const handleNiveisApplied = (niveis: Record<string, NivelDefinition>) => {
    // Capture pending values before any state clearing
    const viewType = pendingViewType;
    const side = pendingNivelSide;

    // Mark as applied so onClose won't reset the house manager
    niveisAppliedRef.current = true;

    // Update corner pilotis in HouseManager with the defined levels
    for (const [pilotiId, entry] of Object.entries(niveis)) {
      houseManager.updatePiloti(pilotiId, {
        isMaster: entry.isMaster,
        nivel: entry.nivel
      });
    }

    // Calculate recommended heights for all 12 pilotis using bilinear interpolation
    houseManager.calculateAndApplyRecommendedHeights();

    // Add plant + initial view
    if (viewType) {
      addViewToCanvas('top'); // Plant
      addViewToCanvas(viewType, side ?? undefined); // Initial view

      // Reposition so plant is above and view is below
      const canvas = getCanvas();
      if (canvas) {
        setTimeout(() => {
          const house = houseManager.getHouse();
          const plantInst = house?.views.top?.[0];
          const viewInst = house?.views[viewType]?.find((v) => v.side === side);
          const plantGroup = plantInst?.group;
          const viewGroup = viewInst?.group;

          if (plantGroup && viewGroup) {
            const center = getVisibleCenter();
            const gap = 30;
            const ph = (plantGroup.height || 0) * (plantGroup.scaleY || 1);
            const vh = (viewGroup.height || 0) * (viewGroup.scaleY || 1);
            const layout = calculateStackedViewPositions({
              centerY: center.y,
              topHeight: ph,
              bottomHeight: vh,
              gap,
            });
            plantGroup.set({left: center.x, top: layout.topY});
            viewGroup.set({left: center.x, top: layout.bottomY});
            plantGroup.setCoords();
            viewGroup.setCoords();
            canvas.renderAll();
          }
        }, 50);
      }
    }

    // Clear state and close modal
    setPendingViewType(null);
    setPendingNivelSide(null);
    setNivelDefinitionOpen(false);
  };

  const handleNivelDefinitionClose = () => {
    // If apply was just done, don't reset anything
    if (niveisAppliedRef.current) {
      niveisAppliedRef.current = false;
      setNivelDefinitionOpen(false);
      return;
    }
    // User cancelled - reset house type since we already auto-assigned
    houseManager.setHouseType(null);
    houseManager.reset();
    setPendingViewType(null);
    setPendingNivelSide(null);
    setNivelDefinitionOpen(false);
  };

  const handleSideSelectorClose = () => {
    // If transitioning to nivel definition modal, don't clear pendingViewType
    if (transitionToNivelRef.current) {
      transitionToNivelRef.current = false;
      setSideSelectorOpen(false);
      return;
    }
    // If this was initial positioning and user cancelled, reset house type
    if (
      shouldResetHouseTypeOnSideSelectorCancel({
        sideSelectorMode,
        hasPreAssignedSlots: houseManager.hasPreAssignedSlots(),
      })
    ) {
      houseManager.setHouseType(null);
    }
    setSideSelectorOpen(false);
    setPendingViewType(null);
  };

  const handleAddHouseView = (viewType: ViewType) => {
    closeAllMenus();
    requestAddView(viewType);
  };

  const handleHouseTypeSelected = (type: HouseType) => {
    if (!type) return;

    // Set the house type
    houseManager.setHouseType(type);

    // Initialize default windows and doors
    houseManager.initializeDefaultElements();

    // Open HouseSideSelector to position the initial view
    // tipo6: position the front view (top/bottom)
    // tipo3: position the open square (left/right)
    const initialViewType: ViewType = type === 'tipo6' ? 'front' : 'side2';
    setPendingViewType(initialViewType);
    setSideSelectorMode('position');
    setSideSelectorOpen(true);
  };

  return {
    addViewToCanvas,
    requestAddView,
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    handleHouseTypeSelected,
  };
}
