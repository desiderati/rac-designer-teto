import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PilotisSetupModal} from '@/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';

vi.mock('@/components/rac-editor/lib/use-mobile.tsx', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('PilotisSetupModal', () => {
  it('confirma pilotis sem solicitar nome da família', async () => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <PilotisSetupModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByPlaceholderText('Nome da Família')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Confirmar'}));

    expect(onConfirm).toHaveBeenCalledWith({
      selectedHeights: [1, 1.2, 1.5, 1.8, 2, 2.2, 2.5, 3],
    });
  });

  it('exibe o contador entre parênteses no título e não repete o título dentro do card', () => {
    vi.mocked(useIsMobile).mockReturnValue(false);

    render(
      <PilotisSetupModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', {name: 'Pilotis (8/8 selecionados)'})).toBeVisible();
    expect(screen.getAllByText('(8/8 selecionados)')).toHaveLength(1);
  });

  it('usa no mobile a grade compacta do editor de piloti', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);

    render(
      <PilotisSetupModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', {name: '1,0'})).toHaveClass('h-12', 'w-12', 'rounded-lg');
  });
});
