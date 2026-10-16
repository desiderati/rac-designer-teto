import {fireEvent, render, screen, within} from '@testing-library/react';
import {expect, it} from 'vitest';
import {HouseMaterialsSummary} from './HouseMaterialsSummary.tsx';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
it('A-014 resume tipo, tamanho e quantidades positivas sem alterar os pilotis zerados', () => {
  const house = {houseType: 'tipo6', houseSize: 'large', drawingDocument: {house: {pilotis: {
    piloti_0_0: {height: 1.5, nivel: .2, isMaster: true},
    piloti_0_1: {height: 1.5, nivel: .2, isMaster: false},
    piloti_0_2: {height: 0, nivel: .2, isMaster: false},
  }}}} as unknown as PersistedHouseRecord;
  const before = structuredClone(house);
  render(<HouseMaterialsSummary familyName='Teste' house={house}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Resumo da Casa de Teste'}));
  const summary = within(screen.getByRole('tooltip'));
  expect(summary.getByText('Tipo 6')).toBeVisible();
  expect(summary.getByText('Grande')).toBeVisible();
  expect(summary.getByText('Pilotis 1,5 m:').parentElement).toHaveTextContent('2');
  expect(summary.queryByText('Pilotis 0 m:')).not.toBeInTheDocument();
  expect(house).toEqual(before);
});
