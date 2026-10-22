import {expect, type Locator} from '@playwright/test';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function expectBoundsContained(bounds: Bounds, container: Bounds, tolerance: number, label?: string) {
  const message = (edge: string) => label ? `${label}: margem ${edge}` : undefined;
  expect(bounds.x, message('esquerda')).toBeGreaterThanOrEqual(container.x - tolerance);
  expect(bounds.y, message('superior')).toBeGreaterThanOrEqual(container.y - tolerance);
  expect(bounds.x + bounds.width, message('direita')).toBeLessThanOrEqual(container.x + container.width + tolerance);
  expect(bounds.y + bounds.height, message('inferior')).toBeLessThanOrEqual(container.y + container.height + tolerance);
}

export function expectBoundsWithinViewport(bounds: Bounds, viewport: {width: number; height: number}, label?: string) {
  expectBoundsContained(bounds, {x: 0, y: 0, width: viewport.width, height: viewport.height}, 0, label);
}

/** Preserva a tolerância de 1 px usada nas relações de contenção das prévias PDF/3D. */
export async function expectContained(element: Locator, parent: Locator) {
  const bounds = await element.boundingBox();
  const container = await parent.boundingBox();
  expect(bounds).not.toBeNull();
  expect(container).not.toBeNull();
  expectBoundsContained(bounds!, container!, 1);
}

/** Bordas apenas encostadas não constituem sobreposição. */
export function boundsOverlap(first: Bounds, second: Bounds) {
  return first.x < second.x + second.width && first.x + first.width > second.x
    && first.y < second.y + second.height && first.y + first.height > second.y;
}
