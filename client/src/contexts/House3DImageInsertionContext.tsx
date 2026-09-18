import {createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {toast} from 'sonner';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';

export type PendingHouse3DImage = {
  dataUrl: string;
  storageUrl: string | null;
  source: 'illustration' | 'fallback';
};

type House3DCanvasHandle = CanvasSnapshotHandle & {
  saveHistory?: () => void;
};

type House3DImageInsertionContextValue = {
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

const House3DImageInsertionContext = createContext<House3DImageInsertionContextValue>(defaultValue);

export function House3DImageInsertionProvider({children}: {children: ReactNode}) {
  const [pendingImage, setPendingImage] = useState<PendingHouse3DImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasGettersRef = useRef(new Set<() => House3DCanvasHandle | null>());

  const registerCanvasGetter = useCallback((getter: () => House3DCanvasHandle | null) => {
    canvasGettersRef.current.add(getter);
    return () => {
      canvasGettersRef.current.delete(getter);
    };
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    setIsGenerating(generating);
    if (generating) setFeedback(null);
  }, []);

  const publishImage = useCallback((image: PendingHouse3DImage) => {
    setPendingImage(image);
    setFeedback(null);
  }, []);

  const discardPendingImage = useCallback(() => {
    setPendingImage(null);
    setFeedback(null);
  }, []);

  const insertPendingImage = useCallback(async () => {
    if (!pendingImage || isInserting) return false;

    const canvas = Array.from(canvasGettersRef.current)
      .reverse()
      .map((getter) => getter())
      .find((candidate): candidate is House3DCanvasHandle => candidate !== null)
      ?? null;
    const snapshotPort = canvas?.createSnapshotPort() ?? null;
    if (!snapshotPort) {
      setFeedback('Abra o Canvas para habilitar a inserção e clique novamente em “Inserir”.');
      return false;
    }

    setIsInserting(true);
    try {
      const inserted = await snapshotPort.insertImageSnapshot(pendingImage.dataUrl, {
        storageUrl: pendingImage.storageUrl,
      });
      if (!inserted) {
        setFeedback('Não foi possível inserir agora. Verifique se o Canvas está aberto e tente novamente.');
        return false;
      }

      canvas?.saveHistory?.();
      setPendingImage(null);
      setFeedback(null);
      toast.success('Imagem 3D inserida no Canvas.', {
        position: 'bottom-right',
        duration: 5000,
        description: 'A imagem foi adicionada ao histórico do editor.',
      });
      return true;
    } catch (error) {
      console.error('[House3DImageInsertion] Falha ao inserir imagem pendente:', error);
      setFeedback('Não foi possível inserir agora. Verifique se o Canvas está aberto e tente novamente.');
      return false;
    } finally {
      setIsInserting(false);
    }
  }, [isInserting, pendingImage]);

  const value = useMemo<House3DImageInsertionContextValue>(() => ({
    pendingImage,
    isGenerating,
    isInserting,
    feedback,
    registerCanvasGetter,
    setGenerating,
    publishImage,
    insertPendingImage,
    discardPendingImage,
  }), [
    discardPendingImage,
    feedback,
    insertPendingImage,
    isGenerating,
    isInserting,
    pendingImage,
    publishImage,
    registerCanvasGetter,
    setGenerating,
  ]);

  return <House3DImageInsertionContext.Provider value={value}>{children}</House3DImageInsertionContext.Provider>;
}

export function useHouse3DImageInsertion(): House3DImageInsertionContextValue {
  return useContext(House3DImageInsertionContext);
}
