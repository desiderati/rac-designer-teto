import {createContext, useContext} from 'react';

export type TerrainPhotoDescriptionInput = {
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
};

export type TerrainPhotoDescriptionPort = {
  describePhoto(input: TerrainPhotoDescriptionInput): Promise<string | null>;
  isDescribing: boolean;
  available: boolean;
};

const defaultPort: TerrainPhotoDescriptionPort = {
  describePhoto: async () => null,
  isDescribing: false,
  available: false,
};

export const TerrainPhotoDescriptionContext = createContext<TerrainPhotoDescriptionPort>(defaultPort);

export function useTerrainPhotoDescription(): TerrainPhotoDescriptionPort {
  return useContext(TerrainPhotoDescriptionContext);
}
