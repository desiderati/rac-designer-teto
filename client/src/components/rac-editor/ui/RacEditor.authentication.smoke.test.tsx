import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RacEditor } from './RacEditor';
import { useAuth } from '@/_core/hooks/useAuth.ts';
import { clearLoginLock, startLogin } from '@/const.ts';

vi.mock('@/_core/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/const.ts', () => ({
  clearLoginLock: vi.fn(),
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
    vi.mocked(clearLoginLock).mockReset();
    window.history.replaceState({}, document.title, '/');
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
    expect(screen.getByLabelText('Casa TETO')).toBeVisible();
    expect(screen.getByLabelText('Recursos principais')).toBeVisible();
    expect(screen.getByLabelText('Recursos principais')).toHaveTextContent('Base global');
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

  it('shows a friendly warning below the minimum viewport width and allows collapsing it', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 390});

    try {
      const user = userEvent.setup();
      render(<RacEditor/>);
      const warning = screen.getByTestId('minimum-viewport-warning');
      expect(warning).toHaveTextContent('pelo menos 420 px');
      expect(warning).toHaveClass('top-3', 'max-w-md');
      expect(warning).not.toHaveClass('bottom-3');

      await user.click(screen.getByRole('button', {name: 'Ocultar aviso de viewport'}));
      expect(screen.queryByTestId('minimum-viewport-warning')).not.toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Reabrir aviso de viewport'})).toBeVisible();

      await user.click(screen.getByRole('button', {name: 'Reabrir aviso de viewport'}));
      expect(screen.getByTestId('minimum-viewport-warning')).toBeVisible();
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: originalWidth});
    }
  });

  it('shows a friendly recovery state when OAuth returns an invalid attempt', async () => {
    window.history.replaceState({}, document.title, '/?oauthError=invalid_state');

    render(<RacEditor/>);

    expect(await screen.findByRole('alert')).toHaveTextContent('A sessão de login expirou');
    expect(screen.getByRole('button', {name: 'Tentar novamente'})).toBeVisible();
    expect(screen.queryByText(/invalid oauth state/i)).not.toBeInTheDocument();
  });
});
