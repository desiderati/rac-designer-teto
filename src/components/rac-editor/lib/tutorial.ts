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

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  arrowDirection: 'left' | 'top' | 'bottom' | 'right';
  arrowOffset?: string; // Custom offset for arrow positioning
  closeButtonPosition?: 'left' | 'right'; // Default is "right"
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'main-fab',
    title: 'Menu Principal',
    description: 'Clique aqui para abrir o menu principal com todas as ferramentas.',
    position: {top: '20px', left: '80px'},
    arrowDirection: 'left',
    arrowOffset: '25px',
  },
  {
    id: 'house',
    title: 'Casa TETO',
    description: 'Use este botão para adicionar uma ou mais vistas da casa.',
    position: {top: '65px', left: '80px'},
    arrowDirection: 'left',
    arrowOffset: '30px',
  },
  {
    id: 'elements',
    title: 'Elementos',
    description: 'Abre um submenu com as opções extras para diagramação.',
    position: {top: '225px', left: '80px'},
    arrowDirection: 'left',
    arrowOffset: '30x',
  },
  {
    id: 'zoom-minimap',
    title: 'Zoom e Navegação',
    description: 'Use este botão para mostrar/esconder o controle de zoom e o minimapa.',
    position: {top: '435px', left: '80px'},
    arrowDirection: 'left',
    arrowOffset: '25px',
  },
  {
    id: 'more-options',
    title: 'Mais Opções',
    description: 'Clique aqui para abrir o menu com mais opções, ex.: importar/exportar em JSON.',
    position: {top: '20px', right: '80px'},
    arrowDirection: 'right',
    arrowOffset: '25px',
    closeButtonPosition: 'left',
  },
];

export function getTutorialStepIds() {
  return tutorialSteps.map((s) => s.id);
}
