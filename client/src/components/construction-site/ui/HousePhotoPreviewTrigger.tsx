import {useState, type ReactNode} from 'react';
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {ProtectedImage} from '@/components/ui/ProtectedImage.tsx';

interface HousePhotoPreviewTriggerProps {
  familyName: string;
  photoDataUrl: string;
  children: ReactNode;
}

/**
 * Mantém o thumbnail compacto na listagem e oferece uma inspeção rápida por
 * hover, com uma visualização maior por clique — inclusive em touch/mobile.
 */
export function HousePhotoPreviewTrigger({
  familyName,
  photoDataUrl,
  children,
}: HousePhotoPreviewTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const alt = `Foto da casa ${familyName}`;

  return (
    <>
      <HoverCard openDelay={320} closeDelay={120}>
        <HoverCardTrigger asChild>
          <button
            type='button'
            aria-label={`Pré-visualizar foto da casa ${familyName}`}
            className='group block shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2'
            onClick={(event) => {
              event.stopPropagation();
              setDialogOpen(true);
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
          onClick={(event) => event.stopPropagation()}
        >
          <ProtectedImage
            src={photoDataUrl}
            alt={alt}
            className='h-40 w-full rounded-xl object-cover'
          />
          <p className='truncate px-1 pb-1 pt-2 text-xs font-semibold text-slate-700'>{familyName}</p>
          <p className='px-1 pb-1 text-[11px] text-slate-400'>Clique para ampliar</p>
        </HoverCardContent>
      </HoverCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          aria-describedby='house-photo-preview-description'
          className='!min-w-0 w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border-slate-200 bg-white p-4 sm:p-5'
          onClick={(event) => event.stopPropagation()}
        >
          <DialogTitle className='pr-8 text-base font-semibold text-slate-900'>
            Pré-visualização da casa
          </DialogTitle>
          <DialogDescription id='house-photo-preview-description' className='-mt-2 text-sm text-slate-500'>
            {familyName}
          </DialogDescription>
          <div className='flex max-h-[72vh] min-h-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2'>
            <ProtectedImage
              src={photoDataUrl}
              alt={alt}
              className='max-h-[68vh] w-full rounded-lg object-contain'
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
