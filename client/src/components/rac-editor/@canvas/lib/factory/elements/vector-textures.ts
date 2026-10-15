import type {TSimplePathData} from 'fabric';

export interface RachaoStoneLayout {
  left: number;
  top: number;
  radius: number;
  fill: string;
}

/**
 * Gera ondas Bézier no sistema de coordenadas local de um retângulo centrado.
 * Não acessa DOM, Canvas 2D, imagem ou Pattern: o resultado é serializável pelo Fabric.
 */
export function createWaterWavePathData(
  width: number,
  height: number,
  scale = 1,
): TSimplePathData {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const waveCount = 3;
  const amplitude = Math.min(5 * Math.max(scale, 0.1), safeHeight / 8);
  const wavelength = Math.max(20 * Math.max(scale, 0.1), 24);
  const left = -safeWidth / 2;
  const right = safeWidth / 2;
  const paths: TSimplePathData = [];

  for (let wave = 0; wave < waveCount; wave += 1) {
    const y = -safeHeight / 2 + (safeHeight / (waveCount + 1)) * (wave + 1);
    let x = left;
    paths.push(['M', x, y]);

    while (x < right) {
      const nextX = Math.min(right, x + wavelength);
      const span = nextX - x;
      paths.push([
        'C',
        x + span / 4,
        y - amplitude,
        x + (span * 3) / 4,
        y + amplitude,
        nextX,
        y,
      ]);
      x = nextX;
    }
  }

  return paths;
}

/** Gera segmentos diagonais já recortados aos limites do retângulo. */
export function createDiagonalStripePathData(
  width: number,
  height: number,
  spacing = 10,
): TSimplePathData {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeSpacing = Math.max(2, spacing);
  const halfWidth = safeWidth / 2;
  const halfHeight = safeHeight / 2;
  const path: TSimplePathData = [];
  const minIntercept = -(halfWidth + halfHeight);
  const maxIntercept = halfWidth + halfHeight;

  for (let intercept = minIntercept; intercept <= maxIntercept + 0.001; intercept += safeSpacing) {
    const intersections: Array<[number, number]> = [];
    const addIntersection = (x: number, y: number) => {
      if (x < -halfWidth - 0.001 || x > halfWidth + 0.001) return;
      if (y < -halfHeight - 0.001 || y > halfHeight + 0.001) return;
      if (intersections.some(([px, py]) => Math.abs(px - x) < 0.001 && Math.abs(py - y) < 0.001)) return;
      intersections.push([x, y]);
    };

    addIntersection(-halfWidth, halfWidth + intercept);
    addIntersection(halfWidth, -halfWidth + intercept);
    addIntersection(intercept + halfHeight, -halfHeight);
    addIntersection(intercept - halfHeight, halfHeight);

    if (intersections.length < 2) continue;
    intersections.sort(([leftX], [rightX]) => leftX - rightX);
    const [start, end] = intersections;
    path.push(['M', start[0], start[1]], ['L', end[0], end[1]]);
  }

  return path;
}

/** Gera as linhas divisórias da escada no sistema de coordenadas local. */
export function createStairStepPathData(
  width: number,
  height: number,
  steps: number,
  orientation: 'horizontal' | 'vertical',
): TSimplePathData {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeSteps = Math.max(2, Math.round(steps));
  const path: TSimplePathData = [];

  for (let index = 1; index < safeSteps; index += 1) {
    if (orientation === 'horizontal') {
      const y = -safeHeight / 2 + (safeHeight / safeSteps) * index;
      path.push(['M', -safeWidth / 2, y], ['L', safeWidth / 2, y]);
    } else {
      const x = -safeWidth / 2 + (safeWidth / safeSteps) * index;
      path.push(['M', x, -safeHeight / 2], ['L', x, safeHeight / 2]);
    }
  }

  return path;
}

/**
 * Gera a malha determinística de pedras do rachão sem rasterizar um tile.
 * Os offsets são locais ao retângulo centralizado que contém a camada.
 */
export function createRachaoStoneLayout(
  width: number,
  height: number,
  scale: number,
): RachaoStoneLayout[] {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const tileSize = Math.max(14, Math.round(28 * Math.max(scale, 0.1)));
  const palette = ['#6f5942', '#9f8770', '#7a624a', '#b19a82'];
  const stones: RachaoStoneLayout[] = [];

  const pattern = [
    [0.18, 0.25, 0.14, 0],
    [0.48, 0.15, 0.12, 1],
    [0.74, 0.33, 0.16, 2],
    [0.34, 0.62, 0.15, 3],
    [0.66, 0.68, 0.11, 0],
    [0.20, 0.80, 0.10, 1],
    [0.86, 0.80, 0.12, 3],
  ] as const;

  const columns = Math.ceil(safeWidth / tileSize);
  const rows = Math.ceil(safeHeight / tileSize);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      for (let stoneIndex = 0; stoneIndex < pattern.length; stoneIndex += 1) {
        const [relativeX, relativeY, relativeRadius, paletteIndex] = pattern[stoneIndex];
        const centerX = -safeWidth / 2 + column * tileSize + relativeX * tileSize;
        const centerY = -safeHeight / 2 + row * tileSize + relativeY * tileSize;
        const radius = relativeRadius * tileSize;
        if (centerX - radius < -safeWidth / 2 || centerX + radius > safeWidth / 2) continue;
        if (centerY - radius < -safeHeight / 2 || centerY + radius > safeHeight / 2) continue;
        stones.push({
          left: centerX,
          top: centerY,
          radius,
          fill: palette[paletteIndex],
        });
      }
    }
  }

  return stones;
}
