import {describe, expect, it, vi} from 'vitest';
import {preparePdfHouseIllustration} from './pdf-house-illustration.ts';

describe('ilustração 3D do PDF', () => {
  it('usa a saída da porta IA e encaminha a cor da casa', async () => {
    const generateFromDataUrl = vi.fn().mockResolvedValue({dataUrl: 'data:image/png;base64,illustrated'});
    expect(await preparePdfHouseIllustration('data:image/png;base64,scene', '#112233', {generateFromDataUrl}))
      .toBe('data:image/png;base64,illustrated');
    expect(generateFromDataUrl).toHaveBeenCalledWith('data:image/png;base64,scene', {wallColor: '#112233'});
  });
  it.each([undefined, {generateFromDataUrl: vi.fn().mockResolvedValue(null)},
    {generateFromDataUrl: vi.fn().mockResolvedValue({dataUrl: 'https://invalid.test/image'})}])(
    'não entrega silenciosamente o 3D cru quando não há ilustração válida (%#)', async port => {
      await expect(preparePdfHouseIllustration('data:image/png;base64,scene', undefined, port)).rejects.toThrow('ilustração');
    });
});
