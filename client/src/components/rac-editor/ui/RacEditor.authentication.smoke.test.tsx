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

    expect(screen.getByRole('heading', { name: /Da ideia à planta/i })).toBeVisible();
    expect(screen.getByRole('img', { name: /Editor RAC Designer TETO/i })).toHaveAttribute(
      'src',
      '/manus-storage/pasted_file_3D3Rgh_image_7992f010.png',
    );
    expect(screen.queryByText('Imagens devem ser enviadas ao Storage do Manus')).not.toBeInTheDocument();
  });

  it('starts Manus login only after the CTA is activated', async () => {
    const user = userEvent.setup();
    render(<RacEditor />);

    await user.click(screen.getByRole('button', { name: /Entrar com Manus/i }));

    expect(startLogin).toHaveBeenCalledTimes(1);
  });
});
