import {Dispatch, MutableRefObject, RefObject, SetStateAction, useRef} from 'react';
import {toast} from 'sonner';
import {NivelDefinition} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';
import {
  shouldResetHouseTypeOnSideSelectorCancel,
  shouldTransitionToNivelDefinition
} from '@/components/rac-editor/lib/house-side.ts';
import {
  DEFAULT_HOUSE_PILOTI,
  HOUSE_VIEW_INSERTION_DECISION_TYPES,
  type HousePreAssignedSideDisplay,
  type HouseSide,
  type HouseType,
  type HouseViewType
} from '@/shared/types/house.ts';
import {HouseSideSelectorMode} from '@/components/rac-editor/@modals/ui/selectors/HouseSideSelector.tsx';
import {PILOTI_CORNER_ID, TIMINGS, TOAST_MESSAGES} from '@/shared/config.ts';
import {getViewLabelForHouseType} from '@/components/rac-editor/lib/house-view.ts';
import {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import {createViewInstanceId} from '@/components/rac-editor/lib/house-identity.ts';
import {resolveHouseViewInsertion} from '@/domain/house/use-cases/house-views-layout.use-case.ts';
import {
  dispatchRacCanvasObjectEvent,
  RAC_HOUSE_INITIAL_VIEWS_INSERTED_EVENT,
  RAC_HOUSE_INITIAL_VIEWS_ELEVATION_INSERTED_EVENT,
} from '@/components/rac-editor/@canvas/lib/canvas-object-dom-events.ts';
import {useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';

interface UseCanvasHouseViewActionsArgs {
  canvasRef: RefObject<(
    CanvasObjectCreationHandle
    & CanvasRenderHandle
    & CanvasScreenProjectionHandle
  ) | null>;
  getVisibleCenter: () => { x: number; y: number };
  closeAllMenus: () => void;
  addObjectToCanvas: (obj: CanvasObject) => boolean;
  onHouseDrawingChange: () => void;
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  pendingViewType: HouseViewType | null;
  setPendingViewType: Dispatch<SetStateAction<HouseViewType | null>>;
  sideSelectorMode: HouseSideSelectorMode;
  setSideSelectorMode: Dispatch<SetStateAction<HouseSideSelectorMode>>;
  setHouseSideSlots: Dispatch<SetStateAction<HousePreAssignedSideDisplay[]>>;
  pendingNivelSide: HouseSide | null;
  setPendingNivelSide: Dispatch<SetStateAction<HouseSide | null>>;
  niveisAppliedRef: MutableRefObject<boolean>;
  transitionToNivelRef: MutableRefObject<boolean>;
  shouldShowAllElevationNivelLabels?: () => boolean;
  shouldConfigureCornerPilotiNiveisOnHouseInsert?: () => boolean;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
}

const HOUSE_TOP_VIEW_TOUR_KIND = 'house-top-view-inserted';
const HOUSE_ELEVATION_VIEW_TOUR_KIND = 'house-elevation-view-inserted';
const HOUSE_TOP_VIEW_TARGET = 'house-top-view';
const HOUSE_TOP_VIEW_PILOTI_TARGET = 'house-top-view-piloti';
const HOUSE_ELEVATION_VIEW_TARGET = 'house-elevation-view';

const DEFAULT_INITIAL_CORNER_NIVEIS: Record<string, NivelDefinition> = {
  [PILOTI_CORNER_ID.topLeft]: {
    nivel: DEFAULT_HOUSE_PILOTI.nivel,
    isMaster: true,
  },
  [PILOTI_CORNER_ID.topRight]: {
    nivel: DEFAULT_HOUSE_PILOTI.nivel,
    isMaster: false,
  },
  [PILOTI_CORNER_ID.bottomLeft]: {
    nivel: DEFAULT_HOUSE_PILOTI.nivel,
    isMaster: false,
  },
  [PILOTI_CORNER_ID.bottomRight]: {
    nivel: DEFAULT_HOUSE_PILOTI.nivel,
    isMaster: false,
  },
};

interface CanvasEventRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function toCanvasEventRect(rect: DOMRect): CanvasEventRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function projectCanvasRect(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  rect: CanvasEventRect,
): DOMRect | null {
  const topLeft = canvasRef.current?.getCanvasPointScreenPosition({x: rect.left, y: rect.top});
  const bottomRight = canvasRef.current?.getCanvasPointScreenPosition({
    x: rect.left + rect.width,
    y: rect.top + rect.height,
  });
  if (!topLeft || !bottomRight) return null;

  const left = Math.min(topLeft.x, bottomRight.x);
  const top = Math.min(topLeft.y, bottomRight.y);
  const width = Math.abs(bottomRight.x - topLeft.x);
  const height = Math.abs(bottomRight.y - topLeft.y);
  return width > 0 && height > 0 ? new DOMRect(left, top, width, height) : null;
}

function getGroupScreenRect(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  group: CanvasGroup,
): DOMRect | null {
  group.setCoords();
  const bounds = group.getBoundingRect();
  return projectCanvasRect(canvasRef, bounds);
}

function resolveObjectLocalRect(object: CanvasObject): CanvasEventRect | null {
  const width = Number(object.width ?? 0) * Number(object.scaleX ?? 1);
  const height = Number(object.height ?? 0) * Number(object.scaleY ?? 1);
  if (width <= 0 || height <= 0) return null;

  const originX = String(object.originX ?? 'left');
  const originY = String(object.originY ?? 'top');
  const left = Number(object.left ?? 0) - (originX === 'center' ? width / 2 : 0);
  const top = Number(object.top ?? 0) - (originY === 'center' ? height / 2 : 0);

  return {left, top, width, height};
}

function getGroupLocalObjectScreenRect(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  group: CanvasGroup,
  object: CanvasObject,
): DOMRect | null {
  const localRect = resolveObjectLocalRect(object);
  if (!localRect) return null;

  const topLeft = canvasRef.current?.getGroupLocalPointScreenPosition(group, {
    x: localRect.left,
    y: localRect.top,
  });
  const bottomRight = canvasRef.current?.getGroupLocalPointScreenPosition(group, {
    x: localRect.left + localRect.width,
    y: localRect.top + localRect.height,
  });
  if (!topLeft || !bottomRight) return null;

  const left = Math.min(topLeft.x, bottomRight.x);
  const top = Math.min(topLeft.y, bottomRight.y);
  const width = Math.abs(bottomRight.x - topLeft.x);
  const height = Math.abs(bottomRight.y - topLeft.y);
  return width > 0 && height > 0 ? new DOMRect(left, top, width, height) : null;
}

function getTopViewPilotiTourRect(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  plantGroup: CanvasGroup,
): DOMRect | null {
  const objects = plantGroup.getCanvasObjects?.() ?? [];
  const masterCircle = objects.find((object) => object.isPilotiCircle && object.pilotiIsMaster);
  const fallbackCircle = objects.find((object) => object.isPilotiCircle);
  const target = masterCircle ?? fallbackCircle;
  return target ? getGroupLocalObjectScreenRect(canvasRef, plantGroup, target) : null;
}

function dispatchInitialHouseViewsInsertedEvent(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  plantGroup: CanvasGroup,
): void {
  const topViewRect = getGroupScreenRect(canvasRef, plantGroup);
  if (!topViewRect) return;
  const pilotiRect = getTopViewPilotiTourRect(canvasRef, plantGroup) ?? topViewRect;

  dispatchRacCanvasObjectEvent(RAC_HOUSE_INITIAL_VIEWS_INSERTED_EVENT, {
    kind: HOUSE_TOP_VIEW_TOUR_KIND,
    targets: {
      [HOUSE_TOP_VIEW_TARGET]: toCanvasEventRect(topViewRect),
      [HOUSE_TOP_VIEW_PILOTI_TARGET]: toCanvasEventRect(pilotiRect),
    },
  });
}

function dispatchFirstElevationViewInsertedEvent(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  elevationGroup: CanvasGroup,
): void {
  const elevationViewRect = getGroupScreenRect(canvasRef, elevationGroup);
  if (!elevationViewRect) return;

  dispatchRacCanvasObjectEvent(RAC_HOUSE_INITIAL_VIEWS_ELEVATION_INSERTED_EVENT, {
    kind: HOUSE_ELEVATION_VIEW_TOUR_KIND,
    targets: {
      [HOUSE_ELEVATION_VIEW_TARGET]: toCanvasEventRect(elevationViewRect),
    },
  });
}

function isElevationView(viewType: HouseViewType): boolean {
  return viewType !== 'top';
}

export function useCanvasHouseViewActions({
  canvasRef,
  closeAllMenus,
  addObjectToCanvas,
  onHouseDrawingChange,
  houseReadPort,
  houseWritePort,
  pendingViewType,
  setPendingViewType,
  sideSelectorMode,
  setSideSelectorMode,
  setHouseSideSlots,
  pendingNivelSide,
  setPendingNivelSide,
  niveisAppliedRef,
  transitionToNivelRef,
  shouldShowAllElevationNivelLabels,
  shouldConfigureCornerPilotiNiveisOnHouseInsert,
  setSideSelectorOpen,
  setNivelDefinitionOpen,
}: UseCanvasHouseViewActionsArgs) {
  const emitHouseStoreChange = useHouseStoreEmitter();
  const hasDispatchedFirstElevationViewRef = useRef(false);

  const addViewToCanvas =
    (viewType: HouseViewType, side?: HouseSide): CanvasGroup | null => {

      closeAllMenus();
      const instanceId = createViewInstanceId(viewType);
      const house = canvasRef.current?.createHouseViewGroup({
        viewType,
        instanceId,
        side,
        pilotis: houseReadPort.getPilotis() ?? {},
        terrainType: houseReadPort.getTerrainType(),
        showAllElevationNivelLabels: shouldShowAllElevationNivelLabels?.() ?? false,
      });
      if (!house) return null;

      const registration = houseWritePort.registerView({
        viewType,
        instanceId,
        side,
      });
      if (!registration) return null;

      const inserted = addObjectToCanvas(house);
      if (!inserted) {
        houseWritePort.removeView(instanceId);
        return null;
      }
      houseWritePort.refreshHouseViewReferenceMarkersForCurrentHouse();
      houseWritePort.refreshAutoContraventamentoForCurrentHouse();
      emitHouseStoreChange();

      onHouseDrawingChange();

      if (isElevationView(viewType) && !hasDispatchedFirstElevationViewRef.current) {
        hasDispatchedFirstElevationViewRef.current = true;
        dispatchFirstElevationViewInsertedEvent(canvasRef, house);
      }

      const label = getViewLabelForHouseType(viewType, houseReadPort.getCurrentHouseType());
      toast.success(TOAST_MESSAGES.houseViewAdded(label));
      return house;
    };

  // Helper to add a view with side selection logic
  const requestAddView =
    (viewType: HouseViewType) => {

      const slots = houseReadPort.getPreAssignedSides(viewType);
      const availableSides = houseReadPort.getAvailableSides(viewType);
      const decision = resolveHouseViewInsertion({
        viewType,
        isAtLimit: houseReadPort.isViewAtLimit(viewType),
        preAssignedSides: slots,
        availableSides,
      });

      switch (decision.type) {
        case HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByViewLimit: {
          const label = getViewLabelForHouseType(viewType, houseReadPort.getCurrentHouseType());
          toast.error(TOAST_MESSAGES.houseViewLimitReached(label));
          return;
        }

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly:
          addViewToCanvas(viewType, decision.side);
          return;

        case HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoFreeInstanceSlots: {
          const label = getViewLabelForHouseType(viewType, houseReadPort.getCurrentHouseType());
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

  const applyInitialNiveis =
    (niveis: Record<string, NivelDefinition>) => {
      // Capture pending values before any state clearing
      const viewType = pendingViewType;

      // Mark as applied so onClose won't reset the house manager
      niveisAppliedRef.current = true;

      houseWritePort.applyInitialPilotiNiveis(niveis);

      // Adiciona apenas a vista de planta.
      if (viewType) {
        const plantGroup = addViewToCanvas('top'); // Planta
        if (canvasRef.current && plantGroup) {
          setTimeout(() => {
            dispatchInitialHouseViewsInsertedEvent(canvasRef, plantGroup);
          }, TIMINGS.stackedViewRepositionDelayMs);
        }
      }

      // Clear state and close modal
      setPendingViewType(null);
      setPendingNivelSide(null);
      setNivelDefinitionOpen(false);
    };

  const handleSideSelected = (side: HouseSide) => {
    if (!pendingViewType) {
      setSideSelectorOpen(false);
      return;
    }

    if (
      shouldTransitionToNivelDefinition({
        sideSelectorMode,
        hasPreAssignedSides: houseReadPort.hasPreAssignedSides(),
      })
    ) {
      // Initial positioning - open NivelDefinitionEditor instead of adding immediately
      houseWritePort.autoAssignAllSides(pendingViewType, side);
      setPendingNivelSide(side);
      niveisAppliedRef.current = false;

      // Use a flag to prevent handleSideSelectorClose from clearing pendingViewType
      transitionToNivelRef.current = true;
      setSideSelectorOpen(false);

      if (shouldConfigureCornerPilotiNiveisOnHouseInsert?.() ?? true) {
        setNivelDefinitionOpen(true);
        return;
      }

      applyInitialNiveis(DEFAULT_INITIAL_CORNER_NIVEIS);
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
      applyInitialNiveis(niveis);
    };

  const handleNivelDefinitionClose = () => {
    // If apply was just done, don't reset anything
    if (niveisAppliedRef.current) {
      niveisAppliedRef.current = false;
      setNivelDefinitionOpen(false);
      return;
    }
    // User cancelled - reset house type since we already auto-assigned
    houseWritePort.setHouseType(null);
    houseWritePort.resetHouse();
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
        hasPreAssignedSides: houseReadPort.hasPreAssignedSides(),
      })
    ) {
      houseWritePort.setHouseType(null);
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
      houseWritePort.setHouseType(type);

      // Open HouseSideSelector to position the initial view
      // tipo6: position the front view (top/bottom)
      // tipo3: position the open square (left/right)
      const initialViewType: HouseViewType = type === 'tipo6' ? 'front' : 'side2';
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

