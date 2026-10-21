import {useState} from 'react';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {DEFAULT_CANVAS_HINT} from '@/components/rac-editor/@canvas/lib/hints.ts';

export function useRacEditorLocalState() {

  const [infoMessage, setInfoMessage] =
    useState(DEFAULT_CANVAS_HINT);

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
