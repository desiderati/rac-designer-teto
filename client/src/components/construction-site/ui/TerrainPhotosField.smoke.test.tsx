import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {TerrainPhoto} from '@/shared/types/construction-site.ts';
import {TerrainPhotosField} from './TerrainPhotosField.tsx';

const toastMock = vi.hoisted(() => ({
  loading: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/contexts/StorageImageUploadContext.tsx', () => ({
  useStorageImageUpload: () => ({
    isUploading: false,
    uploadImage: vi.fn(),
  }),
}));

vi.mock('@/contexts/TerrainPhotoDescriptionContext.tsx', () => ({
  useTerrainPhotoDescription: () => ({
    isDescribing: false,
    describePhoto: vi.fn(),
  }),
}));

vi.mock('@/components/ui/sonner.tsx', () => ({toast: toastMock}));

const existingPhoto: TerrainPhoto = {
  id: 'terrain-photo-1',
  url: 'https://example.com/terrain.jpg',
  description: 'Vegetação baixa junto ao acesso lateral.',
};

describe('TerrainPhotosField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pede confirmação antes de excluir e mantém a foto ao cancelar', () => {
    const onChange = vi.fn();

    render(
      <TerrainPhotosField
        constructionSiteId='site-1'
        value={[existingPhoto]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Excluir foto 1 do terreno'}));

    expect(screen.getByRole('heading', {name: 'Excluir foto do terreno?'})).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));

    expect(screen.queryByRole('heading', {name: 'Excluir foto do terreno?'})).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('remove a foto somente depois da confirmação', () => {
    const onChange = vi.fn();

    render(
      <TerrainPhotosField
        constructionSiteId='site-1'
        value={[existingPhoto]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Excluir foto 1 do terreno'}));
    fireEvent.click(screen.getByRole('button', {name: /^Excluir foto$/}));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(toastMock.success).toHaveBeenCalledWith('Foto removida.');
  });

  it('mantém excluir e trocar em posições separadas na thumbnail', () => {
    render(
      <TerrainPhotosField
        constructionSiteId='site-1'
        value={[existingPhoto]}
        onChange={vi.fn()}
      />,
    );

    const actions = screen.getByTestId('terrain-photo-actions');
    expect(actions).toHaveClass('inset-y-1', 'justify-between');
    expect(actions.querySelectorAll('button')).toHaveLength(2);
  });

  it('mantém os thumbnails abaixo da foto principal até 839px', () => {
    render(
      <TerrainPhotosField
        constructionSiteId='site-1'
        value={[existingPhoto]}
        onChange={vi.fn()}
      />,
    );

    const field = screen.getByTestId('terrain-photos-field');
    const layout = field.firstElementChild;
    expect(layout?.className).toContain('min-[840px]:grid-cols-[minmax(0,1fr)_148px]');
  });

  it('aceita uma imagem arrastada para a foto principal e abre a revisão de troca', async () => {
    const droppedFile = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      'nova-foto.png',
      {type: 'image/png'},
    );

    render(
      <TerrainPhotosField
        constructionSiteId='site-1'
        value={[existingPhoto]}
        onChange={vi.fn()}
      />,
    );

    fireEvent.drop(screen.getByTestId('terrain-main-photo-dropzone'), {
      dataTransfer: {files: [droppedFile], types: ['Files']},
    });

    expect(await screen.findByText('Trocar foto do terreno')).toBeVisible();
  });
});
