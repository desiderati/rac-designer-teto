import type {HousePiloti} from '@/shared/types/house.ts';

/**
 * Patch de domínio permitido para alteração de um piloti.
 *
 * A lista é propositalmente fechada para não transformar todo campo futuro de
 * `HousePiloti` em superfície editável por acidente.
 */
export interface HousePilotiPatch {
  /** Altura física selecionada para o piloti. */
  height?: number;

  /** Indica se o piloti é o ponto mestre de nível da casa. */
  isMaster?: boolean;

  /** Nível relativo usado para calcular alturas recomendadas. */
  nivel?: number;
}

/**
 * Definição inicial de nível informada no fluxo de criação da casa.
 *
 * Esse fluxo é deliberadamente distinto da edição manual posterior: durante a
 * inserção inicial, os níveis devem materializar a casa com alturas recomendadas.
 */
export interface InitialPilotiNivelDefinition {
  /** Nível relativo usado para calcular alturas recomendadas. */
  nivel: number;

  /** Indica se este piloti é o ponto mestre de nível da casa. */
  isMaster: boolean;
}

/**
 * Leituras de domínio necessárias para fluxos que editam pilotis.
 */
export interface HousePilotiReadPort {
  /** Snapshot serializável dos pilotis conhecidos pela casa atual. */
  getPilotis(): Record<string, HousePiloti> | undefined;

  /** Alturas disponíveis para a família selecionada. */
  getSelectedPilotiHeights(): readonly number[];

  /** Lê os dados atuais de um piloti específico no estado da casa. */
  getPilotiData(pilotiId: string): HousePiloti;
}

/**
 * Escritas de domínio permitidas para fluxos que alteram pilotis.
 */
export interface HousePilotiWritePort {
  /** Atualiza um piloti e retorna o estado efetivamente aplicado. */
  updatePiloti(pilotiId: string, patch: HousePilotiPatch): HousePiloti;

  /** Aplica os níveis iniciais da casa sempre recalculando alturas recomendadas. */
  applyInitialPilotiNiveis(niveis: Record<string, InitialPilotiNivelDefinition>): void;

  /** Recalcula e aplica as alturas recomendadas para todos os pilotis da casa. */
  calculateAndApplyRecommendedHeights(): void;
}
