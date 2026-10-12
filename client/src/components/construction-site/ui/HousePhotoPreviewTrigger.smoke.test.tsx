import {expect, it, vi} from 'vitest';
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

it('unifica ir para o Canvas e fechar modal em um submenu acionado por FAB', () => {
  const onOpenCanvas = vi.fn();
  render(
    <HousePhotoPreviewTrigger
      house={house}
      familyName='Família Silva'
      onOpenCanvas={onOpenCanvas}
    >
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));
  fireEvent.click(screen.getByRole('button', {name: 'Abrir ações da prévia do Canvas'}));

  expect(screen.getByTestId('house-canvas-preview-actions')).toBeVisible();
  expect(screen.getByRole('menuitem', {name: 'Ir pro Canvas'})).toBeVisible();
  expect(screen.getByRole('menuitem', {name: 'Fechar Modal'})).toBeVisible();

  fireEvent.click(screen.getByRole('menuitem', {name: 'Ir pro Canvas'}));
  expect(onOpenCanvas).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('fecha a prévia pelo submenu sem acionar a navegação', () => {
  render(
    <HousePhotoPreviewTrigger house={house} familyName='Família Silva'>
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));
  fireEvent.click(screen.getByRole('button', {name: 'Abrir ações da prévia do Canvas'}));
  fireEvent.click(screen.getByRole('menuitem', {name: 'Fechar Modal'}));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
