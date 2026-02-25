import type {HouseElementsRepository} from "@/domain/repository/house-elements-repository.ts";
import {getDefaultElementsForHouseType} from "../use-cases/house-elements-use-cases.ts";
import {createElementId as createElementDomainId} from "../use-cases/house-identity-use-cases.ts";
import {HouseElement, HouseElementDraft, HouseTypeExcludeNull} from "@/shared/types/house.ts";

export function createElementId(
  now: () => number = Date.now,
  random: () => number = Math.random,
): string {
  return createElementDomainId(now, random);
}

export function addElement(
  repository: HouseElementsRepository<HouseElement>,
  element: HouseElementDraft,
  nextId: () => string = createElementId,
): HouseElement {

  const nextElement: HouseElement = {
    ...element,
    id: nextId(),
  };
  repository.setElements([...repository.getElements(), nextElement]);
  return nextElement;
}

export function removeElement(
  repository: HouseElementsRepository<HouseElement>,
  elementId: string,
): boolean {

  const current = repository.getElements();
  const next =
    current.filter((element) => element.id !== elementId);
  repository.setElements(next);
  return next.length !== current.length;
}

export function updateElement(
  repository: HouseElementsRepository<HouseElement>,
  elementId: string,
  updates: Partial<HouseElementDraft>,
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
  repository: HouseElementsRepository<HouseElement>,
  houseType: HouseTypeExcludeNull,
  nextId: () => string = createElementId,
): HouseElement[] {

  const next =
    getDefaultElementsForHouseType(houseType)
      .map((element) => ({
        ...element,
        id: nextId(),
      }));
  repository.setElements(next);
  return next;
}
