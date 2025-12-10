import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface TutorialStep {
  id: "main-fab" | "house" | "elements" | "tips";
  title: string;
  description: string;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  arrowDirection: "left" | "top" | "bottom" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "main-fab",
    title: "Menu Principal",
    description: "Clique aqui para abrir o menu principal com todas as ferramentas.",
    position: { top: "16px", left: "80px" },
    arrowDirection: "left",
  },
  {
    id: "house",
    title: "Casa TETO",
    description: "Use este botão para adicionar a vista desejada para a casa.",
    position: { top: "60px", left: "80px" },
    arrowDirection: "left",
  },
  {
    id: "elements",
    title: "Elementos",
    description: "Abre um submenu com as opções extras para diagramação.",
    position: { top: "204px", left: "80px" },
    arrowDirection: "left",
  },
  {
    id: "tips",
    title: "Dicas",
    description: "Ative para ver dicas contextuais enquanto trabalha.",
    position: { top: "568px", left: "80px" },
    arrowDirection: "left",
  },
];

interface TutorialProps {
  onComplete: () => void;
  currentStepId: string;
}

export function Tutorial({ onComplete, currentStepId }: TutorialProps) {
  const currentStepIndex = tutorialSteps.findIndex((s) => s.id === currentStepId);

  if (currentStepIndex === -1) return null;

  const step = tutorialSteps[currentStepIndex];

  const handleComplete = () => {
    localStorage.setItem("rac-tutorial-completed", "true");
    onComplete();
  };

  const getArrowStyles = () => {
    const base = "absolute w-0 h-0 border-8 border-transparent";

    switch (step.arrowDirection) {
      case "left":
        return `${base} -left-4 top-1/2 -translate-y-1/2 border-r-amber-100`;
      case "right":
        return `${base} -right-4 top-1/2 -translate-y-1/2 border-l-amber-100`;
      case "top":
        return `${base} -top-4 left-1/2 -translate-x-1/2 border-b-amber-100`;
      case "bottom":
        return `${base} -bottom-4 left-1/2 -translate-x-1/2 border-t-amber-100`;
    }
  };

  return (
    <>
      {/* Overlay sutil */}
      <div className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40 pointer-events-none" />

      {/* Balloon tooltip */}
      <div
        className="fixed z-50 animate-scale-in"
        style={{
          top: step.position.top,
          left: step.position.left,
          bottom: step.position.bottom,
          right: step.position.right,
        }}
      >
        <div className="relative bg-amber-100 text-amber-900 rounded-xl shadow-lg p-4 max-w-[240px]">
          {/* Arrow */}
          <div className={getArrowStyles()} />

          {/* Close button */}
          <button
            onClick={handleComplete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors z-50"
          >
            <FontAwesomeIcon icon={faXmark} className="text-amber-800 text-xs" />
          </button>

          {/* Content */}
          <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
          <p className="text-xs text-amber-800 mb-3">{step.description}</p>

          {/* Progress dots */}
          <div className="flex gap-1 justify-center">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index <= currentStepIndex ? "bg-amber-500" : "bg-amber-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function getTutorialStepIds() {
  return tutorialSteps.map((s) => s.id);
}
