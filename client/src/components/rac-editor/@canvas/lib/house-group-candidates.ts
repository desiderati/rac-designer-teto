import type {CanvasGroup} from './canvas.ts';
import {isCanvasGroup} from './canvas.ts';

export function findTopViewGroupCandidate<T extends CanvasGroup>(objects: T[]): T | null {
  return objects.find((object) => isTopViewGroupCandidate(object)) ?? null;
}

export function isTopViewGroupCandidate(value: CanvasGroup): boolean {
  return isHouseGroupCandidate(value) && value?.houseView === 'top';
}

export function isHouseGroupCandidate(value: CanvasGroup): boolean {
  return isCanvasGroup(value) && value?.myType === 'house';
}

export function collectHouseGroupCandidates<T extends CanvasGroup>(objects: T[]): T[] {
  return objects.filter((object) => isHouseGroupCandidate(object));
}
