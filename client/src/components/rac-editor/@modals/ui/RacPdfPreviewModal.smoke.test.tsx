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
    expect(screen.getByTestId('pdf-preview-surface')).toBeVisible();
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

  it('renderiza todas as páginas em sequência sem barra de controles', () => {
    render(
      <RacPdfPreviewModal
        isMobile={false}
        isOpen
        fileName='RAC.pdf'
        pdfUrl='blob:rac-preview'
        pageCount={3}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('pdf-preview-surface')).toBeVisible();
    expect(screen.getByTestId('pdf-preview-canvas-1')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-preview-canvas-2')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-preview-canvas-3')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Aumentar zoom'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Próxima página'})).not.toBeInTheDocument();
    expect(screen.getByTestId('pdf-preview-surface')).toBeVisible();
  });

  it('exibe erro recuperável e delega a nova tentativa', () => {
    const onRetry = vi.fn();

    render(
      <RacPdfPreviewModal
        isMobile
        isOpen
        fileName='RAC.pdf'
        pdfUrl={null}
        errorMessage='Falha ao preparar a prévia do PDF. Você pode tentar novamente.'
        onRetry={onRetry}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao preparar a prévia');
    fireEvent.click(screen.getByRole('button', {name: 'Tentar novamente'}));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
