import type {HouseType} from '@/shared/types/house.ts';
import type {HousePilotiWritePort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {HouseViewWritePort} from '@/components/rac-editor/ports/HouseViewPort.ts';

/**
 * Dados necessários para configurar as alturas de piloti disponíveis na casa.
 */
export interface PilotisSetup {
  /** Alturas de piloti habilitadas para essa casa. */
  selectedPilotiHeights: readonly number[];
}

/**
 * Comandos de configuração inicial da casa e da família associada.
 */
export interface HouseSetupWritePort {
  /** Aplica as alturas de piloti disponíveis à casa ativa. */
  applyPilotisSetup(setup: PilotisSetup): void;

  /** Renomeia a família associada à casa em edição. */
  renameFamily(name: string): void;
}

/**
 * Comandos de ciclo de vida da casa no editor.
 */
export interface HouseLifecycleWritePort {
  /** Define o tipo de casa ativo, ou limpa a seleção quando o valor for `null`. */
  setHouseType(type: HouseType): void;

  /** Atualiza escadas automáticas conforme as configurações atuais. */
  refreshAutoStairsForCurrentSettings(): void;

  /** Recalcula o contraventamento automático para as vistas atualmente no canvas. */
  refreshAutoContraventamentoForCurrentHouse(): void;

  /** Atualiza os marcadores de referência entre planta e vistas elevadas. */
  refreshHouseViewReferenceMarkersForCurrentHouse(): void;

  /** Reinicia o estado lógico da casa e suas projeções de runtime conhecidas. */
  resetHouse(): void;
}

/**
 * Comandos ligados ao terreno da casa.
 */
export interface HouseTerrainWritePort {
  /** Define o tipo de terreno e retorna o valor normalizado efetivamente aplicado. */
  setTerrainType(terrainType: number): number;
}

/**
 * Porta agregadora de escrita para os fluxos de casa usados pelo editor.
 *
 * Esta porta ainda pode ser implementada por adapters de infraestrutura, mas a
 * UI passa a depender de comandos explícitos em vez de conhecer diretamente a
 * implementação transitória de estado.
 *
 * A divisão em subinterfaces é deliberada: ela deixa claro quais métodos são
 * comandos e impede que consultas sejam herdadas por uma porta de escrita.
 */
export interface HouseWritePort
  extends HouseSetupWritePort,
    HouseLifecycleWritePort,
    HouseTerrainWritePort,
    HouseViewWritePort,
    HousePilotiWritePort {
}
