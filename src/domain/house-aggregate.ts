import type {HouseSide, HouseState, HouseType, HousePiloti, HouseViewType} from '@/shared/types/house.ts';

export class HouseAggregate<TGroup> {
  private state: HouseState<TGroup>;

  constructor(initialState: HouseState<TGroup>) {
    this.state = initialState;
  }

  getState(): HouseState<TGroup> {
    return this.state;
  }

  replaceState(nextState: HouseState<TGroup>): void {
    this.state = nextState;
  }

  setHouseType(type: HouseType): void {
    this.state.houseType = type;
    if (type === null) {
      this.state.preAssignedSides = {};
    }
  }

  clearHouseTypeAndSlots(): void {
    this.state.houseType = null;
    this.state.preAssignedSides = {};
  }

  setPilotis(pilotis: Record<string, HousePiloti>): void {
    this.state.pilotis = pilotis;
  }

  setViews(views: HouseState<TGroup>['views']): void {
    this.state.views = views;
  }

  setSideAssignments(sideAssignments: HouseState<TGroup>['sideAssignments']): void {
    this.state.sideAssignments = sideAssignments;
  }

  setElements(elements: HouseState<TGroup>['elements']): void {
    this.state.elements = elements;
  }

  setPreAssignedSlots(preAssignedSides: Record<string, HouseSide>): void {
    this.state.preAssignedSides = preAssignedSides;
  }

  getViewCount(viewType: HouseViewType): number {
    return this.state.views[viewType].length;
  }
}
