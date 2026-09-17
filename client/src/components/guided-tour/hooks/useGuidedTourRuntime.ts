import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  isGuidedTourCompleted,
  isGuidedTourTipShown,
  markGuidedTourCompleted,
  markGuidedTourTipShown,
  resetGuidedTourProgress,
} from '@/components/guided-tour/store/guided-tour-storage.ts';
import {getVisibleTargetRect} from '@/components/guided-tour/lib/guided-tour-targets.ts';
import type {
  GuidedTourActiveItem,
  GuidedTourDefinition,
  GuidedTourRegistry,
  GuidedTourStep,
  GuidedTourTip,
} from '@/components/guided-tour/ports/types.ts';

interface GuidedTourEventRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface GuidedTourEventDetail {
  kind?: string;
  rect?: GuidedTourEventRect;
  targets?: Record<string, GuidedTourEventRect>;
}

function findStep(tour: GuidedTourDefinition, stepId: string): GuidedTourStep | null {
  return tour.steps.find((step) => step.id === stepId) ?? null;
}

function toDOMRect(rect: GuidedTourEventRect): DOMRect {
  return new DOMRect(rect.left, rect.top, rect.width, rect.height);
}

function toDOMRectMap(targets: Record<string, GuidedTourEventRect>): Record<string, DOMRect> {
  return Object.fromEntries(
    Object.entries(targets).map(([targetId, rect]) => [targetId, toDOMRect(rect)]),
  );
}

function hasGuidedTourEventKind(value: unknown): value is GuidedTourEventDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as GuidedTourEventDetail;
  return typeof detail.kind === 'string';
}

function isGuidedTourTipEventDetail(value: unknown): value is GuidedTourEventDetail & {rect: GuidedTourEventRect} {
  if (!hasGuidedTourEventKind(value)) return false;
  const detail = value;
  const rect = detail.rect;
  return Boolean(rect)
    && typeof rect?.left === 'number'
    && typeof rect.top === 'number'
    && typeof rect.width === 'number'
    && typeof rect.height === 'number';
}

function isGuidedTourFlowEventDetail(
  value: unknown,
): value is GuidedTourEventDetail & {targets: Record<string, GuidedTourEventRect>} {
  if (!hasGuidedTourEventKind(value)) return false;
  const targets = value.targets;
  if (!targets || typeof targets !== 'object') return false;

  return Object.values(targets).every((rect) => (
    typeof rect?.left === 'number'
    && typeof rect.top === 'number'
    && typeof rect.width === 'number'
    && typeof rect.height === 'number'
  ));
}

