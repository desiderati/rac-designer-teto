import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import {ProtectedImage} from './ProtectedImage.tsx';
import {clearProtectedImageCache} from '@/shared/lib/protected-image.ts';

afterEach(() => { cleanup(); clearProtectedImageCache(); vi.unstubAllGlobals(); });

it('só fornece pixels ao elemento depois de autenticar, e descarta a foto anterior na troca', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce({ok: true, blob: async () => new Blob(['image'], {type: 'image/png'})})
    .mockResolvedValueOnce({ok: false});
  vi.stubGlobal('fetch', fetchMock);
  const {rerender} = render(<ProtectedImage src='/manus-storage/one.png' alt='Foto privada'/>);
  expect(screen.getByAltText('Foto privada').getAttribute('src')).toBe('/manus-storage/one.png');
  expect(screen.getByAltText('Foto privada').getAttribute('src')).not.toMatch(/^data:image/);
  await waitFor(() => expect(screen.getByAltText('Foto privada').getAttribute('src')).toMatch(/^data:image\/png/));
  rerender(<ProtectedImage src='/manus-storage/two.png' alt='Foto privada'/>);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(screen.getByAltText('Foto privada').getAttribute('src')).toBe('/manus-storage/two.png');
  expect(screen.getByAltText('Foto privada').getAttribute('src')).not.toMatch(/^data:image/);
});
