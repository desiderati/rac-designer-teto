import {createContext, type ReactNode, useContext, useMemo} from 'react';
import {trpc} from '@/lib/trpc.ts';

export type TerrainPhotoDescriptionInput = {
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
};

export type TerrainPhotoDescriptionPort = {
  describePhoto(input: TerrainPhotoDescriptionInput): Promise<string | null>;
  isDescribing: boolean;
};

const defaultPort: TerrainPhotoDescriptionPort = {
  describePhoto: async () => null,
  isDescribing: false,
};

const TerrainPhotoDescriptionContext = createContext<TerrainPhotoDescriptionPort>(defaultPort);

export function TerrainPhotoDescriptionProvider({children}: {children: ReactNode}) {
  const mutation = trpc.storage.describeImage.useMutation();
  const value = useMemo<TerrainPhotoDescriptionPort>(() => ({
    isDescribing: mutation.isPending,
    describePhoto: async (input) => {
      const result = await mutation.mutateAsync(input);
      return result.description || null;
    },
  }), [mutation]);

  return (
    <TerrainPhotoDescriptionContext.Provider value={value}>
      {children}
    </TerrainPhotoDescriptionContext.Provider>
  );
}

export function useTerrainPhotoDescription(): TerrainPhotoDescriptionPort {
  return useContext(TerrainPhotoDescriptionContext);
}
