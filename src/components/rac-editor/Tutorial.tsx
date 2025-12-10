import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface TutorialStep {
  id: "main-fab" | "house" | "elements" | "zoom" | "minimap";
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
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "main-fab",
    title: "Menu Principal",
    description: "Clique aqui para abrir o menu principal com todas as ferramentas.",
    position: { top: "15px", left: "80px" },
    arrowDirection: "left",
    arrowOffset: "25px",
  },
  {
    id: "house",
    title: "Casa TETO",
    description: "Use este botão para adicionar a vista desejada para a casa.",
    position: { top: "65px", left: "80px" },
    arrowDirection: "left",
    arrowOffset: "25px",
  },
  {
    id: "elements",
    title: "Elementos",
    description: "Abre um submenu com as opções extras para diagramação.",
    position: { top: "225px", left: "80px" },
    arrowDirection: "left",
    arrowOffset: "25px",
  },
  {
    id: "zoom",
    title: "Controle de Zoom",
    description: "Arraste o controle para ajustar o nível de zoom do canvas.",
    position: { bottom: "100px", left: "90px" },
    arrowDirection: "left",
    arrowOffset: "40px",
  },
  {
    id: "minimap",
    title: "Minimapa",
    description: "Visualize o canvas completo e navegue rapidamente pela área de trabalho.",
    position: { bottom: "25px", left: "110px" },
    arrowDirection: "left",
    arrowOffset: "65px",
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
    const offset = step.arrowOffset || "50%";

    switch (step.arrowDirection) {
      case "left":
        return {
          className: `${base} border-r-amber-100`,
          style: { left: "-16px", top: offset },
        };
      case "right":
        return {
          className: `${base} border-l-amber-100`,
          style: { right: "-16px", top: offset },
        };
      case "top":
        return {
          className: `${base} border-b-amber-100`,
          style: { top: "-16px", left: offset },
        };
      case "bottom":
        return {
          className: `${base} border-t-amber-100`,
          style: { bottom: "-16px", left: offset },
        };
    }
  };

  const arrowStyles = getArrowStyles();

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
          <div className={arrowStyles.className} style={arrowStyles.style} />

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
