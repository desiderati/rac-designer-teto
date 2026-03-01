import type {ElementStrategy} from '../elements/element.strategy.ts';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {CanvasGroup, CanvasObject} from "@/components/lib/canvas";

export type HouseViewStrategyKey = HouseViewType;

export interface HouseViewStrategyOptions {
  side?: HouseSide;
}

export type HouseViewStrategy = ElementStrategy<CanvasGroup, CanvasObject, HouseViewStrategyOptions>;
