import type {CSSProperties} from 'react';
import type {GuidedTourAlignment, GuidedTourPlacement} from '@/components/guided-tour/ports/types.ts';

export interface GuidedTourLayout {
  balloonStyle: CSSProperties;
  arrowStyle: CSSProperties;
  arrowClassName: string;
  highlightStyle: CSSProperties;
}

interface CalculateGuidedTourLayoutArgs {
  targetRect: DOMRect;
  balloonSize: {
    width: number;
    height: number;
  };
  placement: GuidedTourPlacement;
  alignment: GuidedTourAlignment;
  gap?: number;
  viewportPadding?: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function alignVertical(targetRect: DOMRect, balloonHeight: number, alignment: GuidedTourAlignment): number {
  if (alignment === 'top') return targetRect.top;
  if (alignment === 'bottom') return targetRect.bottom - balloonHeight;
  return targetRect.top + targetRect.height / 2 - balloonHeight / 2;
}

function alignHorizontal(targetRect: DOMRect, balloonWidth: number, alignment: GuidedTourAlignment): number {
  if (alignment === 'left') return targetRect.left;
  if (alignment === 'right') return targetRect.right - balloonWidth;
  return targetRect.left + targetRect.width / 2 - balloonWidth / 2;
}

export function calculateGuidedTourLayout({
  targetRect,
  balloonSize,
  placement,
  alignment,
  gap = 24,
  viewportPadding = 12,
}: CalculateGuidedTourLayoutArgs): GuidedTourLayout {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  let left = targetRect.left;
  let top = targetRect.top;

  if (placement === 'left') {
    left = targetRect.left - balloonSize.width - gap;
    top = alignVertical(targetRect, balloonSize.height, alignment);
  }
  if (placement === 'right') {
    left = targetRect.right + gap;
    top = alignVertical(targetRect, balloonSize.height, alignment);
  }
  if (placement === 'top') {
    left = alignHorizontal(targetRect, balloonSize.width, alignment);
    top = targetRect.top - balloonSize.height - gap;
  }
  if (placement === 'bottom') {
    left = alignHorizontal(targetRect, balloonSize.width, alignment);
    top = targetRect.bottom + gap;
  }

  const clampedLeft = clamp(left, viewportPadding, viewportWidth - balloonSize.width - viewportPadding);
  const clampedTop = clamp(top, viewportPadding, viewportHeight - balloonSize.height - viewportPadding);
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const arrowX = clamp(targetCenterX - clampedLeft, 18, balloonSize.width - 18);
  const arrowY = clamp(targetCenterY - clampedTop, 18, balloonSize.height - 18);

  const arrowBase = {
    position: 'absolute',
    width: 0,
    height: 0,
  } satisfies CSSProperties;

  let arrowStyle: CSSProperties = arrowBase;
  let arrowClassName = '';

  if (placement === 'left') {
    arrowClassName = 'border-y-8 border-l-8 border-y-transparent border-l-amber-100';
    arrowStyle = {...arrowBase, right: -8, top: arrowY, transform: 'translateY(-50%)'};
  }
  if (placement === 'right') {
    arrowClassName = 'border-y-8 border-r-8 border-y-transparent border-r-amber-100';
    arrowStyle = {...arrowBase, left: -8, top: arrowY, transform: 'translateY(-50%)'};
  }
  if (placement === 'top') {
    arrowClassName = 'border-x-8 border-t-8 border-x-transparent border-t-amber-100';
    arrowStyle = {...arrowBase, bottom: -8, left: arrowX, transform: 'translateX(-50%)'};
  }
  if (placement === 'bottom') {
    arrowClassName = 'border-x-8 border-b-8 border-x-transparent border-b-amber-100';
    arrowStyle = {...arrowBase, top: -8, left: arrowX, transform: 'translateX(-50%)'};
  }

  return {
    balloonStyle: {left: clampedLeft, top: clampedTop},
    arrowStyle,
    arrowClassName,
    highlightStyle: {
      left: targetRect.left - 6,
      top: targetRect.top - 6,
      width: targetRect.width + 12,
      height: targetRect.height + 12,
      boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.38), 0 10px 24px rgba(15, 23, 42, 0.18)',
    },
  };
}
