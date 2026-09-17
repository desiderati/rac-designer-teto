import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  DEFAULT_HOUSE_PILOTI,
  type HousePiloti,
  type HouseRuntimeViews,
  type HouseState,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {InitialPilotiNivelDefinition} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import {
  clampNivel,
  getMaxNivelForAvailableHeights,
} from '@/shared/types/piloti.ts';

interface EditorHousePilotiCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  getAggregate: () => HouseAggregate | null;
  getSelectedPilotiHeights: () => readonly number[];
  shouldAutoAdjustPilotiHeightsFromNivel: () => boolean;
  getAllGroups: () => TGroup[];
  updateRuntimePiloti(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    runtimeViews: HouseRuntimeViews<TGroup>;
    pilotiId: string;
    pilotiData: Partial<HousePiloti>;
    selectedPilotiHeights: readonly number[];
    groups: TGroup[];
    recalculateHeightOnNivelChange: boolean;
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
      recalculateHeightOnNivelChange: this.args.shouldAutoAdjustPilotiHeightsFromNivel(),
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
      this.args.shouldAutoAdjustPilotiHeightsFromNivel(),
      this.args.getSelectedPilotiHeights(),
    );
    this.args.persistHouse();
  }

  applyInitialPilotiNiveis(niveis: Record<string, InitialPilotiNivelDefinition>): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    const availableHeights = this.args.getSelectedPilotiHeights();
    const maxNivel = getMaxNivelForAvailableHeights(availableHeights);

    Object.entries(niveis).forEach(([pilotiId, entry]) => {
      const rawNivel = Number(entry.nivel);
      aggregate.applyPilotiPatch(pilotiId, {
        isMaster: Boolean(entry.isMaster),
        nivel: clampNivel(
          Number.isFinite(rawNivel) ? rawNivel : DEFAULT_HOUSE_PILOTI.nivel,
          DEFAULT_HOUSE_PILOTI.nivel,
          maxNivel,
        ),
      });
    });

    aggregate.recalculateRecommendedPilotiData(
      DEFAULT_HOUSE_PILOTI,
      true,
      availableHeights,
    );
    this.args.persistHouse();
    this.args.notify();
  }
}
