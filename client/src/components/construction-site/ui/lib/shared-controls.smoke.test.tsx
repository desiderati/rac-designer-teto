import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {PhotoUploadField} from './shared-controls.tsx';

const uploadImageMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/StorageImageUploadContext.tsx', () => ({
  useStorageImageUpload: () => ({
    isUploading: false,
    progress: null,
    uploadImage: uploadImageMock,
  }),
}));

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('PhotoUploadField', () => {
  afterEach(() => {
    uploadImageMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('mantém a prévia local visível enquanto o upload remoto está pendente', async () => {
    let releaseUpload!: (url: string) => void;
    uploadImageMock.mockReturnValue(new Promise<string>((resolve) => {
      releaseUpload = resolve;
    }));
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:photo-pending'),
      revokeObjectURL: vi.fn(),
    });

    const onChange = vi.fn();
    render(<PhotoUploadField label='Foto da Família' value='' onChange={onChange}/>);

    const field = screen.getByTestId('family-photo-field');
    const input = within(field).getByLabelText('Foto da Família arquivo');
    fireEvent.change(input, {
      target: {files: [new File([PNG_BYTES], 'familia.png', {type: 'image/png'})]},
    });

    const review = await screen.findByRole('dialog');
    await waitFor(() => expect(review.querySelector('img')).not.toBeNull());
    await fireEvent.click(within(review).getByRole('button', {name: 'Usar esta imagem'}));

    await waitFor(() => expect(uploadImageMock).toHaveBeenCalledTimes(1));
    const preview = within(field).getByAltText('Foto da Família');
    expect(preview).toHaveAttribute('src', 'blob:photo-pending');
    expect(preview).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();

    releaseUpload('/manus-storage/site/photos/familia.png');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('/manus-storage/site/photos/familia.png'));
  });
});
