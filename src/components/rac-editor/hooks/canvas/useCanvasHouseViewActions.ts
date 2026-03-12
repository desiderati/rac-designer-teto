import {Dispatch, MutableRefObject, SetStateAction} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {toast} from 'sonner';
import {NivelDefinition} from '@/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx';
import {
  shouldResetHouseTypeOnSideSelectorCancel,
  shouldTransitionToNivelDefinition
} from '@/components/rac-editor/lib/house-side.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {
  HOUSE_VIEW_INSERTION_DECISION_TYPES,
  type HousePreAssignedSideDisplay,
  type HouseSide,
  type HouseType,
  type HouseViewType
} from '@/shared/types/house.ts';
import {HouseSideSelectorMode} from '@/components/rac-editor/ui/modals/selectors/HouseSideSelector.tsx';
import {HOUSE_DEFAULTS, TIMINGS, TOAST_MESSAGES} from '@/shared/config.ts';
import {createHouseGroupForView, getViewLabelForHouseType} from '@/components/rac-editor/lib/house-view.ts';
import {CanvasGroup, CanvasObject} from '@/components/rac-editor/lib/canvas';

interface UseCanvasHouseViewActionsArgs {
  getCanvas: () => FabricCanvas | null;
  getVisibleCenter: () => { x: number; y: number };
  closeAllMenus: () => void;
  addObjectToCanvas: (obj: CanvasObject) => void;
  showPilotiTutorialIfNeeded: (house: CanvasGroup) => void;
  pendingViewType: HouseViewType | null;
  setPendingViewType: Dispatch<SetStateAction<HouseViewType | null>>;
  sideSelectorMode: HouseSideSelectorMode;
  setSideSelectorMode: Dispatch<SetStateAction<HouseSideSelectorMode>>;
  setHouseSideSlots: Dispatch<SetStateAction<HousePreAssignedSideDisplay[]>>;
  pendingNivelSide: HouseSide | null;
  setPendingNivelSide: Dispatch<SetStateAction<HouseSide | null>>;
  niveisAppliedRef: MutableRefObject<boolean>;
  transitionToNivelRef: MutableRefObject<boolean>;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
  setPilotiSetupOpen: Dispatch<SetStateAction<boolean>>;
}

