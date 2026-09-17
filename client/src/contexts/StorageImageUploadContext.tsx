import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc.ts';
import { toStorageImageUploadPayload } from '@/shared/lib/storage-image-upload.ts';

export type StorageUploadPhase = 'reading' | 'uploading' | 'complete';

export interface StorageUploadProgress {
  phase: StorageUploadPhase;
  percent: number;
  fileName: string;
}

export interface StorageImageUploadPort {
  uploadImage(file: File): Promise<string>;
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
    uploadImage: async (file) => {
      if (clearProgressTimer.current) clearTimeout(clearProgressTimer.current);
      setIsUploading(true);
      setProgress({ phase: 'reading', percent: 0, fileName: file.name });
      try {
        const payload = await toStorageImageUploadPayload(file, (percent) => {
          setProgress({ phase: 'reading', percent: Math.min(55, Math.round(percent * 0.55)), fileName: file.name });
        });
        setProgress({ phase: 'uploading', percent: 60, fileName: file.name });
        const uploaded = await mutation.mutateAsync({
          ...payload,
          constructionSiteId: undefined,
        });
        setProgress({ phase: 'complete', percent: 100, fileName: file.name });
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
