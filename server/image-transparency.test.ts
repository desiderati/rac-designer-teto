import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import {removeLightBackgroundFromPng} from './image-transparency.ts';

describe('removeLightBackgroundFromPng', () => {
  it('converte o fundo claro conectado à borda em alpha sem remover a casa interna', async () => {
    const source = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: {r: 234, g: 241, b: 247, alpha: 1},
      },
    })
      .composite([{input: {create: {width: 4, height: 4, channels: 4, background: {r: 30, g: 99, b: 143, alpha: 1}}}, left: 3, top: 3}])
      .png()
      .toBuffer();

    const result = await removeLightBackgroundFromPng(source);
    const {data, info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];

    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(9, 9)).toBe(0);
    expect(alphaAt(5, 5)).toBe(255);
  });

  it('preserva transparência existente e remove uma variação clara conectada à borda', async () => {
    const width = 12;
    const height = 12;
    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const shade = 224 + Math.round((x + y) / 4);
        pixels[offset] = shade;
        pixels[offset + 1] = Math.min(255, shade + 5);
        pixels[offset + 2] = Math.min(255, shade + 10);
        pixels[offset + 3] = 255;
      }
    }

    const transparentOffset = (0 * width + 0) * 4;
    pixels[transparentOffset + 3] = 0;
    const houseOffset = (5 * width + 5) * 4;
    pixels[houseOffset] = 32;
    pixels[houseOffset + 1] = 98;
    pixels[houseOffset + 2] = 142;

    const source = await sharp(pixels, {raw: {width, height, channels: 4}}).png().toBuffer();
    const result = await removeLightBackgroundFromPng(source);
    const {data, info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];

    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(1, 1)).toBe(0);
    expect(alphaAt(5, 5)).toBe(255);
  });

  it('preserva pixels verdes do terreno mesmo quando eles tocam a borda', async () => {
    const width = 8;
    const height = 8;
    const pixels = Buffer.alloc(width * height * 4);
    for (let index = 0; index < width * height; index += 1) {
      const offset = index * 4;
      pixels[offset] = 234;
      pixels[offset + 1] = 241;
      pixels[offset + 2] = 247;
      pixels[offset + 3] = 255;
    }

    // O terreno toca a borda inferior; uma máscara baseada apenas em cor clara
    // não pode transformá-lo em transparência.
    for (let x = 1; x < width - 1; x += 1) {
      const offset = ((height - 1) * width + x) * 4;
      pixels[offset] = 150;
      pixels[offset + 1] = 188;
      pixels[offset + 2] = 92;
    }

    const result = await removeLightBackgroundFromPng(
      await sharp(pixels, {raw: {width, height, channels: 4}}).png().toBuffer(),
    );
    const {data, info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];

    expect(alphaAt(3, height - 1)).toBe(255);
    expect(alphaAt(0, 0)).toBe(0);
  });

  it('fecha buracos transparentes internos no objeto gerado', async () => {
    const width = 9;
    const height = 9;
    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        pixels[offset] = 40;
        pixels[offset + 1] = 110;
        pixels[offset + 2] = 160;
        pixels[offset + 3] = x >= 2 && x <= 6 && y >= 2 && y <= 6 && !(x === 4 && y === 4) ? 255 : 0;
      }
    }

    const result = await removeLightBackgroundFromPng(
      await sharp(pixels, {raw: {width, height, channels: 4}}).png().toBuffer(),
    );
    const {data, info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const centerOffset = (4 * info.width + 4) * info.channels + 3;

    expect(data[centerOffset]).toBe(255);
  });
});
