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
});
