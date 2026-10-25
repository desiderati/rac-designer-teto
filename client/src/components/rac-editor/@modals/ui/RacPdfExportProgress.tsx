import {RAC_PDF_EXPORT_STEPS, type RacPdfExportStepId, type RacPdfExportStepStatus} from '../../lib/rac-pdf-export-progress.ts';
import {Check, Circle, LoaderCircle, X} from 'lucide-react';
import {ToastMessage} from '@/components/ui/ToastMessage.tsx';






export function RacPdfExportProgress({
  statuses,
  archive = false,
  houseLabel,
  resultMessage,
  onCancel,
}: {
  archive?: boolean;
  houseLabel?: string;
  resultMessage?: string;
  onCancel?: () => void;
  statuses: Record<RacPdfExportStepId, RacPdfExportStepStatus>;
}) {
  const failed = RAC_PDF_EXPORT_STEPS.some(({id}) => statuses[id] === 'error');
  const complete = RAC_PDF_EXPORT_STEPS.every(({id}) => statuses[id] === 'success');
  let detail = archive ? `Preparando ZIP${houseLabel ? ` · ${houseLabel}` : ''}.` : 'Preparando a prévia para revisão.';
  if (complete) detail = archive ? 'ZIP pronto para download.' : 'Prévia pronta para revisão.';
  if (failed) detail = archive ? 'Falha ao gerar os PDFs da construção.' : 'Falha ao preparar a prévia do PDF. Você pode tentar novamente pela prévia.';
  if (resultMessage) detail = resultMessage;
  return (
    <ToastMessage title={archive ? 'Geração dos PDFs da construção' : 'Geração do PDF'} detail={detail}>
      {onCancel ? <button type='button' data-close-button aria-label={archive ? 'Cancelar geração dos PDFs' : 'Cancelar geração do PDF'}
        onClick={onCancel}><X className='h-4 w-4' aria-hidden='true'/></button> : null}
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
            <span className='rac-toast-task-label'>{archive && id === 'create-preview' ? 'Compactar PDFs e preparar o download' : label}<span className='rac-toast-task-state'>{{pending: 'Pendente', active: 'Em andamento', success: 'Concluída', error: 'Falhou'}[status]}</span></span>
          </li>
        );
        })}
      </ol>
    </ToastMessage>
  );
}