export function useGuidedTourRuntime(registry: GuidedTourRegistry) {
  const [activeItem, setActiveItem] = useState<GuidedTourActiveItem | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dynamicTargetRects, setDynamicTargetRects] = useState<Record<string, DOMRect>>({});
  const [observerVersion, setObserverVersion] = useState(0);

  const tourById = useMemo(
    () => new Map(registry.tours.map((tour) => [tour.id, tour])),
    [registry.tours],
  );

  const startTour = useCallback((tourId: string, force = false) => {
    const tour = tourById.get(tourId);
    if (!tour) return;
    if (!force && isGuidedTourCompleted(tour)) return;

    if (force) {
      resetGuidedTourProgress(tour, registry.tips);
    }

    const firstStep = findStep(tour, tour.initialStepId);
    if (firstStep) {
      setActiveItem({kind: 'flow', tourId: tour.id, step: firstStep});
    }
  }, [registry.tips, tourById]);

  useEffect(() => {
    const tour = registry.tours.find((candidate) => candidate.autoStart && !isGuidedTourCompleted(candidate));
    if (tour) {
      startTour(tour.id);
    }
  }, [registry.tours, startTour]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const startElement = target.closest<HTMLElement>('[data-guided-tour-start]');
      if (startElement?.dataset.guidedTourStart) {
        startTour(startElement.dataset.guidedTourStart, true);
        return;
      }

      const tip = registry.tips.find((candidate) => {
        if (!candidate.triggerSelector) return false;
        if (isGuidedTourTipShown(candidate.persistKey)) return false;
        return Boolean(target.closest(candidate.triggerSelector));
      });

      if (tip?.targetId) {
        const rectBeforeReactHandlers = getVisibleTargetRect(tip.targetId);
        setTargetRect(rectBeforeReactHandlers);
        setActiveItem({kind: 'tip', step: tip, targetRect: rectBeforeReactHandlers});
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [registry.tips, startTour]);

  useEffect(() => {
    const eventNames = Array.from(
      new Set([
        ...registry.tours.flatMap((tour) => tour.triggerEvent?.name ? [tour.triggerEvent.name] : []),
        ...registry.tips.flatMap((tip) => tip.triggerEvent?.name ? [tip.triggerEvent.name] : []),
      ]),
    );
    if (eventNames.length === 0) return;

    const handleGuidedTourEvent = (event: Event) => {
      if (!(event instanceof CustomEvent) || !hasGuidedTourEventKind(event.detail)) return;

      const tour = registry.tours.find((candidate) => {
        if (!candidate.triggerEvent) return false;
        if (candidate.triggerEvent.name !== event.type) return false;
        if (candidate.triggerEvent.objectKind && candidate.triggerEvent.objectKind !== event.detail.kind) return false;
        return candidate.triggerEvent.replayWhenCompleted || !isGuidedTourCompleted(candidate);
      });
      if (tour && isGuidedTourFlowEventDetail(event.detail)) {
        const firstStep = findStep(tour, tour.initialStepId);
        if (!firstStep) return;

        setDynamicTargetRects(toDOMRectMap(event.detail.targets));
        setActiveItem({kind: 'flow', tourId: tour.id, step: firstStep});
        return;
      }

      if (!isGuidedTourTipEventDetail(event.detail)) return;

      const tip = registry.tips.find((candidate) => {
        if (!candidate.triggerEvent) return false;
        if (candidate.triggerEvent.name !== event.type) return false;
        if (candidate.triggerEvent.objectKind !== event.detail.kind) return false;
        return !isGuidedTourTipShown(candidate.persistKey);
      });
      if (!tip) return;

      const eventRect = toDOMRect(event.detail.rect);
      setTargetRect(eventRect);
      setActiveItem({kind: 'tip', step: tip, targetRect: eventRect});
    };

    eventNames.forEach((eventName) => document.addEventListener(eventName, handleGuidedTourEvent));
    return () => eventNames.forEach((eventName) => document.removeEventListener(eventName, handleGuidedTourEvent));
  }, [registry.tips, registry.tours]);

  useEffect(() => {
    const notify = () => setObserverVersion((version) => version + 1);
    const resizeObserver = new ResizeObserver(notify);
    resizeObserver.observe(document.documentElement);
    const mutationObserver = new MutationObserver(notify);
    mutationObserver.observe(document.body, {attributes: true, childList: true, subtree: true});
    window.addEventListener('resize', notify);
    window.addEventListener('scroll', notify, true);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', notify);
      window.removeEventListener('scroll', notify, true);
    };
  }, []);

  useEffect(() => {
    if (activeItem) return;

    const passiveTip = registry.tips.find((candidate) => {
      if (!candidate.targetId || candidate.triggerSelector || candidate.triggerEvent) return false;
      if (isGuidedTourTipShown(candidate.persistKey)) return false;
      return Boolean(getVisibleTargetRect(candidate.targetId));
    });
    if (!passiveTip?.targetId) return;

    const passiveTargetRect = getVisibleTargetRect(passiveTip.targetId);
    if (!passiveTargetRect) return;

    setTargetRect(passiveTargetRect);
    setActiveItem({kind: 'tip', step: passiveTip, targetRect: passiveTargetRect});
  }, [activeItem, observerVersion, registry.tips]);

  useEffect(() => {
    if (!activeItem) {
      setTargetRect(null);
      return;
    }

    if (activeItem.kind === 'tip' && activeItem.targetRect) {
      setTargetRect(activeItem.targetRect);
      return;
    }

    const dynamicTargetRect = activeItem.step.targetId ? dynamicTargetRects[activeItem.step.targetId] : null;
    setTargetRect(dynamicTargetRect ?? (activeItem.step.targetId ? getVisibleTargetRect(activeItem.step.targetId) ?? null : null));
  }, [activeItem, dynamicTargetRects, observerVersion]);

  const confirmCurrent = useCallback(() => {
    if (!activeItem) return;

    if (activeItem.kind === 'tip') {
      markGuidedTourTipShown((activeItem.step as GuidedTourTip).persistKey);
      setActiveItem(null);
      return;
    }

    const tour = activeItem.tourId ? tourById.get(activeItem.tourId) : null;
    const step = activeItem.step as GuidedTourStep;
    if (!tour || !step.next) {
      if (tour) markGuidedTourCompleted(tour);
      setActiveItem(null);
      return;
    }

    const nextStep = findStep(tour, step.next);
    if (!nextStep) {
      markGuidedTourCompleted(tour);
      setActiveItem(null);
      return;
    }

    setActiveItem({kind: 'flow', tourId: tour.id, step: nextStep});
  }, [activeItem, tourById]);

  return {
    activeItem,
    targetRect,
    confirmCurrent,
  };
}
