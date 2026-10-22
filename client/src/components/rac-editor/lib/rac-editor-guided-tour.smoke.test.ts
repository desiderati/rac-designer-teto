import {afterEach, describe, expect, it, vi} from 'vitest';

describe('Texto do tour de sincronização', () => {
  afterEach(() => {
    vi.doUnmock('@/shared/local-runtime.ts');
    vi.resetModules();
  });

  it.each([true, false])('explica o destino do salvamento com modo isolado=%s', async isolated => {
    vi.resetModules();
    vi.doMock('@/shared/local-runtime.ts', () => ({isIsolatedLocalMode: isolated}));
    const {racEditorGuidedTourRegistry} = await import('./rac-editor-guided-tour.ts');
    const step = racEditorGuidedTourRegistry.tours
      .find(tour => tour.id === 'rac-editor-intro')?.steps
      .find(candidate => candidate.id === 'rac-sync-status');
    expect(step?.text).toContain(isolated ? 'salvas neste dispositivo' : 'envio ao servidor');
    expect(step?.text).not.toContain(isolated ? 'envio ao servidor' : 'salvas neste dispositivo');
    expect(step?.text).toContain('Se houver falha, toque para tentar novamente');
  });
});
