import {describe, expect, it} from 'vitest';
import {getRadialMenuPositions} from './radial-menu-layout.ts';

describe('espaçamento dos menus radiais', () => {
  it.each([320, 400, 402, 408, 420])('preserva curva e folga entre os itens na altura %i', height => {
    const root = getRadialMenuPositions(8, 'left', height);
    const rootRadius = Math.hypot(root[0].x, root[0].y);
    for (const count of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const positions = getRadialMenuPositions(count, 'left', height);
      const right = getRadialMenuPositions(count, 'right', height);
      positions.forEach((position, i) => {
        if (count < 5) expect(Math.hypot(position.x, position.y)).toBeLessThan(rootRadius);
        expect(Math.hypot(position.x, position.y)).toBeGreaterThanOrEqual(46);
        expect(Math.abs(position.y) + 22).toBeLessThanOrEqual(height / 2);
        expect(right[i].x).toBe(-position.x);
        expect(right[i].y).toBe(position.y);
        expect(Math.hypot(position.x, position.y)).toBeCloseTo(Math.hypot(positions[0].x, positions[0].y));
        positions.slice(i + 1).forEach(other => {
          expect(Math.hypot(position.x - other.x, position.y - other.y)).toBeGreaterThanOrEqual(50 - 1e-6);
        });
      });
    }
  });

  it('mantém os grupos aprovados de duas e três opções', () => {
    const pixels = (count: number) => getRadialMenuPositions(count, 'left', 420)
      .map(({x, y}) => [Math.round(x), Math.round(y)]);
    expect(pixels(2)).toEqual([[34, -59], [34, 59]]);
    expect(pixels(3)).toEqual([[42, -73], [84, 0], [42, 73]]);
  });

  it('traz os intermediários para a esquerda mantendo os extremos alinhados e o semicírculo', () => {
    const positions = getRadialMenuPositions(4, 'left', 420);
    expect(positions[0].x).toBe(0);
    expect(positions[3].x).toBe(0);
    expect(positions[1].x).toBeLessThan(94);
    expect(positions[2].x).toBeCloseTo(positions[1].x);
    const mainMenu = getRadialMenuPositions(8, 'left', 420);
    expect(Math.max(...mainMenu.map(position => position.x))).toBeLessThan(155);
  });
});
