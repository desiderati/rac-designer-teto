import {describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ImageUploadModal} from '@/components/rac-editor/@modals/ui/ImageUploadModal.tsx';
import {PHOTO_UPLOAD_ERROR_MESSAGE} from '@/shared/lib/photo-data-url.ts';

function createPngFile() {
  return new File([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ], 'terreno.png', {type: 'image/png'});
}

function renderImageUploadModal(overrides: {
  onOpenChange?: (open: boolean) => void;
  onInsertImage?: (dataUrl: string) => Promise<boolean> | boolean;
} = {}) {
  return render(
    <ImageUploadModal
      isMobile={false}
      isOpen={true}
      onOpenChange={overrides.onOpenChange ?? vi.fn()}
      onInsertImage={overrides.onInsertImage ?? vi.fn(() => true)}
    />,
  );
}

describe('ImageUploadModal.tsx', () => {
  it('validates and inserts an uploaded image data URL', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onInsertImage = vi.fn(async () => true);
    renderImageUploadModal({onOpenChange, onInsertImage});

    await user.upload(
      screen.getByLabelText('Selecionar imagem para inserir no canvas'),
      createPngFile(),
    );

    await waitFor(() => expect(onInsertImage).toHaveBeenCalledOnce());
    expect(onInsertImage.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the modal open and reports invalid image files', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onInsertImage = vi.fn(() => true);
    renderImageUploadModal({onOpenChange, onInsertImage});

    await user.upload(
      screen.getByLabelText('Selecionar imagem para inserir no canvas'),
      new File(['texto'], 'arquivo.png', {type: 'image/png'}),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(PHOTO_UPLOAD_ERROR_MESSAGE);
    expect(onInsertImage).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
