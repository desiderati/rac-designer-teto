import type {GuidedTourDefinition, GuidedTourTip} from '@/components/guided-tour/ports/types.ts';

type GuidedTourCompletionTarget = string | Pick<GuidedTourDefinition, 'persistKey' | 'storageRevision'>;

export const GUIDED_TOUR_COMPLETED_EVENT = 'guided-tour:completed';

const LEGACY_KEYS_BY_PERSIST_KEY: Record<string, string> = {
  'guided-tour:rac-editor-intro:completed': 'rac-tutorial-completed',
  'guided-tour:rac-tip:piloti': 'rac-piloti-tip-shown',
  'guided-tour:rac-tip:wall': 'rac-wall-tip-shown',
  'guided-tour:rac-tip:line': 'rac-line-tip-shown',
  'guided-tour:rac-tip:arrow': 'rac-arrow-tip-shown',
  'guided-tour:rac-tip:distance': 'rac-distance-tip-shown',
};

function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function getValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setFlag(key: string, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(key, 'true');
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function setValue(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function getPersistKey(target: GuidedTourCompletionTarget): string {
  return typeof target === 'string' ? target : target.persistKey;
}

function getStorageRevision(target: GuidedTourCompletionTarget): string | undefined {
  return typeof target === 'string' ? undefined : target.storageRevision;
}

function getStorageRevisionKey(persistKey: string): string {
  return `${persistKey}:revision`;
}

export function isGuidedTourCompleted(target: GuidedTourCompletionTarget): boolean {
  const persistKey = getPersistKey(target);
  const storageRevision = getStorageRevision(target);
  const legacyKey = LEGACY_KEYS_BY_PERSIST_KEY[persistKey];
  if (legacyKey && getFlag(legacyKey)) {
    setFlag(persistKey, true);
  }

  if (!getFlag(persistKey)) return false;
  if (!storageRevision) return true;

  if (getValue(getStorageRevisionKey(persistKey)) === storageRevision) return true;

  setFlag(persistKey, false);
  setValue(getStorageRevisionKey(persistKey), null);
  return false;
}

export function markGuidedTourCompleted(target: GuidedTourCompletionTarget): void {
  const persistKey = getPersistKey(target);
  const storageRevision = getStorageRevision(target);
  setFlag(persistKey, true);
  if (storageRevision) {
    setValue(getStorageRevisionKey(persistKey), storageRevision);
  }
  dispatchGuidedTourCompletedEvent(persistKey, storageRevision);
}

export function isGuidedTourTipShown(persistKey: string): boolean {
  const legacyKey = LEGACY_KEYS_BY_PERSIST_KEY[persistKey];
  if (legacyKey && getFlag(legacyKey)) {
    setFlag(persistKey, true);
    return true;
  }
  return getFlag(persistKey);
}

export function markGuidedTourTipShown(persistKey: string): void {
  setFlag(persistKey, true);
}

export function resetGuidedTourProgress(tour: GuidedTourDefinition, tips: GuidedTourTip[] = []): void {
  [tour.persistKey, LEGACY_KEYS_BY_PERSIST_KEY[tour.persistKey]].filter(Boolean).forEach((key) => setFlag(key, false));
  setValue(getStorageRevisionKey(tour.persistKey), null);
  tour.steps.forEach((step) => setFlag(step.persistKey, false));
  tips.forEach((tip) => {
    [tip.persistKey, LEGACY_KEYS_BY_PERSIST_KEY[tip.persistKey]].filter(Boolean).forEach((key) => setFlag(key, false));
  });
}

function dispatchGuidedTourCompletedEvent(persistKey: string, storageRevision?: string): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new CustomEvent(GUIDED_TOUR_COMPLETED_EVENT, {
    detail: {
      persistKey,
      storageRevision,
    },
  }));
}
