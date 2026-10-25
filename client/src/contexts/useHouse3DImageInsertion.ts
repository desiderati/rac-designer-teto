import {createContext, useContext} from 'react';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';

export type PendingHouse3DImage = {
  dataUrl: string;
  storageUrl: string | null;
  source: 'illustration' | 'screenshot';
};

export type House3DCanvasHandle = CanvasSnapshotHandle & {
  saveHistory?: () => void;
};

export type House3DImageInsertionContextValue = {
  pendingImage: PendingHouse3DImage | null;
  isGenerating: boolean;
  isInserting: boolean;
  feedback: string | null;
  registerCanvasGetter: (getter: () => House3DCanvasHandle | null) => () => void;
  setGenerating: (generating: boolean) => void;
  publishImage: (image: PendingHouse3DImage) => void;
  insertPendingImage: () => Promise<boolean>;
  discardPendingImage: () => void;
};

const defaultValue: House3DImageInsertionContextValue = {
  pendingImage: null,
  isGenerating: false,
  isInserting: false,
  feedback: null,
  registerCanvasGetter: () => () => undefined,
  setGenerating: () => undefined,
  publishImage: () => undefined,
  insertPendingImage: async () => false,
  discardPendingImage: () => undefined,
};

export const House3DImageInsertionContext = createContext<House3DImageInsertionContextValue>(defaultValue);

export function useHouse3DImageInsertion(): House3DImageInsertionContextValue {
  return useContext(House3DImageInsertionContext);
}
