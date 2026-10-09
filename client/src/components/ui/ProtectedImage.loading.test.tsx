import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import {ProtectedImage} from './ProtectedImage.tsx';
import {clearProtectedImageCache} from '@/shared/lib/protected-image.ts';

afterEach(() => {
  cleanup();
  clearProtectedImageCache();
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

it('usa somente o spinner dentro de thumbnails redondos', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));

  render(<ProtectedImage src='/manus-storage/house.png' alt='Foto da casa' className='h-11 w-11 rounded-full object-cover'/>);

  const indicator = screen.getByTestId('protected-image-loading-indicator');
  expect(indicator).toHaveAttribute('aria-label', 'Carregando imagem');
  expect(indicator).not.toHaveTextContent('Carregando…');
  expect(indicator.parentElement).toHaveClass('overflow-hidden', 'rounded-full');
});
