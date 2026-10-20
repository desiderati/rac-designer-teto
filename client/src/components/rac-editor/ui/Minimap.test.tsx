import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {MINIMAP} from '@/shared/config.ts';
import {Minimap} from './Minimap.tsx';

function setup(canvasWidth = 1667, canvasHeight = 1300, zoom = 1, viewportWidth = 400, viewportHeight = 300) {
  const onViewportChange = vi.fn();
  render(<Minimap canvasWidth={canvasWidth} canvasHeight={canvasHeight}
    viewportWidth={viewportWidth} viewportHeight={viewportHeight}
    viewportX={100000} viewportY={100000} zoom={zoom} onViewportChange={onViewportChange}/>);
  const map = screen.getByTestId('rac-minimap');
  const scene = map.firstElementChild as HTMLElement;
  const viewport = scene.lastElementChild as HTMLElement;
  Object.defineProperties(map, {clientLeft: {value: 1}, clientTop: {value: 1}});
  map.getBoundingClientRect = () => ({left: 100, top: 50,
    width: parseFloat(scene.style.width) + 2, height: parseFloat(scene.style.height) + 2}) as DOMRect;
  return {map, scene, viewport, onViewportChange};
}

describe('proporção e navegação do minimapa', () => {
  it.each([[1667, 1300], [1300, 1667]])('mantém a moldura na proporção %s × %s', (width, height) => {
    const {map, scene} = setup(width, height);
    const mapWidth = parseFloat(map.style.width);
    const mapHeight = parseFloat(map.style.height);
    expect(mapWidth / mapHeight).toBeCloseTo(width / height);
    expect(Math.max(mapWidth, mapHeight)).toBe(MINIMAP.size);
    expect(parseFloat(scene.style.width)).toBe(mapWidth);
    expect(parseFloat(scene.style.height)).toBe(mapHeight);
  });

  it('limita o retângulo de navegação à largura e à altura reais do minimapa', () => {
    const {scene, viewport} = setup();
    expect(parseFloat(viewport.style.left) + parseFloat(viewport.style.width)).toBeCloseTo(parseFloat(scene.style.width));
    expect(parseFloat(viewport.style.top) + parseFloat(viewport.style.height)).toBeCloseTo(parseFloat(scene.style.height));
  });

  it('limita a viewport quando a área visível é maior que o Canvas', () => {
    const {scene, viewport} = setup(1667, 1300, 1, 2000, 2000);
    expect(parseFloat(viewport.style.width)).toBeCloseTo(parseFloat(scene.style.width));
    expect(parseFloat(viewport.style.height)).toBeCloseTo(parseFloat(scene.style.height));
    expect(viewport.style.left).toBe('0px');
    expect(viewport.style.top).toBe('0px');
  });

  it('mapeia o clique no centro e no limite com zoom, descontando a borda', () => {
    const {map, scene, onViewportChange} = setup(1667, 1300, 2);
    fireEvent.click(map, {clientX: 101 + parseFloat(scene.style.width) / 2,
      clientY: 51 + parseFloat(scene.style.height) / 2});
    expect(onViewportChange.mock.lastCall?.[0]).toBeCloseTo(1667 - 200);
    expect(onViewportChange.mock.lastCall?.[1]).toBeCloseTo(1300 - 150);
    fireEvent.click(map, {clientX: 101 + parseFloat(scene.style.width),
      clientY: 51 + parseFloat(scene.style.height)});
    expect(onViewportChange.mock.lastCall?.[0]).toBeCloseTo(1667 * 2 - 400);
    expect(onViewportChange.mock.lastCall?.[1]).toBeCloseTo(1300 * 2 - 300);
  });

  it('usa a mesma projeção proporcional no toque', () => {
    const {map, scene, onViewportChange} = setup();
    fireEvent.touchStart(map, {touches: [{clientX: 101 + parseFloat(scene.style.width) / 2,
      clientY: 51 + parseFloat(scene.style.height) / 2}]});
    expect(onViewportChange.mock.lastCall?.[0]).toBeCloseTo(1667 / 2 - 200);
    expect(onViewportChange.mock.lastCall?.[1]).toBeCloseTo(1300 / 2 - 150);
    fireEvent.touchEnd(window);
  });
});
