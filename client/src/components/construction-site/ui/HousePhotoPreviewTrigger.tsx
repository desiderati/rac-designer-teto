import {useEffect, useState, type ReactNode} from 'react';
import {ArrowUpRight, LoaderCircle, X} from 'lucide-react';
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {renderHouseDrawingCanvasImageDataUrl} from '@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts';

interface HousePhotoPreviewTriggerProps {
  house: PersistedHouseRecord;
  familyName: string;
  children: ReactNode;
  onOpenCanvas?: () => void | Promise<void>;
}

/**
 * Mantém o thumbnail compacto na listagem e oferece uma inspeção rápida do
 * Canvas persistido por hover, com uma visualização maior por clique.
 */
export function HousePhotoPreviewTrigger({
  house,
  familyName,
  children,
  onOpenCanvas,
}: HousePhotoPreviewTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canvasImageDataUrl, setCanvasImageDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const normalizedFamilyName = familyName.trim() || 'casa';
  const previewLabel = `Pré-visualizar Canvas da casa ${normalizedFamilyName}`;

  const loadCanvasPreview = async () => {
    if (isLoading || canvasImageDataUrl) return;

    setIsLoading(true);
    setLoadError(false);
    try {
      const result = await renderHouseDrawingCanvasImageDataUrl(house);
      setCanvasImageDataUrl(result.imageDataUrl);
    } catch (error) {
      console.warn('[HousePhotoPreviewTrigger] Não foi possível renderizar a prévia do Canvas:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCanvasImageDataUrl(null);
    setLoadError(false);
  }, [house.id, house.updatedAt]);

  const handleOpenCanvas = async () => {
    if (!onOpenCanvas) return;
    setDialogOpen(false);
    await onOpenCanvas();
  };

  const previewSurface = (
    <div className='relative overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200/80'>
      {canvasImageDataUrl ? (
        <img
          src={canvasImageDataUrl}
          alt={`Canvas da casa ${normalizedFamilyName}`}
          className='block h-full w-full object-contain'
        />
      ) : (
        <div className='flex h-40 items-center justify-center px-4 text-center text-xs text-slate-500'>
          {isLoading ? (
            <span className='inline-flex items-center gap-2'>
              <LoaderCircle className='h-4 w-4 animate-spin' aria-hidden='true'/>
              Carregando Canvas…
            </span>
          ) : loadError ? (
            'Não foi possível carregar o Canvas.'
          ) : (
            'Canvas ainda não disponível.'
          )}
        </div>
      )}
      <div className='pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-slate-950/35 px-2 py-1.5 text-center text-[11px] font-medium text-white'>
        Clique para ampliar
      </div>
    </div>
  );

  return (
    <>
      <HoverCard openDelay={320} closeDelay={120} onOpenChange={(open) => { if (open) void loadCanvasPreview(); }}>
        <HoverCardTrigger asChild>
          <button
            type='button'
            aria-label={previewLabel}
            className='group block shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2'
            onClick={(event) => {
              event.stopPropagation();
              setDialogOpen(true);
              void loadCanvasPreview();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {children}
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side='right'
          align='start'
          className='w-64 overflow-hidden rounded-2xl border-slate-200 bg-white p-2 shadow-xl'
          onClick={(event) => {
            event.stopPropagation();
            setDialogOpen(true);
          }}
        >
          {previewSurface}
        </HoverCardContent>
      </HoverCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          hideCloseButton
          aria-describedby='house-canvas-preview-description'
          className='!min-w-0 w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-2xl border-slate-200 bg-white p-2 sm:p-3'
          onClick={(event) => event.stopPropagation()}
        >
          <DialogTitle className='sr-only'>Canvas da casa {normalizedFamilyName}</DialogTitle>
          <DialogDescription id='house-canvas-preview-description' className='sr-only'>
            Prévia do desenho persistido da casa.
          </DialogDescription>
          <div className='relative overflow-hidden rounded-xl bg-slate-50'>
            <div className='flex max-h-[82vh] min-h-[18rem] items-center justify-center overflow-hidden'>
              {canvasImageDataUrl ? (
                <img
                  src={canvasImageDataUrl}
                  alt={`Canvas da casa ${normalizedFamilyName}`}
                  className='block max-h-[82vh] w-full object-contain'
                />
              ) : (
                <div className='flex h-[min(70vh,32rem)] w-full items-center justify-center px-4 text-center text-sm text-slate-500'>
                  {isLoading ? 'Carregando Canvas…' : loadError ? 'Não foi possível carregar o Canvas.' : 'Canvas ainda não disponível.'}
                </div>
              )}
            </div>
            <DialogClose
              aria-label='Fechar prévia do Canvas'
              className='absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
            >
              <X className='h-4 w-4' aria-hidden='true'/>
            </DialogClose>
            {onOpenCanvas ? (
              <button
                type='button'
                aria-label='Ir para o Canvas desta casa'
                title='Ir para o Canvas desta casa'
                className='absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white/90 text-blue-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
                onClick={(event) => {
                  event.stopPropagation();
                  void handleOpenCanvas();
                }}
              >
                <ArrowUpRight className='h-4 w-4' aria-hidden='true'/>
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
