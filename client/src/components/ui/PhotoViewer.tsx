import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/ui/dialog.tsx';
import {ProtectedImage} from '@/components/ui/ProtectedImage.tsx';

export interface ViewerPhoto {id: string; url: string; description?: string}

/** Visualização somente das fotos disponíveis; slots de envio ficam no formulário. */
export function PhotoViewer({photos, photoId, onPhotoChange, onClose}: {
  photos: ViewerPhoto[];
  photoId: string | null;
  onPhotoChange(id: string): void;
  onClose(): void;
}) {
  const availablePhotos = photos.filter((photo) => Boolean(photo.url?.trim()));
  const index = availablePhotos.findIndex((photo) => photo.id === photoId);
  const photo = availablePhotos[index];
  const navigate = (direction: number) => {
    const next = availablePhotos[(index + direction + availablePhotos.length) % availablePhotos.length];
    if (next) onPhotoChange(next.id);
  };

  return (
    <Dialog open={Boolean(photo)} onOpenChange={(open) => {if (!open) onClose();}}>
      <DialogContent hideCloseButton aria-describedby='terrain-photo-viewer-description'
        className='inset-0 left-0 top-0 flex h-[100dvh] min-w-0 max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 bg-slate-950 p-4 text-white sm:rounded-none'
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}>
        <div className='flex items-center justify-between gap-4'>
          <DialogTitle className='text-base'>Fotos do Terreno</DialogTitle>
          <button type='button' aria-label='Fechar visualizador de fotos' onClick={onClose}
            className='grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'>
            <X className='h-5 w-5' aria-hidden='true'/>
          </button>
        </div>
        <DialogDescription id='terrain-photo-viewer-description' className='sr-only'>Navegue pelas fotos do terreno com os botões ou as setas do teclado.</DialogDescription>
        {photo ? <ProtectedImage src={photo.url} alt={photo.description || `Foto do terreno ${index + 1}`} className='min-h-0 w-full flex-1 object-contain'/> : null}
        <div className='flex items-center justify-center gap-5'>
          <button type='button' aria-label='Foto anterior' disabled={availablePhotos.length < 2} onClick={() => navigate(-1)} className='grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30'><ChevronLeft aria-hidden='true'/></button>
          <p aria-live='polite' className='text-center text-sm text-slate-100'>{index + 1} / {availablePhotos.length}{photo?.description ? <span className='mt-1 block'>{photo.description}</span> : null}</p>
          <button type='button' aria-label='Próxima foto' disabled={availablePhotos.length < 2} onClick={() => navigate(1)} className='grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30'><ChevronRight aria-hidden='true'/></button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
