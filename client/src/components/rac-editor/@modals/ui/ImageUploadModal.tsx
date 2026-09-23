import {ChangeEvent, DragEvent, useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUpload} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {toast} from '@/components/ui/sonner.tsx';
import {ImageUploadReview, type ImageUploadReviewSelection} from '@/components/ui/ImageUploadReview.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {useStorageImageUpload} from '@/contexts/StorageImageUploadContext.tsx';
import {
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_SOURCE_UPLOAD_LIMIT_LABEL,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import {toStorageImageUploadPayload} from '@/shared/lib/storage-image-upload.ts';

const ACCEPTED_IMAGE_TYPES_LABEL = 'PNG, JPG ou WEBP';

interface ImageUploadModalProps {
  isMobile: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (dataUrl: string, options?: {storageUrl?: string | null}) => Promise<boolean> | boolean;
}

export function ImageUploadModal({
  isMobile,
  isOpen,
  onOpenChange,
  onInsertImage,
}: ImageUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const reviewConfirmStartedRef = useRef(false);
  const storageImageUpload = useStorageImageUpload();

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setErrorMessage('');
      setReviewFile(null);
      reviewConfirmStartedRef.current = false;
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [isOpen]);

  const processFile = async (file: File | null | undefined) => {
    if (!file) return;

    const validationMessage = await validatePhotoFile(file, {allowCompression: true});
    if (validationMessage) {
      setErrorMessage(validationMessage);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setErrorMessage('');
    reviewConfirmStartedRef.current = false;
    setReviewFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmImage = async ({file, preparedFile, preserveOriginalQuality}: ImageUploadReviewSelection) => {
    reviewConfirmStartedRef.current = true;
    const uploadToastId = `canvas-upload-${Date.now()}`;
    toast.loading('Enviando imagem em segundo plano…', {id: uploadToastId});
    try {
      const [imageUrl, localPayload] = await Promise.all([
        storageImageUpload.uploadImage(file, undefined, {preserveOriginalQuality, preparedFile}),
        toStorageImageUploadPayload(file),
      ]);
      const localDataUrl = `data:${localPayload.mimeType};base64,${localPayload.base64}`;
      const inserted = await onInsertImage(localDataUrl, {storageUrl: imageUrl});
      if (!inserted) {
        throw new Error('Não foi possível inserir a imagem no Canvas. Abra o Canvas e tente novamente.');
      }
      toast.success('Imagem enviada e inserida no Canvas.', {id: uploadToastId});
    } catch (error) {
      console.error('[ImageUploadModal] Falha ao enviar ou inserir imagem:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível enviar a imagem ao Storage. Tente outra imagem.';
      toast.error(message, {id: uploadToastId});
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void processFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!reviewFile) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const requestClose = () => {
    reviewConfirmStartedRef.current = false;
    setReviewFile(null);
    onOpenChange(false);
  };

  const body = (
    <div className='space-y-4'>
      <button
        type='button'
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={false}
        aria-describedby='image-upload-modal-description image-upload-modal-hint'
        className={cn(
          'group flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl',
          'border border-dashed bg-slate-50/80 px-6 py-8 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          isDragging ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-900',
          !reviewFile && 'hover:border-blue-300 hover:bg-blue-50/70',
        )}
      >
        <span className='flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700' aria-hidden>
          <FontAwesomeIcon icon={faUpload} className='text-2xl'/>
        </span>
        <span className='space-y-2'>
          <span className='block text-base font-bold uppercase tracking-[0.08em]'>Upload de imagem</span>
          <span id='image-upload-modal-description' className='block text-sm text-slate-600'>Arraste uma imagem ou clique para selecionar</span>
          <span id='image-upload-modal-hint' className='block text-xs text-slate-400'>{ACCEPTED_IMAGE_TYPES_LABEL} até {PHOTO_SOURCE_UPLOAD_LIMIT_LABEL}; a compactação acontece antes do envio</span>
        </span>
      </button>

      <input
        type='file'
        accept={PHOTO_UPLOAD_ACCEPT}
        aria-label='Selecionar imagem para inserir no canvas'
        className='sr-only'
        onChange={handleFileChange}
      />

      {errorMessage ? (
        <p role='alert' className='rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700'>{errorMessage}</p>
      ) : null}

    </div>
  );

  const actions = (
    <Button type='button' variant='outline' className='w-full bg-white' onClick={requestClose} disabled={Boolean(reviewFile)}>
      Cancelar
    </Button>
  );

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept={PHOTO_UPLOAD_ACCEPT}
        aria-label='Seletor nativo para trocar imagem'
        className='sr-only'
        onChange={handleFileChange}
      />

      {isMobile ? (
        <Drawer open={isOpen && !reviewFile} onOpenChange={(open) => !open && requestClose()}>
          <DrawerContent className='max-h-[92dvh] overflow-hidden'>
            <DrawerHeader className='pb-2 text-center'>
              <DrawerTitle className='text-center text-2xl'>Inserir imagem</DrawerTitle>
              <DrawerDescription>Envie uma imagem para posicioná-la no Canvas.</DrawerDescription>
            </DrawerHeader>
            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>{body}</div>
            <ActionDock testId='image-upload-modal-actions' surface='drawer' spacing='flush' edgeToEdge>
              {actions}
            </ActionDock>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen && !reviewFile} onOpenChange={(open) => !open && requestClose()}>
          <DialogContent className='sm:max-w-lg' hideCloseButton>
            <DialogHeader className='text-center'>
              <DialogTitle className='text-center text-2xl'>Inserir imagem</DialogTitle>
              <DialogDescription>Envie uma imagem para posicioná-la no Canvas.</DialogDescription>
            </DialogHeader>
            {body}
            <ActionDock testId='image-upload-modal-actions' surface='dialog' spacing='flush'>
              {actions}
            </ActionDock>
          </DialogContent>
        </Dialog>
      )}

      <ImageUploadReview
        file={reviewFile}
        isOpen={isOpen && reviewFile !== null}
        onOpenChange={(open) => {
          if (!open) {
            const confirmStarted = reviewConfirmStartedRef.current;
            reviewConfirmStartedRef.current = false;
            setReviewFile(null);
            if (confirmStarted) onOpenChange(false);
          }
        }}
        onConfirm={confirmImage}
        onRequestFileChange={() => inputRef.current?.click()}
        title='Revisar imagem para o Canvas'
      />
    </>
  );
}
