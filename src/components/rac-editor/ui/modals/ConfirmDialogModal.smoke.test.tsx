import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';

describe('ConfirmDialogModal.tsx', () => {
  it('renders an accessible fallback title when visual title is omitted', () => {
    render(
      <ConfirmDialogModal
        isMobile={false}
        isOpen={true}
        confirmLabel='Confirmar'
        handleConfirm={vi.fn()}
        handleCancel={vi.fn()}
        content={<div>Conteúdo</div>}
      />,
    );

    expect(screen.getByText('Janela de confirmação')).toBeTruthy();
  });
});

