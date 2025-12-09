import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface TutorialStep {
  title: string;
  description: string;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  arrowDirection: 'left' | 'top' | 'bottom' | 'right';
  arrowOffset?: number;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Menu Principal',
    description: 'Clique aqui para abrir o menu principal com todas as ferramentas.',
    position: { top: '20px', left: '72px' },
    arrowDirection: 'left',
    arrowOffset: 4,
  },
  {
    title: 'Casa TETO',
    description: 'Use este botão para adicionar a vista desejada para a casa.',
    position: { top: '72px', left: '72px' },
    arrowDirection: 'left',
  },
  {
    title: 'Elementos',
    description: 'Abre um submenu com as opções extras para diagramação.',
    position: { top: '216px', left: '72px' },
    arrowDirection: 'left',
  },
  {
    title: 'Dicas',
    description: 'Ative para ver dicas contextuais enquanto trabalha.',
    position: { top: '528px', left: '72px' },
    arrowDirection: 'left',
  },
];

interface TutorialProps {
  onComplete: () => void;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
}

export function Tutorial({ onComplete, isMenuOpen, onOpenMenu }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    // Open menu automatically when going past first step
    if (currentStep === 0 && !isMenuOpen) {
      onOpenMenu();
    }
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('rac-tutorial-completed', 'true');
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const getArrowStyles = () => {
    const base = 'absolute w-0 h-0 border-8 border-transparent';
    const offset = step.arrowOffset !== undefined ? `${step.arrowOffset}px` : '50%';
    const translateY = step.arrowOffset !== undefined ? '0' : '-50%';
    
    switch (step.arrowDirection) {
      case 'left':
        return `${base} -left-4 border-r-amber-100`;
      case 'right':
        return `${base} -right-4 top-1/2 -translate-y-1/2 border-l-amber-100`;
      case 'top':
        return `${base} -top-4 left-1/2 -translate-x-1/2 border-b-amber-100`;
      case 'bottom':
        return `${base} -bottom-4 left-1/2 -translate-x-1/2 border-t-amber-100`;
    }
  };

  const getArrowInlineStyles = () => {
    if (step.arrowDirection === 'left') {
      const offset = step.arrowOffset !== undefined ? `${step.arrowOffset}px` : '50%';
      const translateY = step.arrowOffset !== undefined ? '0' : '-50%';
      return { top: offset, transform: `translateY(${translateY})` };
    }
    return {};
  };

  return (
    <>
      {/* Overlay sutil */}
      <div className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40" />
      
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
          <div className={getArrowStyles()} style={getArrowInlineStyles()} />
          
          {/* Close button */}
          <button
            onClick={handleComplete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-amber-800 text-xs" />
          </button>

          {/* Content */}
          <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
          <p className="text-xs text-amber-800 mb-3">{step.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700">
              {currentStep + 1}/{tutorialSteps.length}
            </span>
            <Button
              size="sm"
              onClick={handleNext}
              className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-[10px]" />
            </Button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1 justify-center mt-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-amber-500' : 'bg-amber-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
