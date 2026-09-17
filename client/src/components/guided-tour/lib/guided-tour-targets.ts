export function queryGuidedTourTarget(targetId: string): HTMLElement | null {
  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(targetId) : targetId;
  return getGuidedTourTargetCandidates(escaped)[0] ?? document.getElementById(targetId);
}

function getGuidedTourTargetCandidates(escapedTargetId: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(
    `[data-guided-tour-id="${escapedTargetId}"], [data-guided-tour-aliases~="${escapedTargetId}"]`,
  ));
}

export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
}

export function getVisibleTargetRect(targetId: string): DOMRect | null {
  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(targetId) : targetId;
  const targets = getGuidedTourTargetCandidates(escaped);
  const fallbackTarget = document.getElementById(targetId);
  if (fallbackTarget) targets.push(fallbackTarget);

  const visibleTarget = targets.find(isElementVisible);
  return visibleTarget?.getBoundingClientRect() ?? null;
}
