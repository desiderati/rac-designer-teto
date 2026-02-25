export interface ViewInstanceRecord<TGroup, TSide extends string> {
  group: TGroup;
  side?: TSide;
  instanceId: string;
}

export type ViewsRecord<TView extends string, TGroup, TSide extends string> = Record<
  TView,
  ViewInstanceRecord<TGroup, TSide>[]
>;

export type SideAssignmentsRecord<TSide extends string, TView extends string> = Record<TSide, TView | null>;

export interface HouseViewsRepository<TView extends string, TSide extends string, TGroup> {

  getViews(): ViewsRecord<TView, TGroup, TSide>;

  setViews(views: ViewsRecord<TView, TGroup, TSide>): void;

  getSideAssignments(): SideAssignmentsRecord<TSide, TView>;

  setSideAssignments(sideAssignments: SideAssignmentsRecord<TSide, TView>): void;

}
