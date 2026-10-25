import {createContext, useContext} from 'react';
import type {PreparedPhotoFile} from '@/shared/lib/photo-data-url.ts';

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

export const StorageImageUploadContext = createContext<StorageImageUploadPort>({
  uploadImage: async (file) => readFileAsDataUrl(file),
  isUploading: false,
  progress: null,
});

export function readFileAsDataUrl(file: File): Promise<string> {
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

export function useStorageImageUpload(): StorageImageUploadPort {
  return useContext(StorageImageUploadContext);
}
