import {Dispatch, SetStateAction, useState} from "react";
import type {Group} from "fabric";
import type {ContraventamentoSide} from "@/lib/canvas-utils";
import type {ContraventamentoCanvasSelection} from "@/components/rac-editor/Canvas";

type ContraventamentoStep = "select-first" | "select-second";

interface ContraventamentoOrigin {
  pilotiId: string;
  col: number;
  row: number;
  group: Group;
}

interface UseContraventamentoFlowResult {
  isContraventamentoMode: boolean;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  selectedContraventamento: ContraventamentoCanvasSelection | null;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  contraventamentoStep: ContraventamentoStep;
  setContraventamentoStep: Dispatch<SetStateAction<ContraventamentoStep>>;
  contraventamentoFirst: ContraventamentoOrigin | null;
  setContraventamentoFirst: Dispatch<SetStateAction<ContraventamentoOrigin | null>>;
  contraventamentoSide: ContraventamentoSide | null;
  setContraventamentoSide: Dispatch<SetStateAction<ContraventamentoSide | null>>;
  resetContraventamentoFlow: () => void;
}

export function useContraventamentoFlow(): UseContraventamentoFlowResult {
  const [isContraventamentoMode, setIsContraventamentoMode] = useState(false);
  const [selectedContraventamento, setSelectedContraventamento] = useState<ContraventamentoCanvasSelection | null>(null);
  const [contraventamentoStep, setContraventamentoStep] = useState<ContraventamentoStep>("select-first");
  const [contraventamentoFirst, setContraventamentoFirst] = useState<ContraventamentoOrigin | null>(null);
  const [contraventamentoSide, setContraventamentoSide] = useState<ContraventamentoSide | null>(null);

  const resetContraventamentoFlow = () => {
    setIsContraventamentoMode(false);
    setContraventamentoStep("select-first");
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
    setSelectedContraventamento(null);
  };

  return {
    isContraventamentoMode,
    setIsContraventamentoMode,
    selectedContraventamento,
    setSelectedContraventamento,
    contraventamentoStep,
    setContraventamentoStep,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    resetContraventamentoFlow,
  };
}
