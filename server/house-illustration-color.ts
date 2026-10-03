import sharp from 'sharp';

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

const MIN_MASK_PIXELS = 24;

/**
 * Recolore somente os pixels que correspondem às paredes no render de referência.
 *
 * O prompt é uma restrição útil, mas não é determinístico: modelos de imagem podem
 * reinterpretar uma parede terracota como azulada, por exemplo. O render WebGL é a
 * fonte de verdade da cor; por isso usamos sua distribuição cromática como máscara
 * e transferimos o matiz/saturação para a ilustração, preservando luz e sombras.
 */
export async function preserveWallColorInIllustration(
  generatedPng: Buffer,
  sourceRenderPng: Buffer,
  wallColor: string,
): Promise<Buffer> {
  const targetRgb = parseHexColor(wallColor);
  if (!targetRgb) return generatedPng;

  const [{data: generatedData, info: generatedInfo}, sourceImage] = await Promise.all([
    sharp(generatedPng).ensureAlpha().raw().toBuffer({resolveWithObject: true}),
    sharp(sourceRenderPng)
      .ensureAlpha()
      .resize({width: 1, height: 1, fit: 'fill'})
      .metadata(),
  ]);

  if (!generatedInfo.width || !generatedInfo.height || !sourceImage.width || !sourceImage.height) {
    return generatedPng;
  }

  const sourceData = await sharp(sourceRenderPng)
    .ensureAlpha()
    .resize({width: generatedInfo.width, height: generatedInfo.height, fit: 'fill'})
    .raw()
    .toBuffer();

  const targetHsl = rgbToHsl(targetRgb[0], targetRgb[1], targetRgb[2]);
  const output = Buffer.from(generatedData);
  let maskedPixels = 0;

  for (let index = 0; index < generatedInfo.width * generatedInfo.height; index += 1) {
    const sourceOffset = index * 4;
    const generatedOffset = index * 4;
    const generatedAlpha = output[generatedOffset + 3] ?? 0;
    if (generatedAlpha === 0) continue;

    const sourceHsl = rgbToHsl(
      sourceData[sourceOffset] ?? 0,
      sourceData[sourceOffset + 1] ?? 0,
      sourceData[sourceOffset + 2] ?? 0,
    );
    if (!isWallMaskPixel(sourceHsl, targetHsl)) continue;

    const generatedHsl = rgbToHsl(
      output[generatedOffset] ?? 0,
      output[generatedOffset + 1] ?? 0,
      output[generatedOffset + 2] ?? 0,
    );
    if (generatedHsl.lightness < 0.08) continue;

    const transferred = hslToRgb(
      targetHsl.hue,
      targetHsl.saturation === 0 ? 0 : Math.max(targetHsl.saturation * 0.82, generatedHsl.saturation * 0.42),
      generatedHsl.lightness,
    );
    output[generatedOffset] = transferred[0];
    output[generatedOffset + 1] = transferred[1];
    output[generatedOffset + 2] = transferred[2];
    maskedPixels += 1;
  }

  // Não altera a imagem se a referência não forneceu uma máscara confiável.
  // Nesse caso, o resultado original da IA é menos arriscado do que uma recoloração
  // que poderia atingir céu, grama ou telhado.
  if (maskedPixels < MIN_MASK_PIXELS) return generatedPng;

  return sharp(output, {
    raw: {
      width: generatedInfo.width,
      height: generatedInfo.height,
      channels: 4,
    },
  }).png().toBuffer();
}

function parseHexColor(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function isWallMaskPixel(source: HslColor, target: HslColor): boolean {
  const hueDistance = circularDistance(source.hue, target.hue);
  const targetIsChromatic = target.saturation >= 0.16;

  if (targetIsChromatic) {
    return hueDistance <= 34
      && source.saturation >= Math.max(0.12, target.saturation * 0.34)
      && source.lightness >= 0.1
      && source.lightness <= 0.9;
  }

  // Para cinza/branco, a distância cromática é mais informativa que o matiz.
  // O limite de luminosidade exclui o fundo claro mais comum do render WebGL.
  return source.saturation <= 0.2
    && source.lightness >= 0.18
    && source.lightness <= 0.88;
}

function circularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function rgbToHsl(red: number, green: number, blue: number): HslColor {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return {hue: 0, saturation: 0, lightness};

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;

  return {hue, saturation, lightness};
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const normalizedHue = ((hue % 360) + 360) % 360 / 60;
  const secondary = chroma * (1 - Math.abs((normalizedHue % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 1) [red, green, blue] = [chroma, secondary, 0];
  else if (normalizedHue < 2) [red, green, blue] = [secondary, chroma, 0];
  else if (normalizedHue < 3) [red, green, blue] = [0, chroma, secondary];
  else if (normalizedHue < 4) [red, green, blue] = [0, secondary, chroma];
  else if (normalizedHue < 5) [red, green, blue] = [secondary, 0, chroma];
  else [red, green, blue] = [chroma, 0, secondary];

  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}
