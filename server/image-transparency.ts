import sharp from 'sharp';

/**
 * Remove um fundo claro e conectado às bordas de um PNG. A geração de imagens
 * pode devolver pixels brancos mesmo quando o prompt pede transparência; esta
 * etapa determinística garante alpha real antes de publicar no Storage.
 */
export async function removeLightBackgroundFromPng(input: Buffer): Promise<Buffer> {
  const {data, info} = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {width, height, channels} = info;
  const pixelCount = width * height;
  const alpha = new Uint8Array(pixelCount).fill(255);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const seed = readRgb(data, 0, channels);
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(0, x, seed, data, channels, width, enqueue);
    if (height > 1) enqueueIfBackground(height - 1, x, seed, data, channels, width, enqueue);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(y, 0, seed, data, channels, width, enqueue);
    if (width > 1) enqueueIfBackground(y, width - 1, seed, data, channels, width, enqueue);
  }

  while (head < tail) {
    const index = queue[head++];
    alpha[index] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
      const nextIndex = nextY * width + nextX;
      if (visited[nextIndex]) continue;
      const nextRgb = readRgb(data, nextIndex, channels);
      if (isBackgroundRgb(nextRgb, seed)) {
        visited[nextIndex] = 1;
        queue[tail++] = nextIndex;
      }
    }
  }

  const output = Buffer.alloc(pixelCount * 4);
  for (let index = 0; index < pixelCount; index += 1) {
    const sourceOffset = index * channels;
    const outputOffset = index * 4;
    output[outputOffset] = data[sourceOffset] ?? 0;
    output[outputOffset + 1] = data[sourceOffset + 1] ?? 0;
    output[outputOffset + 2] = data[sourceOffset + 2] ?? 0;
    output[outputOffset + 3] = alpha[index] ?? 255;
  }

  return sharp(output, {raw: {width, height, channels: 4}}).png().toBuffer();
}

type Rgb = [number, number, number];

function readRgb(data: Buffer, index: number, channels: number): Rgb {
  const offset = index * channels;
  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
}

function enqueueIfBackground(
  y: number,
  x: number,
  seed: Rgb,
  data: Buffer,
  channels: number,
  width: number,
  enqueue: (x: number, y: number) => void,
): void {
  const index = y * width + x;
  if (isBackgroundRgb(readRgb(data, index, channels), seed)) enqueue(x, y);
}

function isBackgroundRgb(rgb: Rgb, seed: Rgb): boolean {
  const distance = Math.sqrt(rgb.reduce((sum, value, index) => sum + (value - seed[index]) ** 2, 0));
  const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
  const chroma = Math.max(...rgb) - Math.min(...rgb);
  return distance <= 78 && brightness >= 150 && chroma <= 125;
}
