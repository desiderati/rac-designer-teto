import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  DEFAULT_HOUSE_PILOTI,
  type HousePiloti,
  type HouseRuntimeViews,
  type HouseState,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';

interface EditorHousePilotiCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  getAggregate: () => HouseAggregate | null;
  getSelectedPilotiHeights: () => readonly number[];
  getAllGroups: () => TGroup[];
  updateRuntimePiloti(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    runtimeViews: HouseRuntimeViews<TGroup>;
    pilotiId: string;
    pilotiData: Partial<HousePiloti>;
    selectedPilotiHeights: readonly number[];
    groups: TGroup[];
  }): { updated: boolean; shouldRefreshAutoContraventamento: boolean };
  persistHouse: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de piloti, mantendo regras de interpolação e efeitos
 * visuais fora do serviço geral de comandos da casa.
 */
export class EditorHousePilotiCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: EditorHousePilotiCommandServiceArgs<TGroup>) {
  }

  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return;

    const result = this.args.updateRuntimePiloti({
      aggregate,
      house,
      pilotiId,
      pilotiData,
      selectedPilotiHeights: this.args.getSelectedPilotiHeights(),
      runtimeViews: this.args.getRuntimeHouse()?.views ?? {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      groups: this.args.getAllGroups(),
    });
    if (!result.updated) return;

    this.args.persistHouse();
    if (result.shouldRefreshAutoContraventamento) {
      this.args.refreshAutoContraventamento();
    }
    this.args.requestCanvasRender();
    this.args.notify();
  }

  calculateAndApplyRecommendedHeights(): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    aggregate.recalculateRecommendedPilotiData(
      DEFAULT_HOUSE_PILOTI,
      true,
      this.args.getSelectedPilotiHeights(),
    );
    this.args.persistHouse();
  }
}
