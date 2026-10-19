import {fireEvent, render, screen, within} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  RAC_PDF_EXPORT_STEPS,
  RacPdfExportProgress,
  createInitialRacPdfExportStatuses,
} from './RacPdfExportProgress.tsx';

describe('RacPdfExportProgress', () => {
  it('permite cancelar pelo X durante o carregamento', () => {
    const onCancel = vi.fn();
    render(<RacPdfExportProgress statuses={createInitialRacPdfExportStatuses()} onCancel={onCancel}/>);
    const cancel = screen.getByRole('button', {name: 'Cancelar geração do PDF'});
    expect(cancel).toBeEnabled();
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
  });
  it('mostra as seis etapas e mantém as concluídas após falha posterior', () => {
    const statuses = createInitialRacPdfExportStatuses();
    statuses['capture-canvas'] = 'success';
    statuses['capture-3d'] = 'success';
    statuses['prepare-photos'] = 'error';
    render(<RacPdfExportProgress statuses={statuses}/>);

    const steps = within(screen.getByRole('list', {name: 'Etapas da geração do PDF'})).getAllByRole('listitem');
    expect(steps).toHaveLength(RAC_PDF_EXPORT_STEPS.length);
    expect(steps[0]).toHaveAttribute('data-status', 'success');
    expect(steps[0]).toHaveTextContent('Concluída');
    expect(steps[1]).toHaveAttribute('data-status', 'success');
    expect(steps[2]).toHaveAttribute('data-status', 'error');
    expect(steps[2]).toHaveTextContent('Falhou');
    expect(screen.getByText(/tentar novamente pela prévia/)).toBeVisible();
    expect(screen.queryByRole('button', {name: /tentar novamente/i})).not.toBeInTheDocument();
  });
});
