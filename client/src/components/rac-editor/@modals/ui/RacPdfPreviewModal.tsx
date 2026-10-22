import {ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, RefreshCw, X} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {PdfDocumentPagePreview} from './PdfDocumentPagePreview.tsx';
import {createResizeObserverScheduler} from '@/shared/lib/resize-observer-scheduler.ts';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';

interface RacPdfPreviewModalProps {
  isMobile: boolean;
  isOpen: boolean;
  fileName: string | null;
  pdfUrl: string | null;
  pageCount?: number;
  errorMessage?: string | null;
  isPreparing?: boolean;
  isDownloading?: boolean;
  onRetry?: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function RacPdfPreviewModal({
  isMobile,
  isOpen,
  fileName: _fileName,
  pdfUrl,
  pageCount = 1,
  errorMessage = null,
  isPreparing = false,
  isDownloading = false,
  onRetry,
  onDownload,
  onClose,
}: RacPdfPreviewModalProps) {
  const {landscape} = useCanvasMobileViewport();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(() => (isMobile ? 70 : 100));
  const [fitToContainer, setFitToContainer] = useState(true);
  const [isToolbarMinimized, setIsToolbarMinimized] = useState(false);
  const toolbarDragStartYRef = useRef<number | null>(null);
  const toolbarWasDraggedRef = useRef(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setZoom(isMobile ? 70 : 100);
    setFitToContainer(true);
  }, [isMobile, pdfUrl, pageCount]);

  useEffect(() => {
    if (!isOpen) setIsToolbarMinimized(false);
  }, [isOpen]);

  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(currentPage, safePageCount);

  const fitToPage = useCallback(() => {
    const surface = previewContainerRef.current?.querySelector<HTMLElement>('[data-testid="pdf-preview-surface"]');
    setFitToContainer(true);
    if (!surface) return;
    const {width: availableWidth, height: availableHeight} = surface.getBoundingClientRect();
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const fitPercentage = Math.floor(Math.min(availableWidth / 841.89, availableHeight / 595.28) * 100);
    setZoom(Math.max(1, Math.min(120, fitPercentage)));
  }, []);

