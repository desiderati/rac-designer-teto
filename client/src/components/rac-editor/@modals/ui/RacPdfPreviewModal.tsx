import {Download, FileText, X} from 'lucide-react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';

interface RacPdfPreviewModalProps {
  isMobile: boolean;
  isOpen: boolean;
  fileName: string | null;
  pdfUrl: string | null;
  isDownloading?: boolean;
  onDownload: () => void;
  onClose: () => void;
}

export function RacPdfPreviewModal({
  isMobile,
  isOpen,
  fileName,
  pdfUrl,
  isDownloading = false,
  onDownload,
  onClose,
}: RacPdfPreviewModalProps) {
  const body = (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600'>
        <FileText className='h-4 w-4 flex-none text-blue-600'/>
        <span className='min-w-0 flex-1 truncate' title={fileName ?? undefined}>{fileName ?? 'RAC.pdf'}</span>
      </div>
      <div className='overflow-hidden rounded-xl border border-slate-200 bg-slate-100'>
        {pdfUrl ? (
          <iframe
            title='Prévia do PDF da RAC'
            src={pdfUrl}
            className='h-[62vh] min-h-[360px] w-full bg-white sm:h-[68vh]'
          />
        ) : (
          <div className='grid h-[62vh] min-h-[360px] place-items-center text-sm text-slate-500'>
            A prévia do PDF ainda não está disponível.
          </div>
        )}
      </div>
      <div className='flex gap-3'>
        <Button
          type='button'
          variant='outline'
          className='h-10 flex-1 bg-white'
          onClick={onClose}
          disabled={isDownloading}
        >
          <X className='mr-2 h-4 w-4'/>
          Fechar
        </Button>
        <Button
          type='button'
          className='h-10 flex-1'
          onClick={onDownload}
          disabled={!pdfUrl || isDownloading}
        >
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
            <DialogDescription>
              Revise o documento antes de baixar o arquivo.
            </DialogDescription>
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
