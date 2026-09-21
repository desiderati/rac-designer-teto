import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RacPdfPreviewModal} from '@/components/rac-editor/@modals/ui/RacPdfPreviewModal.tsx';

describe('RacPdfPreviewModal', () => {
  it('exibe a prévia PDF no Dialog desktop e delega o download', () => {
    const onDownload = vi.fn();
    const onClose = vi.fn();

    render(
      <RacPdfPreviewModal
        isMobile={false}
        isOpen
        fileName='RAC-CC2603-FAMILIA-SILVA.pdf'
        pdfUrl='blob:rac-preview'
        onDownload={onDownload}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    expect(screen.getByTitle('Prévia do PDF da RAC')).toHaveAttribute('src', 'blob:rac-preview');
    expect(screen.getByText('RAC-CC2603-FAMILIA-SILVA.pdf')).toBeVisible();

    fireEvent.click(screen.getByRole('button', {name: 'Baixar PDF'}));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('usa Drawer no mobile e permite fechar sem baixar', () => {
    const onDownload = vi.fn();
    const onClose = vi.fn();

    render(
      <RacPdfPreviewModal
        isMobile
        isOpen
        fileName='RAC.pdf'
        pdfUrl='blob:rac-preview'
        onDownload={onDownload}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();
  });
});
