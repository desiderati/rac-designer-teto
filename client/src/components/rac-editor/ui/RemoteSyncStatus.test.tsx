import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RemoteSyncProvider, type RemoteSyncConflict } from '@/contexts/RemoteSyncContext.tsx';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';
import { RemoteSyncStatus } from './RemoteSyncStatus.tsx';

function state(version: number): ConstructionSiteState {
  return {
    constructionSite: {
      id: 'site-1', externalCode: 'CC2609', constructionDate: '2026-09-26',
      communityId: 'community-1', status: 'in_progress', documentVersion: version,
      createdAt: '2026-09-24T10:00:00.000Z', updatedAt: '2026-09-24T12:00:00.000Z',
    },
    communities: [], families: [], monitors: [], houses: [],
  };
}

describe('modal de conflito remoto', () => {
  it.each(['archived', 'in_progress'] as const)('oferece decisão de exclusão respeitando status remoto %s', async (status) => {
    const remoteState = state(4); remoteState.constructionSite.status = status;
    const keepLocalVersion = vi.fn(async () => undefined);
    render(<RemoteSyncProvider value={{
      status: 'conflict', revision: 0, lastSyncedAt: null, errorMessage: null,
      conflict: {operation: 'remove', constructionSiteId: 'site-1', baseState: state(3),
        localState: state(3), remoteState, remoteVersion: 4, conflicts: [], remoteOnlyEntities: []},
      dismissError: vi.fn(), useRemoteVersion: vi.fn(), keepLocalVersion, retry: vi.fn(),
    }}><RemoteSyncStatus/></RemoteSyncProvider>);
    const button = screen.getByRole('button', {name: 'Confirmar exclusão'});
    expect(screen.queryByRole('button', {name: 'Mesclar sem remover dados'})).not.toBeInTheDocument();
    if (status === 'archived') {
      expect(button).toBeEnabled();
      await act(async () => { fireEvent.click(button); });
      expect(keepLocalVersion).toHaveBeenCalledOnce();
    } else {
      expect(button).toBeDisabled();
      expect(screen.getByText(/não está mais arquivada/)).toBeVisible();
    }
  });

  it('não monta a resolução quando o usuário está preenchendo um formulário', () => {
    const conflict: RemoteSyncConflict = {
      constructionSiteId: 'site-1',
      baseState: state(3),
      localState: state(3),
      remoteState: state(4),
      remoteVersion: 4,
      conflicts: [],
      remoteOnlyEntities: [],
    };

    render(
      <RemoteSyncProvider value={{
        status: 'conflict', revision: 0, lastSyncedAt: null, errorMessage: null, conflict,
        dismissError: vi.fn(), useRemoteVersion: vi.fn(), keepLocalVersion: vi.fn(), retry: vi.fn(),
      }}>
        <RemoteSyncStatus visible={false}/>
      </RemoteSyncProvider>,
    );

    expect(screen.queryByRole('dialog', {name: 'Conflito de sincronização'})).not.toBeInTheDocument();
  });

  it('mantém comparação rolável e ações em rodapé próprio em telas estreitas', () => {
    const baseState = state(3);
    const localState = structuredClone(baseState);
    const remoteState = state(4);
    localState.houses.push({ id: 'house-local' } as ConstructionSiteState['houses'][number]);
    remoteState.families.push({ id: 'family-remote' } as ConstructionSiteState['families'][number]);
    const conflict: RemoteSyncConflict = {
      constructionSiteId: 'site-1', baseState, localState, remoteState,
      remoteVersion: 4, remoteSavedAt: '2026-09-24T13:00:00.000Z',
      conflicts: [], remoteOnlyEntities: [{ kind: 'families', id: 'family-remote', label: 'Família remota' }],
    };

    render(
      <RemoteSyncProvider value={{
        status: 'conflict', revision: 0, lastSyncedAt: null, errorMessage: null, conflict,
        dismissError: vi.fn(), useRemoteVersion: vi.fn(), keepLocalVersion: vi.fn(), retry: vi.fn(),
      }}>
        <RemoteSyncStatus/>
      </RemoteSyncProvider>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Conflito de sincronização' });
    expect(dialog).toHaveClass('min-w-0', 'overflow-hidden', 'flex-col');
    expect(within(dialog).getByText('1 casa adicionada')).toBeVisible();
    expect(within(dialog).getByText('1 família adicionada')).toBeVisible();
    expect(within(dialog).getByText(/Salva no servidor: 24\/09\/2026/)).toBeVisible();
    const actions = screen.getByTestId('remote-sync-conflict-actions');
    expect(actions).toHaveClass('shrink-0');
    expect(actions).not.toHaveClass('sticky');
    const actionGroup = actions.firstElementChild;
    expect(actionGroup).toHaveClass('flex-col', 'sm:flex-row', 'sm:justify-between');
    expect(actionGroup).not.toHaveClass('flex-col-reverse');
    expect(within(actions).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Usar versão remota',
      'Mesclar sem remover dados',
    ]);
  });
});
