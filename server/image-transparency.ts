import sharp from 'sharp';

/**
 * Remove um fundo claro e conectado às bordas de um PNG. A geração de imagens
 * pode devolver pixels brancos mesmo quando o prompt pede transparência; esta
 * etapa determinística garante alpha real antes de publicar no Storage.
 *
 * A máscara trata cores cromáticas como parte do objeto. Isso é importante para
 * terrenos verdes e paredes azuladas que, em imagens com iluminação suave,
 * podem ser confundidos com o fundo claro pela flood fill.
 */
export async function removeLightBackgroundFromPng(input: Buffer): Promise<Buffer> {
  const {data, info} = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {width, height, channels} = info;
  const pixelCount = width * height;
  const alpha = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    alpha[index] = channels >= 4 ? data[index * channels + 3] ?? 255 : 255;
  }
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

  // A generated subject can carry partial alpha even when its RGB clearly
  // identifies grass, walls, roof, wood or linework. Keep those pixels solid.
  for (let index = 0; index < pixelCount; index += 1) {
    if (isLikelySubjectRgb(readRgb(data, index, channels))) alpha[index] = 255;
  }
  fillEnclosedTransparentRegions(alpha, width, height);

  const output = Buffer.alloc(pixelCount * 4);
  for (let index = 0; index < pixelCount; index += 1) {
    const sourceOffset = index * channels;
    const outputOffset = index * 4;
    output[outputOffset] = data[sourceOffset] ?? 0;
    output[outputOffset + 1] = data[sourceOffset + 1] ?? 0;
    output[outputOffset + 2] = data[sourceOffset + 2] ?? 0;
    const sourceAlpha = channels >= 4 ? data[sourceOffset + 3] ?? 255 : 255;
    output[outputOffset + 3] = alpha[index] ?? sourceAlpha;
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
  if (isLikelySubjectRgb(rgb)) return false;

  const distance = Math.sqrt(rgb.reduce((sum, value, index) => sum + (value - seed[index]) ** 2, 0));
  const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
  const chroma = Math.max(...rgb) - Math.min(...rgb);
  // Generated backgrounds are often a light-blue/cream gradient rather than
  // a flat color. Keep the flood fill conservative: only light, low-chroma
  // pixels connected to the edge are eligible, so white doors/windows inside
  // the house remain intact when surrounded by linework.
  const lightNeutral = brightness >= 172 && chroma <= 145 && distance <= 138;
  const closeToSeed = distance <= 118 && brightness >= 145 && chroma <= 155;
  return lightNeutral || closeToSeed;
}

function isLikelySubjectRgb([red, green, blue]: Rgb): boolean {
  const brightness = (red + green + blue) / 3;
  if (brightness >= 226) return false;

  const grassOrVegetation = green >= red + 12 && green >= blue + 18;
  const blueWallOrShadow = blue >= red + 12 && blue >= green + 8;
  const warmRoofOrWood = red >= green + 18 && red >= blue + 18;
  return grassOrVegetation || blueWallOrShadow || warmRoofOrWood;
}

function fillEnclosedTransparentRegions(alpha: Uint8Array, width: number, height: number): void {
  const visited = new Uint8Array(alpha.length);
  const component = new Int32Array(alpha.length);
  const neighbors = (index: number) => {
    const x = index % width;
    const y = Math.floor(index / width);
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const;
  };

  for (let start = 0; start < alpha.length; start += 1) {
    if (alpha[start] !== 0 || visited[start]) continue;

    let head = 0;
    let tail = 0;
    let touchesEdge = false;
    component[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const index = component[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;

      for (const [nextX, nextY] of neighbors(index)) {
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const nextIndex = nextY * width + nextX;
        if (visited[nextIndex] || alpha[nextIndex] !== 0) continue;
        visited[nextIndex] = 1;
        component[tail++] = nextIndex;
      }
    }

    if (!touchesEdge) {
      for (let index = 0; index < tail; index += 1) {
        alpha[component[index]] = 255;
      }
    }
  }
}
