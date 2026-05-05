export type GuidedTourPlacement = 'top' | 'right' | 'bottom' | 'left';

export type GuidedTourAlignment = 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right';

export type GuidedTourStepKind = 'flow' | 'tip';

export interface GuidedTourStep {
  id: string;
  targetId: string;
  placement: GuidedTourPlacement;
  alignment: GuidedTourAlignment;
  title?: string;
  text: string;
  next?: string;
  persistKey: string;
  kind: GuidedTourStepKind;
}

export interface GuidedTourDefinition {
  id: string;
  initialStepId: string;
  persistKey: string;
  storageRevision?: string;
  autoStart?: boolean;
  triggerEvent?: {
    name: string;
    objectKind?: string;
    replayWhenCompleted?: boolean;
  };
  steps: GuidedTourStep[];
}

export interface GuidedTourTip {
  id: string;
  targetId?: string;
  triggerSelector?: string;
  triggerEvent?: {
    name: string;
    objectKind: string;
  };
  placement: GuidedTourPlacement;
  alignment: GuidedTourAlignment;
  title?: string;
  text: string;
  persistKey: string;
  kind: 'tip';
}

export interface GuidedTourRegistry {
  tours: GuidedTourDefinition[];
  tips: GuidedTourTip[];
}

export interface GuidedTourActiveItem {
  kind: GuidedTourStepKind;
  tourId?: string;
  step: GuidedTourStep | GuidedTourTip;
  targetRect?: DOMRect | null;
}
