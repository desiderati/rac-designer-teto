import {useEffect, useRef, useState, type ChangeEvent} from 'react';
import {Camera, LoaderCircle, Plus, RefreshCw, Trash2} from 'lucide-react';
import type {TerrainPhoto} from '@/shared/types/construction-site.ts';
import {useStorageImageUpload} from '@/contexts/StorageImageUploadContext.tsx';
import {useTerrainPhotoDescription, type TerrainPhotoDescriptionInput} from '@/contexts/TerrainPhotoDescriptionContext.tsx';
import {
  PHOTO_UPLOAD_ACCEPT,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import {
  dataUrlToStorageImageUploadPayload,
  toStorageImageUploadPayload,
} from '@/shared/lib/storage-image-upload.ts';
import {TextArea} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {toast} from '@/components/ui/sonner.tsx';

const MAX_TERRAIN_PHOTOS = 4;

export function TerrainPhotosField({
  constructionSiteId,
  value,
  onChange,
  disabled = false,
}: {
  constructionSiteId: string;
  value: TerrainPhoto[];
  onChange(value: TerrainPhoto[]): void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storageUpload = useStorageImageUpload();
  const description = useTerrainPhotoDescription();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [describingId, setDescribingId] = useState<string | null>(null);
  const valueRef = useRef(value);
  const selectedPhoto = value[selectedIndex];

  useEffect(() => {
    valueRef.current = value;
    setSelectedIndex((current) => value.length === 0 ? 0 : Math.min(current, value.length - 1));
  }, [value]);

  const updatePhotos = (updater: (current: TerrainPhoto[]) => TerrainPhoto[]) => {
    const next = updater(valueRef.current);
    valueRef.current = next;
    onChange(next);
  };

  const openPicker = () => {
    if (disabled || storageUpload.isUploading || valueRef.current.length >= MAX_TERRAIN_PHOTOS) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (disabled || storageUpload.isUploading || valueRef.current.length >= MAX_TERRAIN_PHOTOS) return;

    const validationError = await validatePhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const uploadToastId = `terrain-upload-${Date.now()}`;
    toast.loading('Enviando foto do terreno…', {id: uploadToastId});
    try {
      const payload = await toStorageImageUploadPayload(file);
      const url = await storageUpload.uploadImage(file, constructionSiteId);
      const id = `terrain-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextPhoto: TerrainPhoto = {id, url};
      const nextIndex = valueRef.current.length;
      updatePhotos((current) => current.length >= MAX_TERRAIN_PHOTOS ? current : [...current, nextPhoto]);
      setSelectedIndex(nextIndex);
      toast.success('Foto adicionada.', {id: uploadToastId});
      void generateDescription(id, payload);
    } catch (error) {
      console.error('[TerrainPhotosField] Falha ao enviar foto:', error);
      toast.error('Não foi possível enviar a foto. Tente novamente.', {id: uploadToastId});
    }
  };

  const generateDescription = async (photoId: string, input: TerrainPhotoDescriptionInput) => {
    const descriptionToastId = `terrain-description-${photoId}`;
    setDescribingId(photoId);
    toast.loading('Gerando descrição da foto…', {id: descriptionToastId});
    try {
      const generatedDescription = await description.describePhoto(input);
      if (!generatedDescription) throw new Error('Descrição vazia.');
      updatePhotos((current) => current.map((photo) => (
        photo.id === photoId && !photo.description?.trim() ? {...photo, description: generatedDescription} : photo
      )));
      toast.success('Descrição gerada.', {id: descriptionToastId});
    } catch (error) {
      console.warn('[TerrainPhotosField] Falha ao gerar descrição da foto:', error);
      toast.error('Não foi possível gerar a descrição. Você pode preenchê-la manualmente.', {id: descriptionToastId});
    } finally {
      setDescribingId((current) => current === photoId ? null : current);
    }
  };

  const refreshDescription = async (photo: TerrainPhoto) => {
    if (disabled || describingId === photo.id) return;
    try {
      const payload = await loadImagePayload(photo.url);
      await generateDescription(photo.id, payload);
    } catch (error) {
      console.warn('[TerrainPhotosField] Falha ao ler foto para nova descrição:', error);
      toast.error('Não foi possível atualizar a descrição desta foto.');
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void handleFile(file);
  };

  const removePhoto = (photoId: string) => {
    if (disabled) return;
    const removedIndex = valueRef.current.findIndex((photo) => photo.id === photoId);
    updatePhotos((current) => current.filter((photo) => photo.id !== photoId));
    setSelectedIndex((current) => Math.max(0, Math.min(removedIndex, valueRef.current.length - 1)));
    toast.success('Foto removida.');
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex) return;
    updatePhotos((current) => {
      if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= MAX_TERRAIN_PHOTOS) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return current;
      next.splice(Math.min(toIndex, next.length), 0, moved);
      return next;
    });
    setSelectedIndex(toIndex);
  };

  const slots = Array.from({length: MAX_TERRAIN_PHOTOS}, (_, index) => value[index]);

  return (
    <div data-testid='terrain-photos-field' className='space-y-4'>
      <div className='grid min-w-0 gap-3 md:items-stretch md:grid-cols-[minmax(0,1fr)_148px]'>
        <div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100'>
          <div className='relative aspect-[4/3] w-full'>
            {selectedPhoto ? (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.description || `Foto do terreno ${selectedIndex + 1}`}
                className='absolute inset-0 h-full w-full object-cover'
              />
            ) : (
              <button
                type='button'
                onClick={openPicker}
                disabled={disabled || storageUpload.isUploading}
                className='absolute inset-0 grid cursor-pointer place-items-center text-slate-400 transition-colors hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-60'
                aria-label='Adicionar foto do terreno'
              >
                <Camera className='h-9 w-9'/>
              </button>
            )}
          </div>
        </div>

        <div className='grid min-w-0 grid-cols-4 gap-2 md:h-full md:grid-cols-1 md:grid-rows-4'>
          {slots.map((photo, index) => (
            <TerrainPhotoThumb
              key={photo?.id ?? `terrain-photo-slot-${index + 1}`}
              photo={photo}
              index={index}
              selected={index === selectedIndex}
              disabled={disabled}
              isDescribing={photo?.id === describingId}
              dragging={photo?.id === draggingId}
              onSelect={() => setSelectedIndex(index)}
              onRemove={() => photo && removePhoto(photo.id)}
              onRefresh={() => photo && void refreshDescription(photo)}
              onDragStart={() => photo && setDraggingId(photo.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => {
                if (draggingId) event.preventDefault();
              }}
              onDrop={() => {
                if (!draggingId) return;
                const fromIndex = valueRef.current.findIndex((item) => item.id === draggingId);
                movePhoto(fromIndex, index);
                setDraggingId(null);
              }}
              onAdd={openPicker}
              isUploading={storageUpload.isUploading}
            />
          ))}
        </div>
      </div>

      {selectedPhoto ? (
        <TextArea
          label='Descrição'
          placeholder='Descrição curta da foto'
          value={selectedPhoto.description ?? ''}
          onChange={(nextDescription) => updatePhotos((current) => current.map((photo) => (
            photo.id === selectedPhoto.id ? {...photo, description: nextDescription} : photo
          )))}
          maxLength={120}
          disabled={disabled}
        />
      ) : null}

      <input
        ref={inputRef}
        type='file'
        accept={PHOTO_UPLOAD_ACCEPT}
        className='sr-only'
        aria-label='Arquivo de foto do terreno'
        onChange={handleFileChange}
        disabled={disabled || storageUpload.isUploading}
      />
    </div>
  );
}

function TerrainPhotoThumb({
  photo,
  index,
  selected,
  disabled,
  isDescribing,
  dragging,
  onSelect,
  onRemove,
  onRefresh,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onAdd,
  isUploading,
}: {
  photo?: TerrainPhoto;
  index: number;
  selected: boolean;
  disabled: boolean;
  isDescribing: boolean;
  dragging: boolean;
  onSelect(): void;
  onRemove(): void;
  onRefresh(): void;
  onDragStart(): void;
  onDragEnd(): void;
  onDragOver(event: React.DragEvent<HTMLDivElement>): void;
  onDrop(): void;
  onAdd(): void;
  isUploading: boolean;
}) {
  return (
    <div
      className={cn(
        'relative aspect-square min-w-0 overflow-hidden rounded-lg border bg-slate-100 transition-colors md:aspect-auto',
        selected ? 'border-2 border-blue-600 ring-2 ring-blue-100' : 'border-slate-200',
        dragging ? 'opacity-50' : null,
      )}
      draggable={Boolean(photo) && !disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <button
        type='button'
        onClick={photo ? onSelect : onAdd}
        disabled={disabled || isUploading}
        aria-label={photo ? `Selecionar foto ${index + 1} do terreno` : `Adicionar foto ${index + 1} do terreno`}
        className='absolute inset-0 z-0 grid cursor-pointer place-items-center bg-slate-100 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {photo ? (
          <img src={photo.url} alt={photo.description || `Miniatura da foto ${index + 1}`} className='h-full w-full object-cover'/>
        ) : (
          <Plus className='h-5 w-5 text-slate-400'/>
        )}
      </button>

      <span className='pointer-events-none absolute left-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-slate-800/80 text-[10px] font-bold text-white'>
        {index + 1}
      </span>

      {photo ? (
        <>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            aria-label={`Excluir foto ${index + 1} do terreno`}
            className='absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded-md bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Trash2 className='h-3.5 w-3.5'/>
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
            }}
            disabled={disabled || isDescribing}
            aria-label={`Atualizar descrição da foto ${index + 1}`}
            className='absolute bottom-1 right-1 z-20 grid h-6 w-6 place-items-center rounded-md bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isDescribing ? <LoaderCircle className='h-3.5 w-3.5 animate-spin'/> : <RefreshCw className='h-3.5 w-3.5'/>}
          </button>
        </>
      ) : null}
    </div>
  );
}

async function loadImagePayload(url: string): Promise<TerrainPhotoDescriptionInput> {
  if (url.startsWith('data:')) {
    const payload = dataUrlToStorageImageUploadPayload(url, 'terrain-photo');
    return {base64: payload.base64, mimeType: payload.mimeType};
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível carregar a foto.');
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Imagem inválida.'));
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    reader.readAsDataURL(blob);
  });
  const payload = dataUrlToStorageImageUploadPayload(dataUrl, 'terrain-photo');
  return {base64: payload.base64, mimeType: payload.mimeType};
}
