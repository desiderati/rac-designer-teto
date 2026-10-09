import {expect, it} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {HousePhotoPreviewTrigger} from './HousePhotoPreviewTrigger.tsx';

it('abre uma prévia ampliada ao clicar no thumbnail', () => {
  render(
    <HousePhotoPreviewTrigger
      familyName='Família Silva'
      photoDataUrl='data:image/png;base64,house'
    >
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar foto da casa Família Silva'}));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Pré-visualização da casa')).toBeInTheDocument();
  expect(screen.getAllByAltText('Foto da casa Família Silva')).toHaveLength(1);
});
