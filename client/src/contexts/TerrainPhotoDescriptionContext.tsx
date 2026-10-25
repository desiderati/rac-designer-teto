import {TerrainPhotoDescriptionContext, type TerrainPhotoDescriptionPort} from './useTerrainPhotoDescription.ts';
export type {TerrainPhotoDescriptionInput, TerrainPhotoDescriptionPort} from './useTerrainPhotoDescription.ts';
import {type ReactNode, useMemo} from 'react';
import {trpc} from '@/lib/trpc.ts';

export function TerrainPhotoDescriptionProvider({children}: {children: ReactNode}) {
  const mutation = trpc.storage.describeImage.useMutation();
  const value = useMemo<TerrainPhotoDescriptionPort>(() => ({
    isDescribing: mutation.isPending,
    available: true,
    describePhoto: async (input) => {
      const result = await mutation.mutateAsync(input);
      return normalizeTerrainPhotoDescription(result.description);
    },
  }), [mutation]);

  return (
    <TerrainPhotoDescriptionContext.Provider value={value}>
      {children}
    </TerrainPhotoDescriptionContext.Provider>
  );
}

function normalizeTerrainPhotoDescription(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(normalized) as {description?: unknown};
    if (typeof parsed.description === 'string') return cleanDescription(parsed.description);
  } catch {
    // O backend já normaliza o caso usual; este fallback cobre respostas antigas em cache.
  }

  const match = normalized.match(/(?:["']?description["']?)\s*:\s*["']?(.+?)["']?\s*[,}]*$/i);
  return cleanDescription(match?.[1] ?? normalized);
}

function cleanDescription(value: string): string | null {
  const cleaned = value
    .replace(/^[\s"'`{]*(?:description)?[\s"'`}]*(?::|=|-)?\s*/i, '')
    .replace(/["'`}]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return cleaned || null;
}
