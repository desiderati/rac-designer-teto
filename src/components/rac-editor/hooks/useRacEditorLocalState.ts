import {useState} from 'react';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';

export function useRacEditorLocalState() {

  const [infoMessage, setInfoMessage] =
    useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');

  const [pilotiSelection, setPilotiSelection] = useState<PilotiCanvasSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  return {
    infoMessage,
    setInfoMessage,
    pilotiSelection,
    setPilotiSelection,
    isPilotiEditorOpen,
    setIsPilotiEditorOpen,
    isDrawing,
    setIsDrawing,
  };
}
