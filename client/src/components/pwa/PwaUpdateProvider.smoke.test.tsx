import {act, render, waitFor} from '@testing-library/react';
import {useEffect, type MouseEvent} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {toast} from 'sonner';
import {PwaUpdateProvider} from './PwaUpdateProvider.tsx';
import {useReportPwaUpdateSafety} from './PwaUpdateSafetyContext.ts';

const pwaMocks = vi.hoisted(() => ({
  onNeedRefresh: null as (() => void) | null,
  onNeedReload: null as (() => void) | null,
  updateSW: vi.fn(async () => undefined),
  registerSW: vi.fn(),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: {onNeedRefresh: () => void; onNeedReload: () => void}) => {
    pwaMocks.onNeedRefresh = options.onNeedRefresh;
    pwaMocks.onNeedReload = options.onNeedReload;
    pwaMocks.registerSW();
    return pwaMocks.updateSW;
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {warning: vi.fn(), error: vi.fn()}),
}));

function SafetyReporter({syncStatus}: {syncStatus: 'pending' | 'synced'}) {
  const report = useReportPwaUpdateSafety();
  useEffect(() => {
    report({syncStatus, documentSaveStatus: 'saved', hasUnsavedFormChanges: false});
  }, [report, syncStatus]);
  return null;
}

function clickLatestToastAction() {
  const action = vi.mocked(toast).mock.lastCall?.[1]?.action;
  if (!action || typeof action !== 'object' || !('onClick' in action)) {
    throw new Error('O aviso de atualização não possui ação.');
  }
  action.onClick({} as MouseEvent<HTMLButtonElement>);
}

describe('PwaUpdateProvider', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true);
    Object.defineProperty(navigator, 'serviceWorker', {configurable: true, value: {}});
    pwaMocks.onNeedRefresh = null;
    pwaMocks.onNeedReload = null;
    pwaMocks.updateSW.mockClear();
    pwaMocks.registerSW.mockClear();
    vi.mocked(toast).mockClear();
    vi.mocked(toast.warning).mockClear();
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    vi.unstubAllEnvs();
  });

  it('aguarda a sincronização antes de permitir a recarga solicitada pelo usuário', async () => {
    const view = render(
      <PwaUpdateProvider><SafetyReporter syncStatus='pending'/></PwaUpdateProvider>,
    );
    await waitFor(() => expect(pwaMocks.registerSW).toHaveBeenCalledOnce());
    act(() => pwaMocks.onNeedRefresh?.());
    await waitFor(() => expect(toast).toHaveBeenCalled());

    act(clickLatestToastAction);
    expect(pwaMocks.updateSW).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalled();

    view.rerender(<PwaUpdateProvider><SafetyReporter syncStatus='synced'/></PwaUpdateProvider>);
    await waitFor(() => {
      const notice = vi.mocked(toast).mock.lastCall?.[1] as {description: string};
      expect(notice.description).toContain('Atualize quando');
    });
    act(clickLatestToastAction);
    expect(pwaMocks.updateSW).toHaveBeenCalledWith(true);
  });

  it('mostra o aviso quando outra aba ativa a nova versão', async () => {
    render(<PwaUpdateProvider><SafetyReporter syncStatus='synced'/></PwaUpdateProvider>);
    await waitFor(() => expect(pwaMocks.registerSW).toHaveBeenCalledOnce());

    act(() => pwaMocks.onNeedReload?.());

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      'Nova versão disponível',
      expect.objectContaining({description: 'Atualize quando for conveniente para usar a versão mais recente.'}),
    ));
    expect(pwaMocks.updateSW).not.toHaveBeenCalled();
  });
});
