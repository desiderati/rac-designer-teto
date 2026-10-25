import {createElement} from 'react';
import {toast} from '@/components/ui/sonner.tsx';
import {RAC_PDF_EXPORT_STEPS, createInitialRacPdfExportStatuses, type RacPdfExportStepId} from '@/components/rac-editor/lib/rac-pdf-export-progress.ts';
import {RacPdfExportProgress} from '../@modals/ui/RacPdfExportProgress.tsx';
import {throwIfPdfExportAborted, waitForPdfExport} from './rac-pdf-export-cancellation.ts';

let sequence = 0;

/** Uma operação, um progresso e um cancelamento, em todas as entradas do PDF. */
export function createRacPdfExportTask(archive = false) {
  const controller = new AbortController();
  const id = `rac-pdf-export-${Date.now()}-${++sequence}`;
  let active = true;
  let phase: RacPdfExportStepId = 'capture-canvas';
  let statuses = createInitialRacPdfExportStatuses();
  const cancel = (notify = true) => {
    if (!active) return;
    active = false;
    controller.abort();
    toast.dismiss(id);
    if (notify) toast.info(archive ? 'Geração dos PDFs cancelada.' : 'Geração do PDF cancelada.');
  };
  const update = (step: RacPdfExportStepId, _houseId = '', index = 0, total = 0) => {
    throwIfPdfExportAborted(controller.signal);
    phase = step;
    const current = RAC_PDF_EXPORT_STEPS.findIndex(entry => entry.id === step);
    statuses = Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}, position) => [id,
      position < current ? 'success' : position === current ? 'active' : 'pending'])) as typeof statuses;
    if (active) {
      const content = createElement(RacPdfExportProgress, {statuses, archive,
        houseLabel: total ? `Casa ${index} de ${total}` : undefined, onCancel: () => cancel()});
      toast.loading(() => content, {id, closeButton: false, dismissible: false});
    }
  };
  const finish = (kind: 'success' | 'warning' | 'error', resultMessage?: string) => {
    if (!active || controller.signal.aborted) return;
    active = false;
    statuses = kind === 'error' ? {...statuses, [phase]: 'error'}
      : Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}) => [id, 'success'])) as typeof statuses;
    const content = createElement(RacPdfExportProgress, {statuses, archive, resultMessage});
    toast[kind](() => content, {id, closeButton: true, dismissible: true});
  };
  update('capture-canvas');
  return {signal: controller.signal, update, finish, cancel,
    wait: <T,>(promise: Promise<T>) => waitForPdfExport(promise, controller.signal),
    check: () => throwIfPdfExportAborted(controller.signal),
    dismiss: () => {active = false; toast.dismiss(id);},
  };
}

export type RacPdfExportTask = ReturnType<typeof createRacPdfExportTask>;
