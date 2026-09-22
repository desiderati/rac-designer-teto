import {Download, FileText, RefreshCw, X} from 'lucide-react';
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
  fileName,
  pdfUrl,
  pageCount = 1,
  errorMessage = null,
  isPreparing = false,
  isDownloading = false,
  onRetry,
  onDownload,
  onClose,
}: RacPdfPreviewModalProps) {
  const body = (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600'>
        <FileText className='h-4 w-4 flex-none text-blue-600'/>
        <span className='min-w-0 flex-1 truncate' title={fileName ?? undefined}>{fileName ?? 'RAC.pdf'}</span>
        {onRetry && !errorMessage ? (
          <Button type='button' variant='ghost' size='sm' className='h-8 shrink-0 px-2 text-slate-600' onClick={onRetry} disabled={isPreparing}>
            <RefreshCw className='mr-1.5 h-3.5 w-3.5'/>
            Gerar novamente
          </Button>
        ) : null}
      </div>

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

      <div className='relative overflow-hidden rounded-xl border border-slate-200 bg-slate-800'>
        {pdfUrl ? (
          <PdfDocumentPagePreview pdfUrl={pdfUrl} pageCount={pageCount} zoom={70}/>
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
      </div>

      <div className='flex gap-3'>
        <Button type='button' variant='outline' className='h-10 flex-1 bg-white' onClick={onClose} disabled={isDownloading || isPreparing}>
          <X className='mr-2 h-4 w-4'/>
          Fechar
        </Button>
        <Button type='button' className='h-10 flex-1' onClick={onDownload} disabled={!pdfUrl || isPreparing || isDownloading}>
          <Download className='mr-2 h-4 w-4'/>
          {isDownloading ? 'Baixando...' : 'Baixar PDF'}
        </Button>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='w-[min(94vw,900px)] max-w-none' hideCloseButton>
          <DialogHeader>
            <DialogTitle className='text-xl'>Prévia da RAC em PDF</DialogTitle>
            <DialogDescription>Revise o documento antes de baixar o arquivo.</DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className='pb-2 text-left'>
          <DrawerTitle>Prévia da RAC em PDF</DrawerTitle>
          <DrawerDescription>Revise o documento antes de baixar o arquivo.</DrawerDescription>
        </DrawerHeader>
        <div className='px-4 pb-4'>{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
