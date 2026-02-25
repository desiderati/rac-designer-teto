import {Group} from "fabric";
import type {ElementStrategy} from "../elements/element.strategy.ts";
import type {HouseSide, HouseViewType} from "@/shared/types/house.ts";

export type HouseViewStrategyKey = HouseViewType;

export interface HouseViewStrategyOptions {
  side?: HouseSide;
}

export type HouseViewStrategy = ElementStrategy<Group, HouseViewStrategyOptions>;
