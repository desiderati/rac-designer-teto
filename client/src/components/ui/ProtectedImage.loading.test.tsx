import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import {ProtectedImage} from './ProtectedImage.tsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('exibe carregando enquanto a referência protegida aguarda autenticação', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    blob: async () => new Blob(['image'], {type: 'image/png'}),
  }));

  render(<ProtectedImage src='/manus-storage/house.png' alt='Foto da casa' className='h-10 w-10'/>);

  expect(screen.getByTestId('protected-image-loading-indicator')).toHaveAttribute('aria-label', expect.stringMatching(/^(Carregando|Reconectando) imagem$/));

  await waitFor(() => expect(screen.queryByTestId('protected-image-loading-indicator')).not.toBeInTheDocument());
});
