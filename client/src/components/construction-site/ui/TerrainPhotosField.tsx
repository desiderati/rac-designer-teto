import {useEffect, useRef, useState, type ChangeEvent} from 'react';
import {Camera, Plus, RefreshCw, Trash2} from 'lucide-react';
import type {TerrainPhoto} from '@/shared/types/construction-site.ts';
import {useStorageImageUpload} from '@/contexts/StorageImageUploadContext.tsx';
import {useTerrainPhotoDescription, type TerrainPhotoDescriptionInput} from '@/contexts/TerrainPhotoDescriptionContext.tsx';
import {
  PHOTO_UPLOAD_ACCEPT,
  needsPhotoCompression,
  preparePhotoFileForUpload,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import {toStorageImageUploadPayload} from '@/shared/lib/storage-image-upload.ts';
import {TextField} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {Progress} from '@/components/ui/progress.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {toast} from '@/components/ui/sonner.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';

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
  const [replacePhotoId, setReplacePhotoId] = useState<string | null>(null);
  const [pendingDeletePhotoId, setPendingDeletePhotoId] = useState<string | null>(null);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [preserveOriginalQuality, setPreserveOriginalQuality] = useState(false);
  const valueRef = useRef(value);
  const selectedPhoto = value[selectedIndex];
  const isBusy = storageUpload.isUploading || isPreparingPhoto;

  useEffect(() => {
    valueRef.current = value;
    setSelectedIndex((current) => value.length === 0 ? 0 : Math.min(current, value.length - 1));
  }, [value]);

  const updatePhotos = (updater: (current: TerrainPhoto[]) => TerrainPhoto[]) => {
    const next = updater(valueRef.current);
    valueRef.current = next;
    onChange(next);
  };

  const openPicker = (photoId?: string) => {
    if (disabled || isBusy) return;
    if (!photoId && valueRef.current.length >= MAX_TERRAIN_PHOTOS) return;
    setReplacePhotoId(photoId ?? null);
    inputRef.current?.click();
  };

  const handleFile = async (file: File, photoIdToReplace: string | null) => {
    if (disabled || isBusy) return;
    if (!photoIdToReplace && valueRef.current.length >= MAX_TERRAIN_PHOTOS) return;

    const validationError = await validatePhotoFile(file, {allowCompression: !preserveOriginalQuality});
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const uploadToastId = `terrain-upload-${Date.now()}`;
    toast.loading('Preparando foto do terreno…', {id: uploadToastId});
    setIsPreparingPhoto(true);
    try {
      if (needsPhotoCompression(file)) toast.loading('Otimizando foto do terreno…', {id: uploadToastId});
      const prepared = await preparePhotoFileForUpload(file, undefined, {preserveOriginalQuality});
      if (prepared.warning) toast.warning(prepared.warning, {id: uploadToastId, duration: 4800});
      const payload = await toStorageImageUploadPayload(prepared.file);
      const url = await storageUpload.uploadImage(prepared.file, constructionSiteId, {
        preserveOriginalQuality,
        preparedFile: prepared,
      });
      const id = photoIdToReplace ?? `terrain-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextIndex = photoIdToReplace
        ? Math.max(0, valueRef.current.findIndex((photo) => photo.id === photoIdToReplace))
        : valueRef.current.length;
      if (photoIdToReplace) {
        updatePhotos((current) => current.map((photo) => (
          photo.id === photoIdToReplace ? {id: photo.id, url} : photo
        )));
      } else {
        updatePhotos((current) => current.length >= MAX_TERRAIN_PHOTOS ? current : [...current, {id, url}]);
      }
      setSelectedIndex(nextIndex);
      toast.success(photoIdToReplace ? 'Foto substituída.' : 'Foto adicionada.', {id: uploadToastId});
      void generateDescription(id, payload);
    } catch (error) {
      console.error('[TerrainPhotosField] Falha ao enviar foto:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a foto. Tente novamente.', {id: uploadToastId});
    } finally {
      setReplacePhotoId(null);
      setIsPreparingPhoto(false);
    }
  };

  const generateDescription = async (photoId: string, input: TerrainPhotoDescriptionInput) => {
    const descriptionToastId = `terrain-description-${photoId}`;
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
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const photoIdToReplace = replacePhotoId;
    event.target.value = '';
    setReplacePhotoId(null);
    if (file) void handleFile(file, photoIdToReplace);
  };

  const removePhoto = (photoId: string) => {
    if (disabled) return;
    const removedIndex = valueRef.current.findIndex((photo) => photo.id === photoId);
    updatePhotos((current) => current.filter((photo) => photo.id !== photoId));
    setSelectedIndex((current) => Math.max(0, Math.min(removedIndex, valueRef.current.length - 1)));
    toast.success('Foto removida.');
  };

  const requestRemovePhoto = (photoId: string) => {
    if (disabled) return;
    setPendingDeletePhotoId(photoId);
  };

  const confirmRemovePhoto = () => {
    if (!pendingDeletePhotoId) return;
    removePhoto(pendingDeletePhotoId);
    setPendingDeletePhotoId(null);
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
                onClick={() => openPicker()}
                disabled={disabled || isBusy}
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
              disabled={disabled || isBusy}
              dragging={photo?.id === draggingId}
              onSelect={() => setSelectedIndex(index)}
              onRemove={() => photo && requestRemovePhoto(photo.id)}
              onReplace={() => photo && openPicker(photo.id)}
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
              onAdd={() => openPicker()}
              isUploading={isBusy}
            />
          ))}
        </div>
      </div>

      <label className='flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600'>
        <input
          type='checkbox'
          checked={preserveOriginalQuality}
          onChange={(event) => setPreserveOriginalQuality(event.target.checked)}
          disabled={disabled || isBusy}
          className='mt-0.5 h-4 w-4 shrink-0 accent-blue-600'
        />
        <span>
          <span className='block font-semibold text-slate-700'>Manter qualidade original</span>
          <span className='block text-[11px] text-slate-500'>Desativa a compressão automática acima de 4 MB.</span>
        </span>
      </label>

      {storageUpload.isUploading && storageUpload.progress ? (
        <div className='space-y-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2' aria-live='polite'>
          <div className='flex items-center justify-between text-[11px] font-semibold text-blue-800'>
            <span>{storageUpload.progress.phase === 'compressing' ? 'Otimizando foto…' : storageUpload.progress.phase === 'reading' ? 'Preparando foto…' : 'Enviando foto…'}</span>
            <span>{storageUpload.progress.percent}%</span>
          </div>
          <Progress value={storageUpload.progress.percent} className='h-1.5 bg-blue-100'/>
          {storageUpload.progress.reductionPercent !== undefined ? (
            <p className='truncate text-[11px] text-blue-700/80'>
              {storageUpload.progress.fileName} · {storageUpload.progress.preservedOriginalQuality ? 'Qualidade original' : `Redução: ${formatReduction(storageUpload.progress.reductionPercent)}`}
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedPhoto ? (
        <TextField
          label='Descrição da Foto Selecionada'
          placeholder='Descrição curta da foto'
          value={selectedPhoto.description ?? ''}
          onChange={(nextDescription) => updatePhotos((current) => current.map((photo) => (
            photo.id === selectedPhoto.id ? {...photo, description: nextDescription} : photo
          ))) }
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
        disabled={disabled || isBusy}
      />

      <AlertDialog
        open={pendingDeletePhotoId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeletePhotoId(null);
        }}
      >
        <AlertDialogContent className='max-w-md rounded-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto do terreno?</AlertDialogTitle>
            <AlertDialogDescription>
              A foto selecionada será removida da ficha do terreno. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemovePhoto}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Excluir foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatReduction(percent: number): string {
  return `${percent.toFixed(1).replace('.', ',')}%`;
}

function TerrainPhotoThumb({
  photo,
  index,
  selected,
  disabled,
  dragging,
  onSelect,
  onRemove,
  onReplace,
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
  dragging: boolean;
  onSelect(): void;
  onRemove(): void;
  onReplace(): void;
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
        'relative min-h-14 aspect-square min-w-0 overflow-hidden rounded-lg border bg-slate-100 transition-colors md:aspect-auto',
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
        onClick={photo ? onSelect : () => onAdd()}
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
        <div data-testid='terrain-photo-actions' className='pointer-events-none absolute inset-y-1 right-1 z-20 flex flex-col items-end justify-between'>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            aria-label={`Excluir foto ${index + 1} do terreno`}
            className='pointer-events-auto grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Trash2 className='h-3.5 w-3.5'/>
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onReplace();
            }}
            disabled={disabled || isUploading}
            aria-label={`Trocar foto ${index + 1} do terreno`}
            className='pointer-events-auto grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <RefreshCw className='h-3.5 w-3.5'/>
          </button>
        </div>
      ) : null}
    </div>
  );
}
