import {describe, expect, it} from 'vitest';
import type {CanvasObject} from './canvas.ts';
import {recoverCanvasObjects} from './recover-canvas-objects.ts';

function objectAt(left: number, top: number, width = 100, height = 60): CanvasObject {
  const object = {
    left, top, width, height, scaleX: 1, scaleY: 1,
    set(patch: Record<string, number>) { Object.assign(this, patch); },
    setCoords() {},
    getBoundingRect() {
      return {left: this.left, top: this.top, width: this.width * this.scaleX, height: this.height * this.scaleY};
    },
  };
  return object as unknown as CanvasObject;
}

describe('recuperação de objetos recortados no canvas', () => {
  it('não modifica documento de casa bloqueada para edição', () => {
    const outside = objectAt(1450, -200);
    expect(recoverCanvasObjects([outside], 1000, 800, true)).toBe(0);
    expect(outside.getBoundingRect()).toMatchObject({left: 1450, top: -200});
  });
  it('recoloca objetos fora dos limites físicos e conserva os demais', () => {
    const outside = objectAt(1450, -200);
    const inside = objectAt(5, 5);
    const recovered = recoverCanvasObjects([outside, inside], 1000, 800);
    expect(recovered).toBe(1);
    expect(outside.getBoundingRect()).toMatchObject({left: 876, top: 24});
    expect(inside.getBoundingRect()).toMatchObject({left: 5, top: 5});
  });

  it('reduz objeto maior que a área lógica para torná-lo selecionável', () => {
    const large = objectAt(-1200, 900, 2500, 1200);
    expect(recoverCanvasObjects([large], 1000, 800)).toBe(1);
    const bounds = large.getBoundingRect();
    expect(bounds.left).toBeGreaterThanOrEqual(24);
    expect(bounds.top).toBeGreaterThanOrEqual(24);
    expect(bounds.left + bounds.width).toBeLessThan(976.001);
    expect(bounds.top + bounds.height).toBeLessThan(776.001);
  });

  it('traz só os objetos totalmente invisíveis à viewport sem mover os já visíveis', () => {
    const visible = objectAt(250, 180, 90, 60);
    const partial = objectAt(390, 180, 90, 60);
    const outside = objectAt(780, 550, 90, 60);
    const originalVisible = {...visible.getBoundingRect()};
    const originalPartial = {...partial.getBoundingRect()};

    expect(recoverCanvasObjects([visible, partial, outside], 1000, 800, false, {
      left: 200, top: 150, width: 240, height: 180,
    })).toBe(1);
    expect(visible.getBoundingRect()).toEqual(originalVisible);
    expect(partial.getBoundingRect()).toEqual(originalPartial);
    const moved = outside.getBoundingRect();
    expect(moved.left).toBeGreaterThanOrEqual(200);
    expect(moved.left + moved.width).toBeLessThanOrEqual(440);
    expect(moved.top).toBeGreaterThanOrEqual(150);
    expect(moved.top + moved.height).toBeLessThanOrEqual(330);
  });

  it('preserva a escala de elemento grande ao localizá-lo na viewport', () => {
    const large = objectAt(1200, 900, 800, 650);
    expect(recoverCanvasObjects([large], 1000, 800, false, {
      left: 200, top: 150, width: 240, height: 180,
    })).toBe(1);
    expect(large.scaleX).toBe(1);
    expect(large.scaleY).toBe(1);
    expect(large.getBoundingRect().left).toBeLessThan(440);
    expect(large.getBoundingRect().top).toBeLessThan(330);
  });
});
