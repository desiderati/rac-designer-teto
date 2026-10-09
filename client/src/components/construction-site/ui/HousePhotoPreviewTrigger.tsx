import {useEffect, useState, type ReactNode} from 'react';
import {ArrowUpRight, LoaderCircle, RotateCw, X} from 'lucide-react';
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {
  clearHouseDrawingCanvasImageCache,
  renderHouseDrawingCanvasImageDataUrl,
} from '@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts';

interface HousePhotoPreviewTriggerProps {
  house: PersistedHouseRecord;
  familyName: string;
  children: ReactNode;
  onOpenCanvas?: () => void | Promise<void>;
  guidedTourId?: string;
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
  guidedTourId,
}: HousePhotoPreviewTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canvasImageDataUrl, setCanvasImageDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const normalizedFamilyName = familyName.trim() || 'casa';
  const previewLabel = `Pré-visualizar Canvas da casa ${normalizedFamilyName}`;
  const hasPersistedDrawing = house.drawingDocument.canvas.objects.length > 0;

  const loadCanvasPreview = async (force = false) => {
    if (isLoading || (canvasImageDataUrl && !force)) return;

    if (!hasPersistedDrawing) {
      setLoadError(false);
      return;
    }

    if (force) clearHouseDrawingCanvasImageCache();

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
  }, [house.id, house.updatedAt, house.version]);

  const handleOpenCanvas = async () => {
    if (!onOpenCanvas) return;
    setDialogOpen(false);
    await onOpenCanvas();
  };

  const retryCanvasPreview = () => {
    setCanvasImageDataUrl(null);
    void loadCanvasPreview(true);
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
            <span className='inline-flex flex-col items-center gap-2'>
              <span>Não foi possível carregar o Canvas.</span>
              <button type='button' className='inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-slate-200' onClick={(event) => { event.stopPropagation(); retryCanvasPreview(); }}>
                <RotateCw className='h-3.5 w-3.5' aria-hidden='true'/> Recarregar
              </button>
            </span>
          ) : (
            <span className='inline-flex flex-col items-center gap-1'>
              <strong className='font-semibold text-slate-700'>Desenho indisponível</strong>
              <span>Esta casa ainda não possui um desenho salvo.</span>
            </span>
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
            data-guided-tour-id={guidedTourId}
            className='group block shrink-0 touch-manipulation rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2'
            onClick={(event) => {
              event.stopPropagation();
              setDialogOpen(true);
              void loadCanvasPreview();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
            onTouchStart={(event) => event.stopPropagation()}
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
                  {isLoading ? 'Carregando Canvas…' : loadError ? (
                    <span className='flex flex-col items-center gap-3'>
                      <span>Não foi possível carregar o Canvas.</span>
                      <button type='button' onClick={retryCanvasPreview} className='inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'>
                        <RotateCw className='h-4 w-4' aria-hidden='true'/> Recarregar prévia
                      </button>
                    </span>
                  ) : (
                    <span className='flex flex-col items-center gap-1 text-center'>
                      <strong className='font-semibold text-slate-700'>Desenho indisponível</strong>
                      <span>Esta casa ainda não possui um desenho salvo.</span>
                      <button type='button' onClick={retryCanvasPreview} className='mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'>
                        <RotateCw className='h-4 w-4' aria-hidden='true'/> Recarregar
                      </button>
                    </span>
                  )}
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
