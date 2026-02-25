import {describe, expect, it} from 'vitest';
import {
  addElement,
  createElementId,
  removeElement,
  resetDefaultElements,
  updateElement,
  type HouseElement,
} from './house-elements-application.ts';
import type {HouseElementsRepository} from '@/domain/repository/house-elements-repository.ts';

function createRepository(
  initial: HouseElement[] = [],
): HouseElementsRepository<HouseElement> {
  let elements = [...initial];
  return {
    getElements: () => elements,
    setElements: (next) => {
      elements = next;
    },
  };
}

describe('house-elements application', () => {
  it('creates element ids with stable format', () => {
    const id = createElementId(
      () => 123,
      () => 0.123456789,
    );
    expect(id.startsWith('element_123_')).toBe(true);
  });

  it('adds, updates and removes elements through repository', () => {
    const repository = createRepository();

    const added = addElement(
      repository,
      {
        type: 'window',
        face: 'front',
        x: 1,
        y: 2,
        width: 3,
        height: 4,
      },
      () => 'element_fixed',
    );
    expect(added.id).toBe('element_fixed');
    expect(repository.getElements()).toHaveLength(1);

    expect(updateElement(repository, 'element_fixed', {x: 99})).toBe(true);
    expect(repository.getElements()[0].x).toBe(99);
    expect(updateElement(repository, 'missing', {x: 10})).toBe(false);

    expect(removeElement(repository, 'missing')).toBe(false);
    expect(removeElement(repository, 'element_fixed')).toBe(true);
    expect(repository.getElements()).toHaveLength(0);
  });

  it('resets default elements for each house type', () => {
    const repository = createRepository([
      {
        id: 'old',
        type: 'door',
        face: 'front',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ]);

    const ids = ['e1', 'e2', 'e3', 'e4', 'e5'];
    let idx = 0;
    const createdTipo6 = resetDefaultElements(repository, 'tipo6', () => ids[idx++]);
    expect(createdTipo6).toHaveLength(5);
    expect(repository.getElements()).toHaveLength(5);
    expect(repository.getElements().map((e) => e.id)).toEqual(ids);

    idx = 0;
    const createdTipo3 = resetDefaultElements(repository, 'tipo3', () => ids[idx++]);
    expect(createdTipo3).toHaveLength(4);
    expect(repository.getElements()).toHaveLength(4);
  });
});
