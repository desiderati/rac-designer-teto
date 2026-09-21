import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc.ts';
import { toast } from '@/components/ui/sonner.tsx';
import {
  preparePhotoFileForUpload,
  PHOTO_COMPRESSION_THRESHOLD_BYTES,
  type PreparedPhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import { toStorageImageUploadPayload } from '@/shared/lib/storage-image-upload.ts';

export type StorageUploadPhase = 'compressing' | 'reading' | 'uploading' | 'complete';

export interface StorageUploadProgress {
  phase: StorageUploadPhase;
  percent: number;
  fileName: string;
  originalBytes?: number;
  finalBytes?: number;
  reductionPercent?: number;
  preservedOriginalQuality?: boolean;
}

export interface StorageImageUploadOptions {
  preserveOriginalQuality?: boolean;
  preparedFile?: PreparedPhotoFile;
}

export interface StorageImageUploadPort {
  uploadImage(file: File, constructionSiteId?: string, options?: StorageImageUploadOptions): Promise<string>;
  isUploading: boolean;
  progress?: StorageUploadProgress | null;
}

const StorageImageUploadContext = createContext<StorageImageUploadPort>({
  uploadImage: async (file) => readFileAsDataUrl(file),
  isUploading: false,
  progress: null,
});

export function StorageImageUploadProvider({ children }: { children: ReactNode }) {
  const mutation = trpc.storage.uploadImage.useMutation();
  const [progress, setProgress] = useState<StorageUploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const clearProgressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (clearProgressTimer.current) clearTimeout(clearProgressTimer.current);
  }, []);

  const value = useMemo<StorageImageUploadPort>(() => ({
    isUploading: isUploading || mutation.isPending,
    progress,
    uploadImage: async (file, constructionSiteId, options = {}) => {
      if (clearProgressTimer.current) clearTimeout(clearProgressTimer.current);
      setIsUploading(true);
      setProgress({ phase: 'reading', percent: 0, fileName: file.name });
      try {
        const prepared = options.preparedFile ?? await preparePhotoFileForUpload(file, (percent) => {
          setProgress({
            phase: 'compressing',
            percent: Math.min(50, Math.max(8, Math.round(percent * 0.5))),
            fileName: file.name,
            preservedOriginalQuality: options.preserveOriginalQuality,
          });
        }, options);

        if (prepared.compressed) {
          toast.success(`Imagem otimizada em ${formatReduction(prepared.reductionPercent)}: ${formatFileSize(prepared.originalBytes)} → ${formatFileSize(prepared.finalBytes)}.`, {
            duration: 3600,
          });
        } else if (prepared.warning && file.size > PHOTO_COMPRESSION_THRESHOLD_BYTES) {
          toast.warning(prepared.warning, {duration: 4800});
        }

        setProgress({
          phase: 'reading',
          percent: 55,
          fileName: prepared.file.name,
          originalBytes: prepared.originalBytes,
          finalBytes: prepared.finalBytes,
          reductionPercent: prepared.reductionPercent,
          preservedOriginalQuality: options.preserveOriginalQuality,
        });
        const payload = await toStorageImageUploadPayload(prepared.file, (percent) => {
          setProgress({
            phase: 'reading',
            percent: 55 + Math.min(10, Math.round(percent * 0.1)),
            fileName: prepared.file.name,
            originalBytes: prepared.originalBytes,
            finalBytes: prepared.finalBytes,
            reductionPercent: prepared.reductionPercent,
            preservedOriginalQuality: options.preserveOriginalQuality,
          });
        });
        setProgress({
          phase: 'uploading',
          percent: 65,
          fileName: prepared.file.name,
          originalBytes: prepared.originalBytes,
          finalBytes: prepared.finalBytes,
          reductionPercent: prepared.reductionPercent,
          preservedOriginalQuality: options.preserveOriginalQuality,
        });
        const uploaded = await mutation.mutateAsync({
          ...payload,
          constructionSiteId,
        });
        setProgress({
          phase: 'complete',
          percent: 100,
          fileName: prepared.file.name,
          originalBytes: prepared.originalBytes,
          finalBytes: prepared.finalBytes,
          reductionPercent: prepared.reductionPercent,
          preservedOriginalQuality: options.preserveOriginalQuality,
        });
        clearProgressTimer.current = setTimeout(() => setProgress(null), 900);
        return uploaded.url;
      } catch (error) {
        setProgress(null);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
  }), [isUploading, mutation, progress]);

  return <StorageImageUploadContext.Provider value={value}>{children}</StorageImageUploadContext.Provider>;
}

export function useStorageImageUpload(): StorageImageUploadPort {
  return useContext(StorageImageUploadContext);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Resultado de imagem inválido.'));
    };
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formatReduction(percent: number): string {
  return `${percent.toFixed(1).replace('.', ',')}%`;
}
