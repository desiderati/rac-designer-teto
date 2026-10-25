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
  const summary = within(screen.getByRole('dialog', {name: 'Resumo da Casa'}));
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

it.each([
  {type: 'tipo6', view: 'front', side: 'top', label: 'superior'},
  {type: 'tipo6', view: 'front', side: 'bottom', label: 'inferior'},
  {type: 'tipo3', view: 'side2', side: 'left', label: 'esquerdo'},
  {type: 'tipo3', view: 'side2', side: 'right', label: 'direito', preAssigned: true},
])('A-014 inclui a porta da $type no lado $label sem alterar a casa', ({type, view, side, label, preAssigned}) => {
  const house = {houseType: type, drawingDocument: {house: {
    houseType: type,
    pilotis: {piloti_0_0: {height: 1.2, nivel: .2, isMaster: true}},
    sideMappings: {top: null, bottom: null, left: null, right: null, ...(!preAssigned ? {[side]: view} : {})},
    preAssignedSides: preAssigned ? {[view]: side} : {},
  }}} as unknown as PersistedHouseRecord;
  const before = structuredClone(house);
  render(<HouseMaterialsSummary familyName='Porta' house={house} materials={{asphaltBlanket: true}}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Resumo da Casa de Porta'}));
  const summary = within(screen.getByRole('dialog', {name: 'Resumo da Casa'}));
  expect(summary.getByRole('img', {name: `Mini planta da casa, sem identificadores de pilotis, porta no lado ${label}`})).toBeVisible();
  expect(summary.getByText('Porta', {exact: true})).toBeVisible();
  expect(summary.getByText('Manta Asfáltica')).toBeVisible();
  expect(summary.queryByText(/Tipo da casa|Tamanho da casa|Pilotis .* m:/)).not.toBeInTheDocument();
  expect(house).toEqual(before);
});

it('A-014 não inventa a posição da porta sem orientação definida', () => {
  const house = {drawingDocument: {house: {houseType: 'tipo6', pilotis: {},
    sideMappings: {top: null, bottom: null, left: null, right: null}, preAssignedSides: {},
  }}} as unknown as PersistedHouseRecord;
  render(<HouseMaterialsSummary familyName='Sem orientação' house={house}/>);
  fireEvent.click(screen.getByRole('button', {name: 'Resumo da Casa de Sem orientação'}));
  expect(within(screen.getByRole('dialog', {name: 'Resumo da Casa'})).queryByText('Porta', {exact: true})).not.toBeInTheDocument();
});
