import {HousePiloti, HouseTypeExcludeNull, HouseViewType} from "@/shared/types/house.ts";

export interface HouseRepository {

  getHouseType(): HouseTypeExcludeNull | null;

  getViewCount(viewType: HouseViewType): number;

  getPilotis(): Record<string, HousePiloti>;

  setPilotis(pilotis: Record<string, HousePiloti>): void;

}
