import type {DomainHouseType, DomainPilotiData, DomainViewType} from "./house-use-cases";

export interface HousePilotiRepository {
  getHouseType(): DomainHouseType | null;

  getViewCount(viewType: DomainViewType): number;

  getPilotis(): Record<string, DomainPilotiData>;

  setPilotis(pilotis: Record<string, DomainPilotiData>): void;
}
