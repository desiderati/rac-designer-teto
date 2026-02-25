import {useRef, useState} from "react";
import {HousePreAssignedSideDisplay, HouseSide, HouseViewType} from "@/shared/types/house.ts";
import {HouseSideSelectorMode} from "@/components/rac-editor/modals/selectors/HouseSideSelector.tsx";

export function useHouseTypeFlow() {
  const [pendingViewType, setPendingViewType] = useState<HouseViewType | null>(null);
  const [sideSelectorMode, setSideSelectorMode] = useState<HouseSideSelectorMode>("position");
  const [instanceSlots, setInstanceSlots] = useState<HousePreAssignedSideDisplay[]>([]);
  const [pendingNivelSide, setPendingNivelSide] = useState<HouseSide | null>(null);
  const niveisAppliedRef = useRef(false);
  const transitionToNivelRef = useRef(false);

  return {
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    instanceSlots,
    setInstanceSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
  };
}
