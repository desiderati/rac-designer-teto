import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {markTutorialCompleted} from "@/infra/storage/tutorial.storage.ts";

export interface TutorialBalloonPosition {
  x: number;
  y: number;
}

export interface TutorialBalloonState {
  position: { x: number; y: number };
  text: string;
}

export type TutorialHighlight = 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;

export type TutorialStepId = Exclude<TutorialHighlight, null>;

interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  arrowDirection: "left" | "top" | "bottom" | "right";
  arrowOffset?: string; // Custom offset for arrow positioning
  closeButtonPosition?: "left" | "right"; // Default is "right"
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "main-fab",
    title: "Menu Principal",
    description: "Clique aqui para abrir o menu principal com todas as ferramentas.",
    position: {top: "20px", left: "80px"},
    arrowDirection: "left",
    arrowOffset: "25px",
  },
  {
    id: "house",
    title: "Casa TETO",
    description: "Use este botão para adicionar uma ou mais vistas da casa.",
    position: {top: "65px", left: "80px"},
    arrowDirection: "left",
    arrowOffset: "30px",
  },
  {
    id: "elements",
    title: "Elementos",
    description: "Abre um submenu com as opções extras para diagramação.",
    position: {top: "225px", left: "80px"},
    arrowDirection: "left",
    arrowOffset: "30x",
  },
  {
    id: "zoom-minimap",
    title: "Zoom e Navegação",
    description: "Use este botão para mostrar/esconder o controle de zoom e o minimapa.",
    position: {top: "435px", left: "80px"},
    arrowDirection: "left",
    arrowOffset: "25px",
  },
  {
    id: "more-options",
    title: "Mais Opções",
    description: "Clique aqui para abrir o menu com mais opções, ex.: importar/exportar em JSON.",
    position: {top: "20px", right: "80px"},
    arrowDirection: "right",
    arrowOffset: "25px",
    closeButtonPosition: "left",
  },
];

interface TutorialProps {
  onComplete: () => void;
  currentStepId: string;
}

export function Tutorial({onComplete, currentStepId}: TutorialProps) {
  const currentStepIndex = tutorialSteps.findIndex((s) => s.id === currentStepId);

  if (currentStepIndex === -1) return null;

  const step = tutorialSteps[currentStepIndex];

  const handleComplete = () => {
    markTutorialCompleted();
    onComplete();
  };

  const getArrowStyles = () => {
    const base = "absolute w-0 h-0 border-8 border-transparent";
    const offset = step.arrowOffset || "50%";

    switch (step.arrowDirection) {
      case "left":
        return {
          className: `${base} border-r-amber-100`,
          style: {left: "-15px", top: offset, transform: "translateY(-50%)"},
        };

      case "right":
        return {
          className: `${base} border-l-amber-100`,
          style: {right: "-15px", top: offset, transform: "translateY(-50%)"},
        };

      case "top":
        return {
          className: `${base} border-b-amber-100`,
          style: {top: "-15px", left: offset, transform: "translateX(-50%)"},
        };

      case "bottom":
        return {
          className: `${base} border-t-amber-100`,
          style: {bottom: "-15px", left: offset, transform: "translateX(-50%)"},
        };
    }
  };

  const arrowStyles = getArrowStyles();

  // Only show full blur on steps before "more-options" to keep zoom/minimap visible
  const showFullBlur = step.id !== "more-options";

  return (
    <>
      {/* Overlay sutil - reduced blur on more-options step */}
      <div
        className={`fixed inset-0 z-40 pointer-events-none ${showFullBlur ? "bg-background/40 backdrop-blur-[2px]" : "bg-background/20"}`}
      />

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
          <div className={arrowStyles.className} style={arrowStyles.style}/>

          {/* Close button */}
          <button
            onClick={handleComplete}
            className={`absolute -top-2 w-6 h-6 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors z-50 ${
              step.closeButtonPosition === "left" ? "-left-2" : "-right-2"
            }`}
          >
            <FontAwesomeIcon icon={faXmark} className="text-amber-800 text-xs"/>
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
