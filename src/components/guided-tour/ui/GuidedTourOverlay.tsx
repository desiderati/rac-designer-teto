import {type KeyboardEvent, useId, useLayoutEffect, useRef, useState} from 'react';
import {calculateGuidedTourLayout} from '@/components/guided-tour/lib/guided-tour-position.ts';
import type {GuidedTourActiveItem} from '@/components/guided-tour/ports/types.ts';

interface GuidedTourProgress {
  currentIndex: number;
  total: number;
}

interface GuidedTourOverlayProps {
  activeItem: GuidedTourActiveItem | null;
  targetRect: DOMRect | null;
  tourProgress?: GuidedTourProgress | null;
  onConfirm: () => void;
}

const DEFAULT_BALLOON_SIZE = {
  width: 260,
  height: 116,
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true');
}

export function GuidedTourOverlay({activeItem, targetRect, tourProgress, onConfirm}: GuidedTourOverlayProps) {
  const accessibleId = useId();
  const balloonRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const [balloonSize, setBalloonSize] = useState(DEFAULT_BALLOON_SIZE);
  const focusScopeKey = activeItem && targetRect
    ? `${activeItem.kind}:${activeItem.tourId ?? 'tip'}:${activeItem.step.id}`
    : null;

  useLayoutEffect(() => {
    const balloon = balloonRef.current;
    if (!balloon) return;
    const rect = balloon.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setBalloonSize({width: rect.width, height: rect.height});
    }
  }, [activeItem?.step.id, targetRect]);

  useLayoutEffect(() => {
    if (!focusScopeKey) return;
    const activeBalloon = balloonRef.current;
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    actionRef.current?.focus();

    return () => {
      const restorePreviousFocus = () => {
        if (previousActiveElement && document.contains(previousActiveElement)) {
          previousActiveElement.focus();
        }
      };

      restorePreviousFocus();

      window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (
          !activeBalloon?.contains(activeElement)
        ) {
          restorePreviousFocus();
        }
      }, 0);
    };
  }, [focusScopeKey]);

  function handleBalloonKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;

    const balloon = balloonRef.current;
    if (!balloon) return;

    const focusableElements = getFocusableElements(balloon);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (!firstFocusableElement || !lastFocusableElement) {
      event.preventDefault();
      balloon.focus();
      return;
    }

    if (focusableElements.length === 1) {
      event.preventDefault();
      firstFocusableElement.focus();
      return;
    }

    const activeElement = document.activeElement;
    if (event.shiftKey) {
      if (activeElement === firstFocusableElement || !balloon.contains(activeElement)) {
        event.preventDefault();
        lastFocusableElement.focus();
      }
      return;
    }

    if (activeElement === lastFocusableElement || !balloon.contains(activeElement)) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  }

  if (!activeItem || !targetRect) return null;

  const layout = calculateGuidedTourLayout({
    targetRect,
    balloonSize,
    placement: activeItem.step.placement,
    alignment: activeItem.step.alignment,
  });
  const shouldShowProgress = activeItem.kind === 'flow' && tourProgress && tourProgress.total > 1;
  const titleId = `${accessibleId}-title`;
  const descriptionId = `${accessibleId}-description`;
  const hasTitle = Boolean(activeItem.step.title);

  return (
    <div className='fixed inset-0 z-[1000]' aria-live='polite'>
      <div className='absolute inset-0 pointer-events-auto' aria-hidden='true' data-testid='guided-tour-click-blocker'/>

      <div
        data-testid='guided-tour-highlight'
        className='absolute rounded-xl ring-2 ring-amber-400 pointer-events-none'
        style={layout.highlightStyle}
      />

      <div
        ref={balloonRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : 'Dica do editor RAC'}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleBalloonKeyDown}
        className='absolute w-[240px] max-w-[calc(100vw-24px)] rounded-lg border border-amber-200 bg-amber-100 px-4 py-4 text-amber-950 shadow-md pointer-events-auto'
        style={layout.balloonStyle}
      >
        <div className={`${layout.arrowClassName} pointer-events-none`} style={layout.arrowStyle}/>
        {activeItem.step.title && (
          <h2 id={titleId} className='mb-1 text-sm font-bold leading-snug text-amber-900'>{activeItem.step.title}</h2>
        )}
        <p id={descriptionId} className='text-sm leading-snug text-amber-900'>{activeItem.step.text}</p>
        {shouldShowProgress && (
          <div
            className='mt-3 flex justify-center gap-1.5'
            aria-label={`Etapa ${tourProgress.currentIndex + 1} de ${tourProgress.total}`}
          >
            {Array.from({length: tourProgress.total}).map((_, index) => (
              <span
                key={`progress-${index}`}
                data-testid='guided-tour-progress-dot'
                className={
                  index === tourProgress.currentIndex
                    ? 'h-1.5 w-1.5 rounded-full bg-amber-500'
                    : 'h-1.5 w-1.5 rounded-full bg-amber-300'
                }
              />
            ))}
          </div>
        )}
        <div className='mt-3 flex justify-center'>
          <button
            ref={actionRef}
            type='button'
            onClick={onConfirm}
            className='rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold leading-none text-amber-950 shadow-sm transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:pointer-events-none'
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
