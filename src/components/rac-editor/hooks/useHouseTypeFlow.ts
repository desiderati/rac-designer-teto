import {useRef, useState} from "react";
import {HouseSide, ViewType} from "@/lib/house-manager";

export type SideSelectorMode = "position" | "choose-instance";

export interface HouseInstanceSlot {
  label: string;
  side: HouseSide;
  onCanvas: boolean;
}

export function useHouseTypeFlow() {
  const [pendingViewType, setPendingViewType] = useState<ViewType | null>(null);
  const [sideSelectorMode, setSideSelectorMode] = useState<SideSelectorMode>("position");
  const [instanceSlots, setInstanceSlots] = useState<HouseInstanceSlot[]>([]);
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
