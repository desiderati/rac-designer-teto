import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ImageUploadReview} from '@/components/ui/ImageUploadReview.tsx';

vi.mock('@/shared/lib/photo-data-url.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/photo-data-url.ts')>();
  return {
    ...actual,
    preparePhotoFileForUpload: vi.fn(async (file: File) => {
      const optimized = new File(['optimized'], 'imagem.webp', {type: 'image/webp'});
      return {
        file: optimized,
        compressed: true,
        originalBytes: file.size,
        finalBytes: optimized.size,
        reductionPercent: 42.5,
      };
    }),
  };
});

function createImageFile() {
  return new File([new Uint8Array(3 * 1024 * 1024)], 'terreno.png', {type: 'image/png'});
}

function renderReview(overrides: Partial<React.ComponentProps<typeof ImageUploadReview>> = {}) {
  return render(
    <ImageUploadReview
      file={createImageFile()}
      isOpen
      onOpenChange={vi.fn()}
      onConfirm={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ImageUploadReview', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    window.innerWidth = 1024;
    URL.createObjectURL = vi.fn(() => 'blob:review-image');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('usa Dialog no desktop e permite comparar e escolher a qualidade', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderReview({onConfirm, onOpenChange});

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(await screen.findByRole('button', {name: 'Comparar original e otimizada'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Cancelar'})).toHaveClass('w-full');
    expect(screen.getByRole('button', {name: 'Usar esta imagem'})).toHaveClass('w-full');
    expect(screen.getByText('42,5%')).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Comparar original e otimizada'}));
    expect(screen.getAllByText('Original')).toHaveLength(2);
    expect(screen.getByText('Otimizada')).toBeVisible();

    const checkbox = screen.getByRole('checkbox', {name: 'Manter qualidade original'});
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(screen.getByRole('button', {name: 'Usar esta imagem'}));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({preserveOriginalQuality: true});
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('usa Drawer em viewport mobile', async () => {
    window.innerWidth = 390;
    renderReview();

    await waitFor(() => expect(screen.getByText('Confira a imagem e escolha como deseja enviá-la.')).toBeVisible());
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByTestId('image-upload-review-actions')).toHaveClass('sticky', 'bottom-0', 'w-full');
  });

  it('solicita a troca do arquivo pelo seletor nativo', async () => {
    const user = userEvent.setup();
    const onRequestFileChange = vi.fn();
    renderReview({onRequestFileChange});

    await user.click(await screen.findByRole('button', {name: 'Trocar imagem selecionada'}));

    expect(onRequestFileChange).toHaveBeenCalledOnce();
  });
});
