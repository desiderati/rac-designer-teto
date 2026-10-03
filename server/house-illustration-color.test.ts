import sharp from 'sharp';
import {describe, expect, it} from 'vitest';
import {preserveWallColorInIllustration} from './house-illustration-color.ts';

const WIDTH = 8;
const HEIGHT = 8;

async function solidPng(rgb: [number, number, number]): Promise<Buffer> {
  const pixel = [...rgb, 255];
  return sharp(Buffer.from(Array.from({length: WIDTH * HEIGHT}, () => pixel).flat()), {
    raw: {width: WIDTH, height: HEIGHT, channels: 4},
  }).png().toBuffer();
}

describe('preserveWallColorInIllustration', () => {
  it('transfere o matiz da parede do render para a saída azul da IA', async () => {
    const source = await solidPng([196, 150, 122]);
    const generated = await solidPng([126, 164, 205]);

    const corrected = await preserveWallColorInIllustration(generated, source, '#c4967a');
    const {data} = await sharp(corrected).raw().toBuffer({resolveWithObject: true});

    expect(data[0]).toBeGreaterThan(data[1]);
    expect(data[1]).toBeGreaterThan(data[2]);
    expect(data[0]).toBeCloseTo(196, -1);
  });

  it('mantém a saída original quando a cor informada não é hexadecimal válida', async () => {
    const source = await solidPng([196, 150, 122]);
    const generated = await solidPng([126, 164, 205]);

    await expect(preserveWallColorInIllustration(generated, source, 'terracota'))
      .resolves.toEqual(generated);
  });
});
