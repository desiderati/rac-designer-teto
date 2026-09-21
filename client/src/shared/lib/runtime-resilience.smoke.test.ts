import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  installChunkRecovery,
  isChunkLoadError,
  recordPdfExportTelemetry,
} from '@/shared/lib/runtime-resilience.ts';

describe('runtime-resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('classifica falhas de módulos dinâmicos e ignora erros comuns', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkLoadError('Loading chunk 42 failed')).toBe(true);
    expect(isChunkLoadError(new Error('Falha ao preparar o PDF'))).toBe(false);
  });

  it('instala e remove listeners globais de recuperação', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const cleanup = installChunkRecovery();
    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    cleanup();
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('emite evento interno e mantém uma janela curta de histórico local', () => {
    const listener = vi.fn();
    window.addEventListener('rac:pdf-export-telemetry', listener);

    const event = recordPdfExportTelemetry('prepare_failed', {
      errorName: 'ChunkLoadError',
      errorMessage: 'asset indisponível',
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({detail: event});
    expect(event.version).toMatch(/^.+/);
    expect(JSON.parse(localStorage.getItem('rac-designer.pdf-export-telemetry') ?? '[]')).toHaveLength(1);

    window.removeEventListener('rac:pdf-export-telemetry', listener);
  });
});
