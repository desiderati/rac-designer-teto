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
    expect(screen.getByTestId('pdf-preview-surface')).toHaveAttribute('data-zoom', '70');
    fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();
  });

  it('renderiza uma página por vez com comandos flutuantes e zoom inicial de 100% no desktop', () => {
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
    expect(screen.queryByTestId('pdf-preview-canvas-2')).not.toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-preview-surface')).toHaveAttribute('data-zoom', '100');
    expect(screen.getByRole('button', {name: 'Aumentar zoom da prévia'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Próxima página da prévia'})).toBeInTheDocument();
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
