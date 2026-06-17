import {ChangeEvent, DragEvent, useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUpload} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_UPLOAD_ERROR_MESSAGE,
  isSupportedPhotoDataUrl,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';

const ACCEPTED_IMAGE_TYPES_LABEL = 'PNG, JPG ou WEBP';

interface ImageUploadModalProps {
  isMobile: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (dataUrl: string) => Promise<boolean> | boolean;
}

export function ImageUploadModal({
  isMobile,
  isOpen,
  onOpenChange,
  onInsertImage,
}: ImageUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setIsUploading(false);
      setErrorMessage('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [isOpen]);

  const requestClose = () => {
    if (isUploading) return;
    onOpenChange(false);
  };

  const processFile = async (file: File | null | undefined) => {
    if (!file || isUploading) return;

    const validationMessage = await validatePhotoFile(file);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!isSupportedPhotoDataUrl(dataUrl)) {
        setErrorMessage(PHOTO_UPLOAD_ERROR_MESSAGE);
        return;
      }
      const inserted = await onInsertImage(dataUrl);
      if (inserted) {
        onOpenChange(false);
        return;
      }
      setErrorMessage('Não foi possível inserir a imagem no canvas. Tente novamente.');
    } catch (error) {
      console.error('[ImageUploadModal] Falha ao carregar imagem:', error);
      setErrorMessage('Não foi possível ler o arquivo selecionado. Tente outra imagem.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
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
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
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
        disabled={isUploading}
        aria-describedby='image-upload-modal-description image-upload-modal-hint'
        className={cn(
          'group flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl',
          'border border-dashed bg-slate-50/80 px-6 py-8 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          isDragging ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-900',
          !isUploading && 'hover:border-blue-300 hover:bg-blue-50/70',
          isUploading && 'cursor-wait opacity-75',
        )}
      >
        <span
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors',
            isDragging ? 'border-blue-200 bg-white text-blue-600' : 'border-slate-200 bg-white text-slate-700',
          )}
          aria-hidden
        >
          <FontAwesomeIcon icon={faUpload} className='text-2xl'/>
        </span>

        <span className='space-y-2'>
          <span className='block text-base font-bold uppercase tracking-[0.08em]'>
            {isUploading ? 'Inserindo imagem' : 'Upload de imagem'}
          </span>
          <span id='image-upload-modal-description' className='block text-sm text-slate-600'>
            Arraste uma imagem ou clique para selecionar
          </span>
          <span id='image-upload-modal-hint' className='block text-xs text-slate-400'>
            {ACCEPTED_IMAGE_TYPES_LABEL} até 2 MB
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type='file'
        accept={PHOTO_UPLOAD_ACCEPT}
        aria-label='Selecionar imagem para inserir no canvas'
        className='sr-only'
        onChange={handleFileChange}
      />

      {errorMessage && (
        <p role='alert' className='rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {errorMessage}
        </p>
      )}

      <Button
        type='button'
        variant='outline'
        className='w-full bg-white'
        disabled={isUploading}
        onClick={requestClose}
      >
        Cancelar
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && requestClose()}>
        <DrawerContent>
          <DrawerHeader className='text-center pb-2'>
            <DrawerTitle className='text-center text-2xl'>Inserir imagem</DrawerTitle>
            <DrawerDescription>
              Envie uma imagem para posicioná-la no canvas.
            </DrawerDescription>
          </DrawerHeader>
          <div className='px-4 pb-4'>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className='sm:max-w-lg' hideCloseButton>
        <DialogHeader className='text-center'>
          <DialogTitle className='text-center text-2xl'>Inserir imagem</DialogTitle>
          <DialogDescription>
            Envie uma imagem para posicioná-la no canvas.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Resultado de leitura inválido.'));
    };
    reader.readAsDataURL(file);
  });
}
