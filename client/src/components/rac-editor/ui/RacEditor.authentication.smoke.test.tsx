import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RacEditor } from './RacEditor';
import { useAuth } from '@/_core/hooks/useAuth.ts';
import { startLogin } from '@/const.ts';

vi.mock('@/_core/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/const.ts', () => ({
  startLogin: vi.fn(),
}));

describe('RacEditor authentication landing', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(startLogin).mockReset();
  });

  it('shows the product landing with the real editor screenshot before login', () => {
    render(<RacEditor />);

    expect(screen.getByRole('main')).toHaveClass('rac-login');
    expect(screen.getByRole('heading', { name: /Da ideia à planta/i })).toBeVisible();
    const identity = screen.getByLabelText('Identidade do RAC Designer TETO');
    expect(identity).toHaveTextContent('FERRAMENTA PARA QUEM');
    expect(identity).toHaveTextContent('CONSTRÓI IMPACTO');
    const impact = screen.getByLabelText('Impacto social');
    expect(impact).toHaveTextContent('Mais que plantas.');
    expect(impact).toHaveTextContent('São comunidades.');
    expect(screen.getByText('Base global')).toBeVisible();
    expect(screen.getByText('Histórico')).toBeVisible();
    expect(screen.getByText('Storage seguro')).toBeVisible();
    expect(screen.getByRole('img', { name: /Editor RAC Designer TETO/i })).toHaveAttribute(
      'src',
      '/api/public-assets/rac-editor-landing-screenshot-harmonized_95473d21.png',
    );
    expect(screen.getByRole('img', { name: /casa TETO elevada/i })).toHaveAttribute(
      'src',
      '/api/public-assets/teto-house-linework-transparent-cropped_770579e2.png',
    );
    expect(screen.queryByText('Imagens devem ser enviadas ao Storage do Manus')).not.toBeInTheDocument();
  });

  it('starts Manus login only after the CTA is activated', async () => {
    const user = userEvent.setup();
    render(<RacEditor />);

    await user.click(screen.getByRole('button', { name: /Entrar com Manus/i }));

    expect(startLogin).toHaveBeenCalledTimes(1);
  });

  it('shows the animated loading state while Manus OAuth validates the session', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(<RacEditor />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando o Canvas...');
  });
});
