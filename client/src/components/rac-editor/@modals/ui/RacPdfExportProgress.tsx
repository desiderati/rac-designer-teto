import {Check, Circle, LoaderCircle, X} from 'lucide-react';
import {ToastMessage} from '@/components/ui/ToastMessage.tsx';

export const RAC_PDF_EXPORT_STEPS = [
  {id: 'capture-canvas', label: 'Capturar o desenho 2D do Canvas'},
  {id: 'capture-3d', label: 'Capturar a vista 3D da casa'},
  {id: 'prepare-photos', label: 'Preparar fotos da família e do terreno'},
  {id: 'build-report-model', label: 'Organizar dados da casa e da construção'},
  {id: 'render-pdf', label: 'Compor as páginas do PDF'},
  {id: 'create-preview', label: 'Preparar a prévia para revisão'},
] as const;

export type RacPdfExportStepId = typeof RAC_PDF_EXPORT_STEPS[number]['id'];
export type RacPdfExportStepStatus = 'pending' | 'active' | 'success' | 'error';

export function RacPdfExportProgress({
  statuses,
}: {
  statuses: Record<RacPdfExportStepId, RacPdfExportStepStatus>;
}) {
  const failed = RAC_PDF_EXPORT_STEPS.some(({id}) => statuses[id] === 'error');
  const complete = RAC_PDF_EXPORT_STEPS.every(({id}) => statuses[id] === 'success');
  return (
    <ToastMessage title='Geração do PDF' detail={failed
        ? 'Falha ao preparar a prévia do PDF. Você pode tentar novamente pela prévia.'
        : complete ? 'Prévia pronta para revisão.' : 'Preparando a prévia para revisão.'}>
      <ol className='rac-toast-task-list' aria-label='Etapas da geração do PDF'>
        {RAC_PDF_EXPORT_STEPS.map(({id, label}) => {
        const status = statuses[id];
        return (
          <li key={id} className='rac-toast-task-step' data-step={id} data-status={status}>
            <span className='rac-toast-task-marker' aria-hidden='true'>
              {status === 'active' ? <LoaderCircle className='h-4 w-4 animate-spin'/> : null}
              {status === 'success' ? <Check className='h-4 w-4'/> : null}
              {status === 'error' ? <X className='h-4 w-4'/> : null}
              {status === 'pending' ? <Circle className='h-4 w-4'/> : null}
            </span>
            <span className='rac-toast-task-label'>{label}<span className='rac-toast-task-state'>{{pending: 'Pendente', active: 'Em andamento', success: 'Concluída', error: 'Falhou'}[status]}</span></span>
          </li>
        );
        })}
      </ol>
    </ToastMessage>
  );
}

export function createInitialRacPdfExportStatuses(): Record<RacPdfExportStepId, RacPdfExportStepStatus> {
  return Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}, index) => [id, index === 0 ? 'active' : 'pending'])) as Record<RacPdfExportStepId, RacPdfExportStepStatus>;
}
