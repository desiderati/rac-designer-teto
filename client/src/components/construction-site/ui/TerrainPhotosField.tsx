import {useEffect, useRef, useState} from 'react';
import {Camera, LoaderCircle, Plus, Trash2} from 'lucide-react';
import type {TerrainPhoto} from '@/shared/types/construction-site.ts';
import {useStorageImageUpload} from '@/contexts/StorageImageUploadContext.tsx';
import {useTerrainPhotoDescription} from '@/contexts/TerrainPhotoDescriptionContext.tsx';
import {
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_UPLOAD_ERROR_MESSAGE,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import {toStorageImageUploadPayload} from '@/shared/lib/storage-image-upload.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [describingId, setDescribingId] = useState<string | null>(null);
  const valueRef = useRef(value);
  const selectedPhoto = value[selectedIndex] ?? value[0];

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const openPicker = () => {
    if (disabled || storageUpload.isUploading || value.length >= MAX_TERRAIN_PHOTOS) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (disabled || storageUpload.isUploading || value.length >= MAX_TERRAIN_PHOTOS) return;
    setUploadError(null);
    const validationError = await validatePhotoFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    try {
      const payload = await toStorageImageUploadPayload(file);
      const url = await storageUpload.uploadImage(file, constructionSiteId);
      const id = `terrain-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextPhoto: TerrainPhoto = {id, url};
      onChange([...value, nextPhoto]);
      setSelectedIndex(value.length);
      setDescribingId(id);
      try {
        const generatedDescription = await description.describePhoto({
          base64: payload.base64,
          mimeType: payload.mimeType,
        });
        if (generatedDescription) {
          onChange(valueRef.current.map((photo) => photo.id === id ? {...photo, description: generatedDescription} : photo));
        }
      } catch (error) {
        console.warn('[TerrainPhotosField] Falha ao gerar descrição da foto:', error);
      } finally {
        setDescribingId(null);
      }
    } catch (error) {
      console.error('[TerrainPhotosField] Falha ao enviar foto:', error);
      setUploadError('Não foi possível enviar a foto. Tente novamente.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void handleFile(file);
  };

  const removeSelectedPhoto = () => {
    if (!selectedPhoto || disabled) return;
    const removedIndex = value.findIndex((photo) => photo.id === selectedPhoto.id);
    const next = value.filter((photo) => photo.id !== selectedPhoto.id);
    onChange(next);
    setSelectedIndex(Math.max(0, Math.min(removedIndex, next.length - 1)));
  };

  return (
    <div data-testid='terrain-photos-field' className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Fotos do Terreno</span>
        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>{value.length} / {MAX_TERRAIN_PHOTOS} fotos</span>
      </div>

      <div className='grid min-w-0 gap-3 md:items-stretch md:grid-cols-[minmax(0,1fr)_148px]'>
        <div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100'>
          <div className='relative aspect-[4/3] min-h-[220px] w-full'>
            {selectedPhoto ? (
              <img src={selectedPhoto.url} alt={selectedPhoto.description || `Foto do terreno ${selectedIndex + 1}`} className='absolute inset-0 h-full w-full object-cover'/>
            ) : (
              <button
                type='button'
                onClick={openPicker}
                disabled={disabled}
                className='absolute inset-0 grid cursor-pointer place-items-center text-slate-400 transition-colors hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-60'
                aria-label='Adicionar foto do terreno'
              >
                <span className='grid place-items-center gap-2 text-center text-sm font-semibold'>
                  <Camera className='h-8 w-8'/>
                  Adicione a primeira foto
                </span>
              </button>
            )}
            {selectedPhoto ? (
              <button
                type='button'
                onClick={removeSelectedPhoto}
                disabled={disabled}
                aria-label='Remover foto selecionada do terreno'
                className='absolute right-3 top-3 grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <Trash2 className='h-4 w-4'/>
              </button>
            ) : null}
          </div>
          <div className='min-h-12 border-t border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700'>
            {describingId === selectedPhoto?.id ? 'Gerando descrição da foto…' : selectedPhoto?.description || (selectedPhoto ? `Foto ${selectedIndex + 1} — Visão do terreno` : 'Nenhuma foto adicionada')}
          </div>
        </div>

        <div className='grid min-w-0 grid-cols-4 gap-2 md:h-full md:grid-cols-1 md:grid-rows-4'>
          {value.map((photo, index) => (
            <button
              type='button'
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Selecionar foto ${index + 1} do terreno`}
              className={cn(
                'relative aspect-square min-w-0 overflow-hidden rounded-lg border bg-slate-100 transition-colors md:aspect-auto',
                index === selectedIndex ? 'border-2 border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300',
              )}
            >
              <img src={photo.url} alt={photo.description || `Miniatura da foto ${index + 1}`} className='h-full w-full object-cover'/>
              <span className='absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-800/80 text-[10px] font-bold text-white'>{index + 1}</span>
            </button>
          ))}
          {value.length < MAX_TERRAIN_PHOTOS ? (
            <button
              type='button'
              onClick={openPicker}
              disabled={disabled || storageUpload.isUploading}
              aria-label='Adicionar foto do terreno'
              className='grid aspect-square min-w-0 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-blue-300 bg-white text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 md:aspect-auto'
            >
              {storageUpload.isUploading ? <LoaderCircle className='h-5 w-5 animate-spin'/> : <Plus className='h-6 w-6'/>}
            </button>
          ) : null}
        </div>
      </div>

      <input ref={inputRef} type='file' accept={PHOTO_UPLOAD_ACCEPT} className='sr-only' aria-label='Arquivo de foto do terreno' onChange={handleFileChange} disabled={disabled || storageUpload.isUploading}/>
      {storageUpload.isUploading ? <p className='text-xs font-medium text-blue-700' role='status'>Enviando foto para o Storage…</p> : null}
      {description.isDescribing || describingId ? <p className='text-xs font-medium text-slate-500' role='status'>A descrição curta será preenchida automaticamente.</p> : null}
      {uploadError ? <p role='alert' className='text-xs font-semibold text-red-600'>{uploadError || PHOTO_UPLOAD_ERROR_MESSAGE}</p> : null}
    </div>
  );
}
