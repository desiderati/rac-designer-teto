import {ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, RefreshCw, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
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

const PDF_WIDTH = 841.89;
const PDF_HEIGHT = 595.28;

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
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const hasAutoFittedRef = useRef(false);

  useEffect(() => {
    setCurrentPage(1);
    setZoom(isMobile ? 70 : 100);
    hasAutoFittedRef.current = false;
  }, [isMobile, pdfUrl, pageCount, isOpen]);

  useEffect(() => {
    if (!isOpen || !pdfUrl || isMobile || hasAutoFittedRef.current) return;

    let frameOne = 0;
    let frameTwo = 0;
    frameOne = requestAnimationFrame(() => {
      frameTwo = requestAnimationFrame(() => {
        const stage = previewStageRef.current;
        if (!stage) return;

        const fitPercentage = Math.floor(
          Math.min(stage.clientWidth / PDF_WIDTH, stage.clientHeight / PDF_HEIGHT) * 10,
        ) * 10;
        if (fitPercentage > 0 && fitPercentage < 100) {
          setZoom(Math.max(40, fitPercentage));
        }
        hasAutoFittedRef.current = true;
      });
    });

    return () => {
      cancelAnimationFrame(frameOne);
      cancelAnimationFrame(frameTwo);
    };
  }, [isOpen, isMobile, pdfUrl, pageCount]);

  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(currentPage, safePageCount);

  const fitToPage = () => {
    const stage = previewStageRef.current;
    if (!stage) {
      setZoom(isMobile ? 70 : 100);
      return;
    }

    const fitPercentage = Math.floor(
      Math.min(stage.clientWidth / PDF_WIDTH, stage.clientHeight / PDF_HEIGHT) * 10,
    ) * 10;
    setZoom(Math.max(40, Math.min(100, fitPercentage)));
  };

  const closeButton = (
    <Button
      type='button'
      variant='outline'
      size='icon'
      className='h-9 w-9 rounded-full bg-background shadow-sm'
      aria-label='Fechar prévia do PDF'
      onClick={onClose}
      disabled={isDownloading || isPreparing}
    >
      <X className='h-4 w-4'/>
    </Button>
  );

  const previewControls = pdfUrl && !isPreparing ? (
    <div data-testid='pdf-preview-controls' className='sticky bottom-0 z-20 flex max-w-full flex-none justify-center overflow-x-auto bg-background/80 px-1 pb-0.5 pt-1'>
      <div className='flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200 bg-background/95 px-1.5 py-1 shadow-md backdrop-blur-sm'>
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
          onClick={() => setZoom((value) => Math.max(40, value - 10))}
          disabled={zoom <= 40}
        >
          <Minus className='h-4 w-4'/>
        </Button>
        <span className='min-w-11 px-0.5 text-center text-xs font-semibold text-slate-700'>{zoom}%</span>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-8 w-8 rounded-full'
          aria-label='Aumentar zoom da prévia'
          onClick={() => setZoom((value) => Math.min(120, value + 10))}
          disabled={zoom >= 120}
        >
          <Plus className='h-4 w-4'/>
        </Button>
        <span className='mx-1 h-5 w-px bg-slate-200'/>
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
        <span className='whitespace-nowrap px-1 text-xs font-semibold text-slate-700'>Página {safePage} de {safePageCount}</span>
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
            <span className='mx-1 h-5 w-px bg-slate-200'/>
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
    </div>
  ) : null;

  const body = (
    <div ref={previewContainerRef} className='flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden'>
      {errorMessage ? (
        <div role='alert' className='flex flex-none items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
          <span className='min-w-0 flex-1'>{errorMessage}</span>
          {onRetry ? (
            <Button type='button' size='sm' variant='outline' className='shrink-0 bg-white' onClick={onRetry} disabled={isPreparing}>
              <RefreshCw className='mr-1.5 h-3.5 w-3.5'/>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}

      <div ref={previewStageRef} className='relative flex min-h-0 flex-1 items-center justify-center overflow-hidden'>
        {pdfUrl ? (
          <PdfDocumentPagePreview pdfUrl={pdfUrl} pageNumber={safePage} pageCount={safePageCount} zoom={zoom}/>
        ) : (
          <div className='grid h-full min-h-[240px] w-full place-items-center px-6 text-center text-sm text-slate-500'>
            {isPreparing ? 'Gerando uma nova prévia do PDF…' : 'A prévia do PDF ainda não está disponível.'}
          </div>
        )}
        {isPreparing ? (
          <div className='absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[1px]'>
            <div className='rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm'>Gerando prévia…</div>
          </div>
        ) : null}
      </div>
      {previewControls}
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] min-w-0 w-[min(96vw,960px)] max-w-none flex-col gap-3 overflow-hidden p-4' hideCloseButton>
          <DialogHeader className='relative flex-none pr-12'>
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
        <DrawerHeader className='relative flex-none pb-2 pr-12 text-left'>
          <DrawerTitle>Prévia da RAC em PDF</DrawerTitle>
          <DrawerDescription>Revise o documento antes de baixar o arquivo.</DrawerDescription>
          <div className='absolute right-4 top-3'>{closeButton}</div>
        </DrawerHeader>
        <div className='flex min-h-0 min-w-0 max-h-[calc(100vh-7rem)] flex-1 flex-col px-4 pb-4'>{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
