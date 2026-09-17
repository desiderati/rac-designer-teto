import {GuidedTourOverlay} from '@/components/guided-tour/ui/GuidedTourOverlay.tsx';
import {useGuidedTourRuntime} from '@/components/guided-tour/hooks/useGuidedTourRuntime.ts';
import type {GuidedTourRegistry} from '@/components/guided-tour/ports/types.ts';

interface GuidedTourHostProps {
  registry: GuidedTourRegistry;
}

export function GuidedTourHost({registry}: GuidedTourHostProps) {
  const {
    activeItem,
    targetRect,
    confirmCurrent,
  } = useGuidedTourRuntime(registry);

  const activeTour = activeItem?.tourId
    ? registry.tours.find((tour) => tour.id === activeItem.tourId)
    : null;
  const activeStepIndex = activeTour
    ? activeTour.steps.findIndex((step) => step.id === activeItem?.step.id)
    : -1;
  const tourProgress = activeTour && activeStepIndex >= 0
    ? {currentIndex: activeStepIndex, total: activeTour.steps.length}
    : null;

  return (
    <GuidedTourOverlay
      activeItem={activeItem}
      targetRect={targetRect}
      tourProgress={tourProgress}
      onConfirm={confirmCurrent}
    />
  );
}
