import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useIndexedDbConstructionSiteSessionStorage} from '@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts';
import {RacEditor} from '@/components/rac-editor/ui/RacEditor.tsx';

vi.mock('@/bootstrap/useIndexedDbConstructionSiteSessionStorage.ts', () => ({
  useIndexedDbConstructionSiteSessionStorage: vi.fn(),
}));

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
});
