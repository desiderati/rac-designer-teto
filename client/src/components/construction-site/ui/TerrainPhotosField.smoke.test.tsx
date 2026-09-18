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
});
