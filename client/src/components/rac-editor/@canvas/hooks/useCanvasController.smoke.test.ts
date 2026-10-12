import {describe, expect, it} from 'vitest';
import {
  resolveConfiguredHouseAnalysisStatus,
  shouldRestoreConfiguredHouseTopView,
} from './useCanvasController.ts';

describe('shouldRestoreConfiguredHouseTopView', () => {
  it('recupera uma casa preparada sem Planta visual', () => {
    expect(shouldRestoreConfiguredHouseTopView('prepared', false)).toBe(true);
  });

  it('recupera uma casa já inserida quando o registro visual ficou órfão', () => {
    expect(shouldRestoreConfiguredHouseTopView('inserted', false)).toBe(true);
  });

  it('não duplica a Planta quando o grupo top já está no Canvas', () => {
    expect(shouldRestoreConfiguredHouseTopView('prepared', true)).toBe(false);
    expect(shouldRestoreConfiguredHouseTopView('inserted', true)).toBe(false);
  });

  it('não tenta inserir uma casa sem Análise de Campo configurada ou sem runtime', () => {
    expect(shouldRestoreConfiguredHouseTopView(undefined, false)).toBe(false);
    expect(shouldRestoreConfiguredHouseTopView('prepared', null)).toBe(false);
  });

  it('reconhece configuração legada persistida sem fieldAnalysis.status', () => {
    expect(resolveConfiguredHouseAnalysisStatus({
      explicitStatus: undefined,
      hasHouseBeenDefined: true,
      houseType: 'tipo6',
      persistedHouseType: 'tipo6',
      persistedPilotiCount: 12,
    })).toBe('prepared');
    expect(resolveConfiguredHouseAnalysisStatus({
      explicitStatus: undefined,
      hasHouseBeenDefined: true,
      houseType: null,
      persistedHouseType: null,
      persistedPilotiCount: 0,
    })).toBeUndefined();
  });
});
