import {afterEach, expect, it, vi} from 'vitest';
import {generateHouseIllustrationFromDataUrl} from './house-illustration-generator.ts';

const mutate = vi.hoisted(() => vi.fn());
vi.mock('@/lib/trpc-client.ts', () => ({racTrpcClient: {storage: {
  generateHouseIllustration: {mutate},
}}}));
afterEach(() => vi.clearAllMocks());

it('encaminha o AbortSignal da geração ao transporte tRPC', async () => {
  mutate.mockResolvedValue({dataUrl: 'data:image/png;base64,art', url: null});
  const controller = new AbortController();
  const result = await generateHouseIllustrationFromDataUrl('data:image/png;base64,scene',
    {wallColor: '#123456', signal: controller.signal});
  expect(mutate).toHaveBeenCalledWith({base64: 'scene', wallColor: '#123456'}, {signal: controller.signal});
  expect(result?.dataUrl).toBe('data:image/png;base64,art');
});
