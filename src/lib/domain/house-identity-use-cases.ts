import type {DomainViewType} from "./house-use-cases";

export function createHouseId(now: () => number = Date.now): string {
  return `house_${now()}`;
}

export function createViewInstanceId(
  viewType: DomainViewType,
  now: () => number = Date.now,
): string {
  return `${viewType}_${now()}`;
}

export function createElementId(
  now: () => number = Date.now,
  random: () => number = Math.random,
): string {
  return `element_${now()}_${random().toString(36).substr(2, 9)}`;
}
