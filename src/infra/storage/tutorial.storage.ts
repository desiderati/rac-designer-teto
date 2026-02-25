const KEYS = {
  tutorialCompleted: 'rac-tutorial-completed',
  pilotiTutorialShown: 'rac-piloti-tutorial-shown',
  wallTipShown: 'rac-wall-tip-shown',
  lineTipShown: 'rac-line-tip-shown',
  arrowTipShown: 'rac-arrow-tip-shown',
  distanceTipShown: 'rac-distance-tip-shown',
} as const;

type TipKey = 'wall' | 'line' | 'arrow' | 'distance';

const TIP_TO_KEY: Record<TipKey, string> = {
  wall: KEYS.wallTipShown,
  line: KEYS.lineTipShown,
  arrow: KEYS.arrowTipShown,
  distance: KEYS.distanceTipShown,
};

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function setFlag(key: string, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // noop
  }
}

export function isTutorialCompleted(): boolean {
  return getFlag(KEYS.tutorialCompleted);
}

export function markTutorialCompleted(): void {
  setFlag(KEYS.tutorialCompleted, true);
}

export function isPilotiTutorialShown(): boolean {
  return getFlag(KEYS.pilotiTutorialShown);
}

export function markPilotiTutorialShown(): void {
  setFlag(KEYS.pilotiTutorialShown, true);
}

export function isOnboardingTipShown(tip: TipKey): boolean {
  return getFlag(TIP_TO_KEY[tip]);
}

export function markOnboardingTipShown(tip: TipKey): void {
  setFlag(TIP_TO_KEY[tip], true);
}

export function resetTutorialProgress(): void {
  Object.values(KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
  });
}
