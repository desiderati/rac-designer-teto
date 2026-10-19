import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RemotePendingSessions} from './RemotePendingSessions.tsx';

const session = {sessionId: 'synthetic-old-session', revision: 2,
  savedAt: '2026-10-19T12:00:00.000Z', documentCount: 1};

describe('retomada explícita de outra sessão', () => {
  it('exige ação humana para transferir a fila e bloqueia dupla ação durante a transferência', async () => {
    let finish!: () => void;
    const recover = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const continueCurrent = vi.fn();
    render(<RemotePendingSessions sessions={[session]} recover={recover} continueCurrent={continueCurrent}/>);
    expect(recover).not.toHaveBeenCalled();
    expect(screen.getByText(/feche a aba anterior/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Retomar esta fila'}));
    expect(recover).toHaveBeenCalledWith(session);
    expect(screen.getByRole('button', {name: 'Retomar esta fila'})).toBeDisabled();
    expect(screen.getByRole('button', {name: /Continuar sem/})).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', {name: /Continuar sem/})).toBeEnabled());
  });

  it('permite preservar as outras filas e exibe falha sem transferir automaticamente', () => {
    const recover = vi.fn(async () => undefined);
    const continueCurrent = vi.fn();
    render(<RemotePendingSessions sessions={[session]} message='Fila mudou; revise novamente.'
      recover={recover} continueCurrent={continueCurrent}/>);
    expect(screen.getByRole('alert')).toHaveTextContent('Fila mudou');
    fireEvent.click(screen.getByRole('button', {name: /Continuar sem/}));
    expect(continueCurrent).toHaveBeenCalledOnce();
    expect(recover).not.toHaveBeenCalled();
  });
});
