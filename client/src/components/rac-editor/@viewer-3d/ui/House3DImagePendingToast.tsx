import {AlertCircle, CheckCircle2, ImagePlus, Loader2, X} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';
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
      className='pointer-events-auto fixed bottom-4 right-4 z-[120] w-[min(27rem,calc(100vw-2rem))] rounded-xl border border-slate-200/90 bg-white/95 p-4 text-slate-800 shadow-xl shadow-slate-900/10 backdrop-blur sm:bottom-6 sm:right-6'
      role='status'
    >
      <div className='flex items-start gap-3'>
        <span className='mt-0.5 shrink-0 text-sky-600' aria-hidden='true'>
          {isGenerating ? <Loader2 className='h-5 w-5 animate-spin'/> : feedback ? <AlertCircle className='h-5 w-5 text-slate-700'/> : <CheckCircle2 className='h-5 w-5'/>}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold'>{title}</p>
          <p className='mt-1 text-xs leading-5 text-slate-600'>{description}</p>
          {!isGenerating && pendingImage ? (
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                size='sm'
                className='h-8 gap-1.5 bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700'
                disabled={isInserting}
                onClick={() => void insertPendingImage()}
              >
                <ImagePlus className='h-3.5 w-3.5' aria-hidden='true'/>
                Inserir
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 gap-1.5 border-slate-300 px-3 text-xs font-semibold text-slate-700'
                disabled={isInserting}
                onClick={discardPendingImage}
              >
                <X className='h-3.5 w-3.5' aria-hidden='true'/>
                Descartar
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