  useEffect(() => {
    if (!isOpen || !pdfUrl || !fitToContainer) return;

    const host = previewContainerRef.current?.querySelector<HTMLElement>('[data-testid="pdf-preview-surface"]');
    const scheduler = createResizeObserverScheduler(fitToPage);
    const observer = typeof ResizeObserver === 'undefined' || !host
      ? null
      : new ResizeObserver(scheduler.schedule);
    observer?.observe(host);

    const frame = requestAnimationFrame(() => fitToPage());
    const settledFit = window.setTimeout(() => fitToPage(), 240);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settledFit);
      observer?.disconnect();
      scheduler.cancel();
    };
  }, [fitToContainer, fitToPage, isOpen, pageCount, pdfUrl, isMobile, landscape]);

  const closeButton = (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className='h-8 w-8 rounded-full'
      aria-label='Fechar prévia do PDF'
      onClick={onClose}
      disabled={isDownloading || isPreparing}
    >
      <X className='h-4 w-4'/>
    </Button>
  );

  const floatingControls = pdfUrl && !isPreparing ? (
    <div className='z-10 flex max-w-full shrink-0 flex-col items-center gap-1 pt-2'>
      <button
        type='button'
        aria-label={isToolbarMinimized ? 'Restaurar barra de ferramentas do PDF' : 'Minimizar barra de ferramentas do PDF'}
        title={isToolbarMinimized ? 'Restaurar barra de ferramentas do PDF' : 'Minimizar barra de ferramentas do PDF'}
        onPointerDown={(event) => {
          toolbarDragStartYRef.current = event.clientY;
          toolbarWasDraggedRef.current = false;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const startY = toolbarDragStartYRef.current;
          toolbarDragStartYRef.current = null;
          if (startY === null || Math.abs(event.clientY - startY) <= 24) return;
          toolbarWasDraggedRef.current = true;
          setIsToolbarMinimized(event.clientY > startY);
        }}
        onClick={() => {
          if (toolbarWasDraggedRef.current) {
            toolbarWasDraggedRef.current = false;
            return;
          }
          setIsToolbarMinimized((value) => !value);
        }}
        className='grid h-5 w-24 touch-none place-items-center'
      >
        <span className='block h-1.5 w-16 rounded-full border border-white/70 bg-slate-400/70 shadow-sm' aria-hidden='true'/>
      </button>
      {!isToolbarMinimized ? (
      <div className='flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-slate-300/90 bg-slate-100/95 px-1.5 py-1 shadow-lg backdrop-blur-sm sm:rounded-full [&>button]:shrink-0'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full'
        aria-label='Ajustar à página'
        onClick={fitToPage}
      >
        <Maximize2 className='h-4 w-4'/>
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full'
        aria-label='Diminuir zoom da prévia'
        onClick={() => { setFitToContainer(false); setZoom((value) => Math.max(10, value - 10)); }}
        disabled={zoom <= 10}
      >
        <Minus className='h-4 w-4'/>
      </Button>
      <span className='min-w-11 px-0.5 text-center text-xs font-semibold text-slate-800'>{zoom}%</span>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full'
        aria-label='Aumentar zoom da prévia'
        onClick={() => { setFitToContainer(false); setZoom((value) => Math.min(120, value + 10)); }}
        disabled={zoom >= 120}
      >
        <Plus className='h-4 w-4'/>
      </Button>
      <span className='mx-1 h-5 w-px bg-slate-300'/>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full'
        aria-label='Página anterior da prévia'
        onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
        disabled={safePage <= 1}
      >
        <ChevronLeft className='h-4 w-4'/>
      </Button>
      <span className='whitespace-nowrap px-1 text-xs font-semibold text-slate-800'>Página {safePage} de {safePageCount}</span>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full'
        aria-label='Próxima página da prévia'
        onClick={() => setCurrentPage((value) => Math.min(safePageCount, value + 1))}
        disabled={safePage >= safePageCount}
      >
        <ChevronRight className='h-4 w-4'/>
      </Button>
      {onRetry ? (
        <>
          <span className='mx-1 h-5 w-px bg-slate-300'/>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-full'
            aria-label='Gerar PDF novamente'
            onClick={onRetry}
            disabled={isPreparing}
          >
            <RefreshCw className='h-4 w-4'/>
          </Button>
        </>
      ) : null}
      <Button
        type='button'
        size='icon'
        className='ml-0.5 h-9 w-9 rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700'
        aria-label='Baixar PDF'
        onClick={onDownload}
        disabled={isDownloading}
      >
        <Download className='h-4 w-4'/>
      </Button>
      </div>
      ) : null}
    </div>
  ) : null;

  const body = (
    <div ref={previewContainerRef} className='flex min-h-0 min-w-0 flex-1 flex-col gap-3'>
      {errorMessage ? (
        <div role='alert' className='flex shrink-0 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
          <span className='min-w-0 flex-1'>{errorMessage}</span>
          {onRetry ? (
            <Button type='button' size='sm' variant='outline' className='shrink-0 bg-white' onClick={onRetry} disabled={isPreparing}>
              <RefreshCw className='mr-1.5 h-3.5 w-3.5'/>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className='relative flex min-h-0 min-w-0 flex-1 flex-col' data-testid='pdf-preview-host'>
        {pdfUrl ? (
          <PdfDocumentPagePreview
            pdfUrl={pdfUrl}
            pageNumber={safePage}
            pageCount={safePageCount}
            zoom={zoom}
            fitToContainer={fitToContainer}
          />
        ) : (
          <div className='grid h-full min-h-0 place-items-center px-6 text-center text-sm text-slate-500'>
            {isPreparing ? 'Gerando uma nova prévia do PDF…' : 'A prévia do PDF ainda não está disponível.'}
          </div>
        )}
        {isPreparing ? (
          <div className='absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[1px]'>
            <div className='rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm'>Gerando prévia…</div>
          </div>
        ) : null}
        {floatingControls}
      </div>
    </div>
  );

  if (!isMobile || landscape) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`flex h-[min(90dvh,760px)] max-h-[calc(100dvh-16px)] min-h-0 min-w-0 ${landscape ? 'w-[50vw]' : 'w-[min(calc(100vw-16px),892px)]'} max-w-none flex-col overflow-hidden rounded-lg gap-3 p-4`} hideCloseButton>
          <DialogHeader className='relative shrink-0 pr-10 text-left'>
            <DialogTitle className='text-xl'>Prévia da RAC em PDF</DialogTitle>
            <DialogDescription>Revise o documento antes de baixar o arquivo.</DialogDescription>
            <div className='absolute right-0 top-0'>{closeButton}</div>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='mt-0 h-[min(90dvh,760px)] max-h-[calc(100dvh-8px)] min-h-0 min-w-0 overflow-hidden [&>div:first-child]:shrink-0'>
        <DrawerHeader className='relative shrink-0 pb-2 pr-12 text-left'>
          <DrawerTitle>Prévia da RAC em PDF</DrawerTitle>
          <DrawerDescription>Revise o documento antes de baixar o arquivo.</DrawerDescription>
          <div className='absolute right-4 top-3'>{closeButton}</div>
        </DrawerHeader>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4'>{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
