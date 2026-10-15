import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createConstructionSiteSession} from '@/components/rac-editor/lib/construction-site-session.ts';
import {useRemoteConstructionSiteSessionStorage} from '@/bootstrap/useRemoteConstructionSiteSessionStorage.ts';
import {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {RacEditor} from '@/components/rac-editor/ui/RacEditor.tsx';
import type {StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {RemoteSyncConflict} from '@/contexts/RemoteSyncContext.tsx';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {useAuth} from '@/_core/hooks/useAuth.ts';

vi.mock('@/bootstrap/useRemoteConstructionSiteSessionStorage.ts', () => ({
  useRemoteConstructionSiteSessionStorage: vi.fn(),
}));

vi.mock('@/_core/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/StorageImageUploadContext.tsx', () => ({
  StorageImageUploadProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

vi.mock('@/contexts/TerrainPhotoDescriptionContext.tsx', () => ({
  TerrainPhotoDescriptionProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

vi.mock('@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx', () => ({
  ConstructionSiteManagementPanel: ({
    actions,
    canOpenRacEditor,
    constructionSite,
    onBackToCanvas,
    hasRemoteSyncConflict,
    onOpenRemoteSyncConflict,
  }: ReturnType<typeof useConstructionSiteManagementController> & {
    onBackToCanvas?: () => void;
    hasRemoteSyncConflict?: boolean;
    onOpenRemoteSyncConflict?: () => void;
  }) => (
    <div>
      <p>Gestão {constructionSite?.constructionSite.externalCode ?? 'sem construção'}</p>
      <button
        type='button'
        onClick={async () => {
          await actions.createConstructionSite({
            externalCode: 'CC2603',
            constructionDate: '2026-05-11',
            communityName: 'Tiradentes',
          });
          await actions.createHouse({familyName: 'Família 01'});
          await actions.createConstructionSite({
            externalCode: 'CC2604',
            constructionDate: '2026-05-12',
            communityName: 'Heliópolis',
          });
        }}
      >
        Preparar gestão sem casa
      </button>
      {canOpenRacEditor ? (
        <button type='button' onClick={onBackToCanvas}>
          Voltar ao Canvas
        </button>
      ) : null}
      {hasRemoteSyncConflict ? <button type='button' onClick={onOpenRemoteSyncConflict}>Resolver conflito</button> : null}
    </div>
  ),
}));

vi.mock('@/components/rac-editor/ui/RacEditorContent.tsx', () => ({
  RacEditorContent: () => {
    const constructionSiteManagement = useConstructionSiteManagementController({});
    const constructionCode = constructionSiteManagement.constructionSite?.constructionSite.externalCode
      ?? 'sem construção';

    return <div>Canvas carregado {constructionCode}</div>;
  },
}));

function createConstructionSiteSessionStorage(
  initialConstructionSites: StoredConstructionSitesDocument['constructionSites'] = [],
) {
  let constructionSites = initialConstructionSites;

  return {
    read: vi.fn(() => ({version: 1, constructionSites})),
    write: vi.fn((nextConstructionSites: StoredConstructionSitesDocument['constructionSites']) => {
      constructionSites = nextConstructionSites;
    }),
  };
}

function createSync() {
  return {
    status: 'synced' as const,
    revision: 0,
    lastSyncedAt: null,
    errorMessage: null,
    conflict: null,
    dismissError: vi.fn(),
    useRemoteVersion: vi.fn(),
    keepLocalVersion: vi.fn(),
    retry: vi.fn(),
  };
}

function conflictForSite(): RemoteSyncConflict {
  const state: ConstructionSiteState = {
    constructionSite: {
      id: 'site-1', externalCode: 'CC2603', constructionDate: '2026-05-11', communityId: 'community-1',
      status: 'in_progress', documentVersion: 1, createdAt: '2026-05-11T10:00:00.000Z', updatedAt: '2026-05-11T10:00:00.000Z',
    },
    communities: [], families: [], monitors: [], houses: [],
  };
  return {
    constructionSiteId: 'site-1', baseState: state, localState: state,
    remoteState: {...state, constructionSite: {...state.constructionSite, documentVersion: 2}},
    remoteVersion: 2, conflicts: [], remoteOnlyEntities: [],
  };
}

describe('RacEditor.tsx', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([420, 767, 768])('escolhe a entrada antes de montar o Canvas em %i px', (width) => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({matches: width < 768, addEventListener: vi.fn(), removeEventListener: vi.fn()})));
    const storage = createConstructionSiteSessionStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-10-03', communityName: 'Campo'});
    session.createHouse({familyName: 'Casa preparada'});
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({status: 'ready', storage, sync: createSync()});
    render(<RacEditor/>);
    if (width < 768) {
      expect(screen.getByText('Gestão CC2603')).toBeVisible();
      expect(screen.queryByText('Canvas carregado CC2603')).not.toBeInTheDocument();
    } else {
      expect(screen.getByText('Canvas carregado CC2603')).toBeVisible();
    }
  });
  beforeEach(() => {
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: {id: 1, openId: 'test-user', name: 'Teste', email: null, loginMethod: 'manus', role: 'user', createdAt: '2026-09-17T00:00:00.000Z', updatedAt: '2026-09-17T00:00:00.000Z', lastSignedIn: '2026-09-17T00:00:00.000Z'},
      loading: false,
      error: null,
      isAuthenticated: true,
      refresh: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('exibe texto visível enquanto o canvas carrega', () => {
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({status: 'loading'});

    render(<RacEditor/>);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando o Canvas...');
    expect(screen.getByText('Carregando o Canvas...')).toBeVisible();
  });

  it('exibe a mensagem de erro quando o storage remoto falha', () => {
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({
      status: 'error',
      message: 'Falha ao carregar construções.',
    });

    render(<RacEditor/>);

    expect(screen.getByText('Falha ao carregar construções.')).toBeVisible();
  });

  it('prepara a construção apta antes de voltar da gestão para o Canvas', async () => {
    const user = userEvent.setup();
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({
      status: 'ready',
      storage: createConstructionSiteSessionStorage(),
      sync: createSync(),
    });

    render(<RacEditor/>);

    expect(screen.getByText('Gestão sem construção')).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Preparar gestão sem casa'}));

    await waitFor(() => {
      expect(screen.getByText('Gestão CC2604')).toBeVisible();
      expect(screen.getByRole('button', {name: 'Voltar ao Canvas'})).toBeVisible();
    });

    await user.click(screen.getByRole('button', {name: 'Voltar ao Canvas'}));

    expect(await screen.findByText('Canvas carregado CC2603')).toBeVisible();
  });

  it('oferece resolução explícita na gestão sem casa e não abre novo conflito sem clique', async () => {
    const user = userEvent.setup();
    const storage = createConstructionSiteSessionStorage();
    createConstructionSiteSession(storage).createConstructionSite({
      externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Campo',
    });
    const firstConflict = conflictForSite();
    const sync = {...createSync(), status: 'conflict' as const, conflict: firstConflict};
    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({status: 'ready', storage, sync});
    const {rerender} = render(<RacEditor/>);

    expect(screen.getByText('Gestão CC2603')).toBeVisible();
    expect(screen.queryByText('Canvas carregado CC2603')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', {name: 'Conflito de sincronização'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Resolver conflito'}));
    expect(screen.getByRole('dialog', {name: 'Conflito de sincronização'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Usar versão remota'}));
    expect(sync.useRemoteVersion).toHaveBeenCalledOnce();

    vi.mocked(useRemoteConstructionSiteSessionStorage).mockReturnValue({
      status: 'ready', storage, sync: {...sync, conflict: {...firstConflict, remoteVersion: 3}},
    });
    rerender(<RacEditor/>);
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Conflito de sincronização'})).not.toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'Resolver conflito'})).toBeVisible();
  });
});
