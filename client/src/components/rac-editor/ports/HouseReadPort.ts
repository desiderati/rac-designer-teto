import type {HouseType} from '@/shared/types/house.ts';
import type {HousePilotiReadPort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {HouseViewReadPort} from '@/components/rac-editor/ports/HouseViewPort.ts';

/**
 * Leituras dos dados humanos de configuração da casa.
 */
export interface HouseSetupReadPort {
  /** Nome da família em edição. */
  getFamilyName(): string;
}

/**
 * Leituras do ciclo de vida e seleção principal da casa.
 */
export interface HouseLifecycleReadPort {
  /** Tipo de casa ativo, ou `null` quando nenhuma casa foi selecionada. */
  getCurrentHouseType(): HouseType;
}

/**
 * Leituras relacionadas ao terreno ativo da casa.
 */
export interface HouseTerrainReadPort {
  /** Tipo de terreno ativo, já normalizado pela regra de domínio/infra atual. */
  getTerrainType(): number;
}

/**
 * Porta de leitura do estado lógico da casa para a UI do editor.
 *
 * Componentes e hooks de apresentação devem depender desta leitura
 * serializável em vez de consultar diretamente o manager de infraestrutura.
 * O contrato não expõe implementações visuais concretas; quando alguma leitura
 * ainda precisa de grupos de runtime, o tipo permanece genérico.
 */
export interface HouseReadPort
  extends HouseSetupReadPort,
    HouseLifecycleReadPort,
    HouseTerrainReadPort,
    HouseViewReadPort,
    HousePilotiReadPort {
}
