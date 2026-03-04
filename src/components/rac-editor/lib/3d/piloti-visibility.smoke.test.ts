import {describe, expect, it} from 'vitest';
import {resolvePilotiHeightSegments} from '@/components/rac-editor/lib/3d/piloti-parser.ts';

describe('piloti visibility', () => {
  it('mantém altura nominal quando ocultação abaixo do terreno está desabilitada', () => {
    const resolved = resolvePilotiHeightSegments({
      nominalHeight: 120,
      minHeightToTouchTerrain: 30,
      hideBelowTerrain: false,
    });

    expect(resolved.visibleHeight).toBe(120);
    expect(resolved.topVisibleHeight).toBeCloseTo(40, 6);
    expect(resolved.bottomVisibleHeight).toBeCloseTo(80, 6);
  });

  it('mantém o topo com a proporção original quando recorte fica acima da fronteira de 1/3', () => {
    const resolved = resolvePilotiHeightSegments({
      nominalHeight: 120,
      minHeightToTouchTerrain: 30,
      hideBelowTerrain: true,
    });

    expect(resolved.visibleHeight).toBe(30);
    expect(resolved.topVisibleHeight).toBeCloseTo(30, 6);
    expect(resolved.bottomVisibleHeight).toBeCloseTo(0, 6);
  });

  it('preserva a transição para cinza no mesmo ponto do piloti completo', () => {
    const resolved = resolvePilotiHeightSegments({
      nominalHeight: 120,
      minHeightToTouchTerrain: 90,
      hideBelowTerrain: true,
    });

    expect(resolved.visibleHeight).toBe(90);
    expect(resolved.topVisibleHeight).toBeCloseTo(40, 6);
    expect(resolved.bottomVisibleHeight).toBeCloseTo(50, 6);
  });

  it('aplica piso mínimo de corte quando ocultação está habilitada', () => {
    const resolved = resolvePilotiHeightSegments({
      nominalHeight: 120,
      minHeightToTouchTerrain: 30,
      hideBelowTerrain: true,
      minVisibleHeightWhenHidden: 50,
    });

    expect(resolved.visibleHeight).toBe(50);
    expect(resolved.topVisibleHeight).toBeCloseTo(40, 6);
    expect(resolved.bottomVisibleHeight).toBeCloseTo(10, 6);
  });
});
