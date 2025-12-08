import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHouse, faShapes, faLightbulb, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface TutorialStep {
  title: string;
  description: string;
  icon?: typeof faPlus;
  highlight?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo ao RAC Editor!',
    description: 'Este tutorial rápido vai te mostrar como usar as principais ferramentas do editor.',
  },
  {
    title: 'Menu FAB',
    description: 'Clique no botão + no canto superior esquerdo para abrir o menu principal com todas as ferramentas disponíveis.',
    icon: faPlus,
  },
  {
    title: 'Adicionar Casa',
    description: 'Use o botão Casa para adicionar elementos arquitetônicos como paredes, portas, janelas e escadas.',
    icon: faHouse,
  },
  {
    title: 'Submenu de Elementos',
    description: 'O botão Elementos abre um submenu com formas geométricas, linhas e setas para complementar seu projeto.',
    icon: faShapes,
  },
  {
    title: 'Dicas',
    description: 'Ative o botão Lâmpada para ver dicas contextuais enquanto trabalha no seu projeto.',
    icon: faLightbulb,
  },
];

interface TutorialProps {
  onComplete: () => void;
}

export function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('rac-tutorial-completed', 'true');
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Progress indicator */}
        <div className="flex gap-1 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        {step.icon && (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={step.icon} className="text-primary text-2xl" />
          </div>
        )}

        {/* Content */}
        <h2 className="text-xl font-semibold text-foreground text-center mb-3">
          {step.title}
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
          >
            Pular
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 gap-2"
          >
            {isLastStep ? 'Começar' : 'Próximo'}
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {currentStep + 1} de {tutorialSteps.length}
        </p>
      </div>
    </div>
  );
}