export function useCanvasHouseViewActions({
  getCanvas,
  getVisibleCenter,
  closeAllMenus,
  addObjectToCanvas,
  showPilotiTutorialIfNeeded,
  pendingViewType,
  setPendingViewType,
  sideSelectorMode,
  setSideSelectorMode,
  setHouseSideSlots,
  pendingNivelSide,
  setPendingNivelSide,
  niveisAppliedRef,
  transitionToNivelRef,
  setSideSelectorOpen,
  setNivelDefinitionOpen,
  setPilotiSetupOpen,
}: UseCanvasHouseViewActionsArgs) {

  const addViewToCanvas =
    (viewType: HouseViewType, side?: HouseSide) => {

      closeAllMenus();
      const canvas = getCanvas();
      if (!canvas) return;

      const house = createHouseGroupForView({
        canvas,
        viewType,
        side,
      });

      // Register with house manager (this applies synced piloti data)
      houseManager.registerView(viewType, house, side);
      addObjectToCanvas(house);

      if (viewType === 'top') {
        showPilotiTutorialIfNeeded(house);
      }

      const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
      toast.success(TOAST_MESSAGES.houseViewAdded(label));
    };

  // Helper to add a view with side selection logic
  const requestAddView =
    (viewType: HouseViewType) => {

      const slots = houseManager.getPreAssignedSides(viewType);
      const availableSides = houseManager.getAvailableSides(viewType);
      const decision = resolveHouseViewInsertion({
        viewType,
        isAtLimit: houseManager.isViewAtLimit(viewType),
        preAssignedSides: slots,
        availableSides,
      });

      switch (decision.type) {
        case HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByViewLimit: {
          const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
          toast.error(TOAST_MESSAGES.houseViewLimitReached(label));
          return;
        }

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly:
          addViewToCanvas(viewType, decision.side);
          return;

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoFreeInstanceSlots: {
          const label = getViewLabelForHouseType(viewType, houseManager.getHouseType());
          toast.error(TOAST_MESSAGES.houseViewAllInstancesAlreadyOnCanvas(label));
          return;
        }

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.openInstanceSlotSelector:
          setPendingViewType(viewType);
          setHouseSideSlots(decision.slots);
          setSideSelectorMode('choose-instance');
          setSideSelectorOpen(true);
          return;

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoAvailableSides:
          toast.error(TOAST_MESSAGES.houseViewHasNoAvailableSide);
          return;

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.openSideSelector:
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
        hasPreAssignedSides: houseManager.hasPreAssignedSides(),
      })
    ) {
      // Initial positioning - open NivelDefinitionEditor instead of adding immediately
      houseManager.autoAssignAllSides(pendingViewType, side);
      setPendingNivelSide(side);
      niveisAppliedRef.current = false;

      // Use a flag to prevent handleSideSelectorClose from clearing pendingViewType
      transitionToNivelRef.current = true;
      setSideSelectorOpen(false);
      setPilotiSetupOpen(true);
      return;
    } else {
      // Regular side selection or choose-instance
      addViewToCanvas(pendingViewType, side);
    }

    setPendingViewType(null);
    setSideSelectorOpen(false);
  };

  const handleNiveisApplied =
    (niveis: Record<string, NivelDefinition>) => {
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
            const viewInst =
              house?.views[viewType]?.find((v) => v.side === side);

            const plantGroup = plantInst?.group;
            const viewGroup = viewInst?.group;

            if (plantGroup && viewGroup) {
              const center = getVisibleCenter();
              const gap = HOUSE_DEFAULTS.viewBetweenGap;
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
          }, TIMINGS.stackedViewRepositionDelayMs);
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
        hasPreAssignedSides: houseManager.hasPreAssignedSides(),
      })
    ) {
      houseManager.setHouseType(null);
    }
    setSideSelectorOpen(false);
    setPendingViewType(null);
  };

  const handleAddHouseView =
    (viewType: HouseViewType) => {
      closeAllMenus();
      requestAddView(viewType);
    };

  const handleHouseTypeSelected =
    (type: HouseType) => {
      if (!type) return;

      // Set the house type
      houseManager.setHouseType(type);

      // Open HouseSideSelector to position the initial view
      // tipo6: position the front view (top/bottom)
      // tipo3: position the open square (left/right)
      const initialViewType: HouseViewType = type === 'tipo6' ? 'front' : 'side2';
      setPendingViewType(initialViewType);
      setSideSelectorMode('position');
      setSideSelectorOpen(true);
    };

  const handlePilotiSetupConfirm = (heights: number[]) => {
    houseManager.setSelectedPilotiHeights(heights);
    setPilotiSetupOpen(false);
    setNivelDefinitionOpen(true);
  };

  const handlePilotiSetupClose = () => {
    // User cancelled - reset house type since we already auto-assigned
    houseManager.setHouseType(null);
    houseManager.reset();
    setPendingViewType(null);
    setPendingNivelSide(null);
    setPilotiSetupOpen(false);
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
    handlePilotiSetupConfirm,
    handlePilotiSetupClose,
  };
}

function calculateStackedViewPositions(params: {
  centerY: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
}) {
  const totalHeight = params.topHeight + params.gap + params.bottomHeight;
  return {
    topY: params.centerY - totalHeight / 2 + params.topHeight / 2,
    bottomY: params.centerY + totalHeight / 2 - params.bottomHeight / 2,
  };
}

function resolveHouseViewInsertion(params: {
  viewType: HouseViewType;
  isAtLimit: boolean;
  preAssignedSides: HousePreAssignedSideDisplay[];
  availableSides: HouseSide[];
}) {
  if (params.isAtLimit) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByViewLimit};
  }

  if (params.viewType === 'top') {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly};
  }

  if (params.preAssignedSides.length > 0) {
    const availableSlots =
      params.preAssignedSides.filter((slot) => !slot.onCanvas);
    if (!availableSlots.length) {
      return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoFreeInstanceSlots};
    }

    if (availableSlots.length === 1) {
      return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly, side: availableSlots[0].side};
    }

    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.openInstanceSlotSelector, slots: params.preAssignedSides};
  }

  if (!params.availableSides.length) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoAvailableSides};
  }

  if (params.availableSides.length === 1) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly, side: params.availableSides[0]};
  }

  return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.openSideSelector};
}
