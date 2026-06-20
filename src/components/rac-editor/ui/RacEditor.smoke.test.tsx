import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useIndexedDbConstructionSiteSessionStorage} from '@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts';
import {useConstructionSiteManagementController} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {RacEditor} from '@/components/rac-editor/ui/RacEditor.tsx';
import type {StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';

vi.mock('@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts', () => ({
  useIndexedDbConstructionSiteSessionStorage: vi.fn(),
}));

vi.mock('@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx', () => ({
  ConstructionSiteManagementPanel: ({
    actions,
    canOpenRacEditor,
    constructionSite,
    onBackToCanvas,
  }: ReturnType<typeof useConstructionSiteManagementController> & {
    onBackToCanvas?: () => void;
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

describe('RacEditor.tsx', () => {
  beforeEach(() => {
    vi.mocked(useIndexedDbConstructionSiteSessionStorage).mockReset();
  });

  it('exibe texto visível enquanto o canvas carrega', () => {
    vi.mocked(useIndexedDbConstructionSiteSessionStorage).mockReturnValue({status: 'loading'});

    render(<RacEditor/>);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando o Canvas...');
    expect(screen.getByText('Carregando o Canvas...')).toBeVisible();
  });

  it('exibe a mensagem de erro quando o storage local falha', () => {
    vi.mocked(useIndexedDbConstructionSiteSessionStorage).mockReturnValue({
      status: 'error',
      message: 'Falha ao carregar construções.',
    });

    render(<RacEditor/>);

    expect(screen.getByText('Falha ao carregar construções.')).toBeVisible();
  });

  it('prepara a construção apta antes de voltar da gestão para o Canvas', async () => {
    const user = userEvent.setup();
    vi.mocked(useIndexedDbConstructionSiteSessionStorage).mockReturnValue({
      status: 'ready',
      storage: createConstructionSiteSessionStorage(),
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
});
