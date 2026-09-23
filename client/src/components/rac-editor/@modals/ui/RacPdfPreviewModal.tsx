import {ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, RefreshCw, X} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {PdfDocumentPagePreview} from './PdfDocumentPagePreview.tsx';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(() => (isMobile ? 70 : 100));
  const [fitToContainer, setFitToContainer] = useState(true);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setZoom(isMobile ? 70 : 100);
    setFitToContainer(true);
  }, [isMobile, pdfUrl, pageCount]);

  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(currentPage, safePageCount);

  const fitToPage = useCallback(() => {
    const host = previewContainerRef.current?.querySelector<HTMLElement>('[data-testid="pdf-preview-host"]');
    const surface = previewContainerRef.current?.querySelector<HTMLElement>('[data-testid="pdf-preview-surface"]');
    if (!surface) {
      setZoom(isMobile ? 70 : 100);
      return;
    }

    const hostRect = host?.getBoundingClientRect();
    const availableWidth = hostRect?.width ?? surface.getBoundingClientRect().width;
    const availableHeight = hostRect?.height ?? Math.min(window.innerHeight * 0.72, 595.28);
    const fitPercentage = Math.floor(Math.min(availableWidth / 841.89, availableHeight / 595.28) * 100);
    setFitToContainer(true);
    setZoom(Math.max(40, Math.min(120, fitPercentage)));
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    const host = previewContainerRef.current?.querySelector<HTMLElement>('[data-testid="pdf-preview-host"]');
    const observer = typeof ResizeObserver === 'undefined' || !host
      ? null
      : new ResizeObserver(() => fitToPage());
    observer?.observe(host);

    const frame = requestAnimationFrame(() => fitToPage());
    const settledFit = window.setTimeout(() => fitToPage(), 240);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settledFit);
      observer?.disconnect();
    };
  }, [fitToPage, isOpen, pageCount, pdfUrl]);

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
    <div className='absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-0.5 rounded-full border border-slate-300/90 bg-slate-100/95 px-1.5 py-1 shadow-lg backdrop-blur-sm'>
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
        onClick={() => { setFitToContainer(false); setZoom((value) => Math.max(40, value - 10)); }}
        disabled={zoom <= 40}
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
  ) : null;

  const body = (
    <div ref={previewContainerRef} className='min-w-0 space-y-3'>
      {errorMessage ? (
        <div role='alert' className='flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
          <span className='min-w-0 flex-1'>{errorMessage}</span>
          {onRetry ? (
            <Button type='button' size='sm' variant='outline' className='shrink-0 bg-white' onClick={onRetry} disabled={isPreparing}>
              <RefreshCw className='mr-1.5 h-3.5 w-3.5'/>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className='relative min-w-0' data-testid='pdf-preview-host'>
        {pdfUrl ? (
          <PdfDocumentPagePreview
            pdfUrl={pdfUrl}
            pageNumber={safePage}
            pageCount={safePageCount}
            zoom={zoom}
            fitToContainer={fitToContainer}
          />
        ) : (
          <div className='grid h-[62vh] min-h-[360px] place-items-center px-6 text-center text-sm text-slate-500'>
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

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='min-w-0 w-[min(94vw,892px)] max-w-none' hideCloseButton>
          <DialogHeader className='relative pr-10'>
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
      <DrawerContent>
        <DrawerHeader className='relative pb-2 pr-12 text-left'>
          <DrawerTitle>Prévia da RAC em PDF</DrawerTitle>
          <DrawerDescription>Revise o documento antes de baixar o arquivo.</DrawerDescription>
          <div className='absolute right-4 top-3'>{closeButton}</div>
        </DrawerHeader>
        <div className='min-w-0 px-4 pb-4'>{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
