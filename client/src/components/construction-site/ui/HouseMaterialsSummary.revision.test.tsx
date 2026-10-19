import {fireEvent, render, screen, within} from '@testing-library/react';
import {expect, it} from 'vitest';
import {HouseMaterialsSummary} from './HouseMaterialsSummary.tsx';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
it('A-014 mantém mini planta e materiais sem o bloco textual dispensado na V-002', () => {
  const house = {houseType: 'tipo6', houseSize: 'large', drawingDocument: {house: {pilotis: {
    piloti_0_0: {height: 1.5, nivel: .2, isMaster: true},
    piloti_0_1: {height: 1.5, nivel: .2, isMaster: false},
    piloti_0_2: {height: 0, nivel: .2, isMaster: false},
  }}}} as unknown as PersistedHouseRecord;
  const before = structuredClone(house);
  render(<HouseMaterialsSummary familyName='Teste' house={house} materials={{stairBeams: 2}}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Resumo da Casa de Teste'}));
  const summary = within(screen.getByRole('tooltip'));
  expect(summary.getByRole('img', {name: 'Mini planta da casa, sem identificadores de pilotis'})).toBeVisible();
  expect(summary.queryByText(/^[ABC][1-4]$/)).not.toBeInTheDocument();
  expect(summary.queryByText(/Tipo da casa|Tamanho da casa|Pilotis .* m:/)).not.toBeInTheDocument();
  expect(summary.queryByText('Tipo 6')).not.toBeInTheDocument();
  expect(summary.queryByText('Grande')).not.toBeInTheDocument();
  const miniature = summary.getByRole('img');
  expect(miniature.querySelectorAll('circle')).toHaveLength(2);
  expect(summary.getByText('Vigas p/ Escada')).toBeVisible();
  expect(house).toEqual(before);
});
