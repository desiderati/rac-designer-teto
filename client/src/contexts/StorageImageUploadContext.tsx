import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { trpc } from '@/lib/trpc.ts';
import { toStorageImageUploadPayload } from '@/shared/lib/storage-image-upload.ts';

export interface StorageImageUploadPort {
  uploadImage(file: File): Promise<string>;
  isUploading: boolean;
}

const StorageImageUploadContext = createContext<StorageImageUploadPort>({
  uploadImage: async (file) => readFileAsDataUrl(file),
  isUploading: false,
});

/**
 * Ativa a rota protegida de Storage para o editor. O valor padrão existe só
 * para testes isolados de componentes; a aplicação sempre monta este provider.
 */
export function StorageImageUploadProvider({ children }: { children: ReactNode }) {
  const mutation = trpc.storage.uploadImage.useMutation();
  const value = useMemo<StorageImageUploadPort>(() => ({
    isUploading: mutation.isPending,
    uploadImage: async (file) => {
      const payload = await toStorageImageUploadPayload(file);
      const uploaded = await mutation.mutateAsync({
        ...payload,
        constructionSiteId: undefined,
      });
      return uploaded.url;
    },
  }), [mutation]);

  return (
    <StorageImageUploadContext.Provider value={value}>
      {children}
    </StorageImageUploadContext.Provider>
  );
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
