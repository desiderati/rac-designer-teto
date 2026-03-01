import {Dispatch, SetStateAction, useState} from 'react';
import type {ContraventamentoCanvasSelection} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {ContraventamentoOrigin} from '@/components/rac-editor/lib/canvas';

interface UseContraventamentoFlowResult {
  isContraventamentoMode: boolean;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  selectedContraventamento: ContraventamentoCanvasSelection | null;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  contraventamentoFirst: ContraventamentoOrigin | null;
  setContraventamentoFirst: Dispatch<SetStateAction<ContraventamentoOrigin | null>>;
  contraventamentoSide: ContraventamentoSide | null;
  setContraventamentoSide: Dispatch<SetStateAction<ContraventamentoSide | null>>;
  resetContraventamentoFlow: () => void;
}

export function useContraventamentoFlow(): UseContraventamentoFlowResult {

  const [isContraventamentoMode, setIsContraventamentoMode] = useState(false);
  const [selectedContraventamento, setSelectedContraventamento] =
    useState<ContraventamentoCanvasSelection | null>(null);

  const [contraventamentoFirst, setContraventamentoFirst] = useState<ContraventamentoOrigin | null>(null);
  const [contraventamentoSide, setContraventamentoSide] = useState<ContraventamentoSide | null>(null);

  const resetContraventamentoFlow = () => {
    setIsContraventamentoMode(false);
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
    setSelectedContraventamento(null);
  };

  return {
    isContraventamentoMode,
    setIsContraventamentoMode,
    selectedContraventamento,
    setSelectedContraventamento,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    resetContraventamentoFlow,
  };
}
