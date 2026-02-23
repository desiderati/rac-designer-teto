import type {DomainHouseType} from "./house-use-cases";
import type {HouseElementsRepository} from "./house-elements-repository";
import {getDefaultElementsForHouseType, type DomainHouseElementDraft} from "./house-elements-use-cases";
import {createElementId as createElementDomainId} from "./house-identity-use-cases";

export type DomainHouseElementRecord = DomainHouseElementDraft & { id: string };

export function createElementId(
  now: () => number = Date.now,
  random: () => number = Math.random,
): string {
  return createElementDomainId(now, random);
}

export function addElement(
  repository: HouseElementsRepository<DomainHouseElementRecord>,
  element: DomainHouseElementDraft,
  nextId: () => string = createElementId,
): DomainHouseElementRecord {
  const nextElement: DomainHouseElementRecord = {
    ...element,
    id: nextId(),
  };
  repository.setElements([...repository.getElements(), nextElement]);
  return nextElement;
}

export function removeElement(
  repository: HouseElementsRepository<DomainHouseElementRecord>,
  elementId: string,
): boolean {
  const current = repository.getElements();
  const next = current.filter((element) => element.id !== elementId);
  repository.setElements(next);
  return next.length !== current.length;
}

export function updateElement(
  repository: HouseElementsRepository<DomainHouseElementRecord>,
  elementId: string,
  updates: Partial<DomainHouseElementDraft>,
): boolean {
  const current = repository.getElements();
  const index = current.findIndex((element) => element.id === elementId);
  if (index === -1) return false;

  const next = [...current];
  next[index] = {
    ...next[index],
    ...updates,
  };
  repository.setElements(next);
  return true;
}

export function resetDefaultElements(
  repository: HouseElementsRepository<DomainHouseElementRecord>,
  houseType: DomainHouseType,
  nextId: () => string = createElementId,
): DomainHouseElementRecord[] {
  const next = getDefaultElementsForHouseType(houseType).map((element) => ({
    ...element,
    id: nextId(),
  }));
  repository.setElements(next);
  return next;
}
