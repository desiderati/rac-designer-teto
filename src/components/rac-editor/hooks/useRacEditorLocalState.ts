import {useCallback, useState} from 'react';
import {PilotiCanvasSelection} from "@/components/lib/canvas";

type TutorialBalloonState = {
  position: { x: number; y: number };
  text: string;
} | null;

export function useRacEditorLocalState() {
  const [infoMessage, setInfoMessage] =
    useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');

  const [pilotiSelection, setPilotiSelection] = useState<PilotiCanvasSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const [tutorialBalloon, setTutorialBalloon] = useState<TutorialBalloonState>(null);
  const [tutorialPilotiPosition, setTutorialPilotiPosition] =
    useState<{ x: number; y: number; } | null>(null);

  const clearTutorialBalloon = useCallback(() => {
    setTutorialBalloon(null);
  }, []);

  return {
    infoMessage,
    setInfoMessage,
    pilotiSelection,
    setPilotiSelection,
    isPilotiEditorOpen,
    setIsPilotiEditorOpen,
    isDrawing,
    setIsDrawing,
    tutorialBalloon,
    setTutorialBalloon,
    clearTutorialBalloon,
    tutorialPilotiPosition,
    setTutorialPilotiPosition,
  };
}
