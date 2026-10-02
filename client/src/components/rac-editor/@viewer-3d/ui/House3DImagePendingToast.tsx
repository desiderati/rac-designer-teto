import {CircleAlert, CircleCheck, ImagePlus, LoaderCircle, X} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';
import {ToastMessage} from '@/components/ui/ToastMessage.tsx';
import {useHouse3DImageInsertion} from '@/contexts/House3DImageInsertionContext.tsx';

export function House3DImagePendingToast() {
  const {
    pendingImage,
    isGenerating,
    isInserting,
    feedback,
    insertPendingImage,
    discardPendingImage,
  } = useHouse3DImageInsertion();

  if (!isGenerating && !pendingImage && !feedback) return null;

  const isFallback = pendingImage?.source === 'fallback';
  const title = isGenerating
    ? 'Gerando imagem 3D…'
    : isFallback
      ? 'Imagem 3D pronta'
      : 'Imagem 3D pronta para inserir';
  const description = isGenerating
    ? 'Você pode continuar editando; a imagem será mantida aqui até você inseri-la ou descartá-la.'
    : feedback ?? (isFallback
      ? 'A ilustração não ficou disponível, mas o screenshot foi preservado.'
      : 'A imagem foi preservada. Insira no Canvas ou descarte quando quiser.');

  return (
    <aside
      aria-live='polite'
      aria-label='Imagem 3D pendente'
      className='rac-toast-surface rac-toast-pending pointer-events-auto'
      data-tone={feedback ? 'error' : 'info'}
      role='status'
    >
      <div className='rac-toast-pending-inner'>
        <span className='rac-toast-pending-mark' aria-hidden='true'>
          {isGenerating ? <LoaderCircle className='h-4 w-4 animate-spin'/> : feedback ? <CircleAlert className='h-4 w-4'/> : <CircleCheck className='h-4 w-4'/>}
        </span>
        <div className='min-w-0'>
          <ToastMessage title={title} detail={description}>
          {!isGenerating && pendingImage ? (
            <div className='rac-toast-decisions'>
              <Button
                type='button'
                className='rac-toast-decision rac-toast-decision-primary w-full'
                disabled={isInserting}
                onClick={() => void insertPendingImage()}
              >
                <ImagePlus className='h-3.5 w-3.5' aria-hidden='true'/>
                Inserir
              </Button>
              <Button
                type='button'
                variant='outline'
                className='rac-toast-decision w-full'
                disabled={isInserting}
                onClick={discardPendingImage}
              >
                <X className='h-3.5 w-3.5' aria-hidden='true'/>
                Descartar
              </Button>
            </div>
          ) : null}
          </ToastMessage>
        </div>
      </div>
    </aside>
  );
}
