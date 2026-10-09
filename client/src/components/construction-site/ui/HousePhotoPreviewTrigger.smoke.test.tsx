import {expect, it} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {HousePhotoPreviewTrigger} from './HousePhotoPreviewTrigger.tsx';

const house = {
  id: 'house-1',
  updatedAt: '2026-10-09T16:00:00.000Z',
  drawingDocument: {
    schemaVersion: 1,
    house: null,
    canvas: {schemaVersion: 1, objects: []},
  },
} as PersistedHouseRecord;

it('abre uma prévia ampliada do Canvas ao clicar no thumbnail', () => {
  render(
    <HousePhotoPreviewTrigger
      house={house}
      familyName='Família Silva'
    >
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Desenho indisponível')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Recarregar'})).toBeInTheDocument();
  expect(screen.queryByText('Pré-visualização da casa')).not.toBeInTheDocument();
});
