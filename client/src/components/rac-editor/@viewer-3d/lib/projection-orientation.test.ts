import {describe, expect, it} from 'vitest';
import {buildAutoAssignedSides} from '@/domain/house/use-cases/house-views-layout.use-case.ts';
import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import {createHouse3DProjectionFromDocument} from './projection-from-document.ts';
import {buildHouse3DViewerModel} from '../hooks/useHouse3DViewerModel.ts';
import {buildHouseElementsFromCanvasModel} from './parsers/house-elements-parser.ts';
import {resolveHouse3DDoorFace} from './camera-pose.ts';
import {resolveTopDoorMarkerSide} from '@/components/rac-editor/@canvas/lib/house-top-view-door-marker.ts';
import type {HouseState, HouseTypeExcludeNull, HouseSide, House3DFace} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';

function createHouse(houseType: HouseTypeExcludeNull, side: HouseSide): HouseState {
  return {
    id: 'orientation-test', houseType, terrainType: 1, pilotis: {},
    sideMappings: {top: null, bottom: null, left: null, right: null},
    preAssignedSides: buildAutoAssignedSides({houseType, initialSide: side}),
    views: {top: [{instanceId: 'top_1'}], front: [], back: [], side1: [], side2: []},
  };
}

const projectors = {
  canvas: (house: HouseState) => createHouse3DProjectionFromCanvasHouse({
    ...house,
    views: {...house.views, top: [{instanceId: 'top_1', group: {getObjects: () => []} as unknown as CanvasGroup}],
      front: [], back: [], side1: [], side2: []},
  })!,
  document: (house: HouseState) => createHouse3DProjectionFromDocument({
    documentType: 'rac-house-drawing', schemaVersion: 1,
    setup: {familyName: '', selectedPilotiHeights: []}, house,
    canvas: {schemaVersion: 1, objects: []},
  }),
};

const cases: Array<[HouseTypeExcludeNull, HouseSide, House3DFace]> = [
  ['tipo6', 'top', 'front'], ['tipo6', 'bottom', 'back'],
  ['tipo3', 'left', 'right'], ['tipo3', 'right', 'left'],
];

describe.each(Object.entries(projectors))('orientação 3D via %s', (_name, project) => {
  it.each(cases)('%s com porta %s preserva orientação sem elevações', (type, side, face) => {
    const house = createHouse(type, side);
    const before = JSON.stringify(house);
    expect(resolveTopDoorMarkerSide(house)).toBe(side);
    const model = buildHouse3DViewerModel(project(house));
    const elements = buildHouseElementsFromCanvasModel(type, model.tipo6FrontSide, model.tipo3OpenSide);
    expect(elements.find((element) => element.type === 'door')?.face).toBe(face);
    expect(elements.filter((element) => element.face === face && element.type === 'window'))
      .toHaveLength(type === 'tipo6' ? 2 : 1);
    expect(model.stairs?.face).toBe(face);
    expect(resolveHouse3DDoorFace(type, model.tipo6FrontSide, model.tipo3OpenSide)).toBe(face);
    expect(JSON.stringify(house)).toBe(before);
  });

  it.each(cases)('%s mantém precedência do lado %s já atribuído', (type, side, face) => {
    const opposite: Record<HouseSide, HouseSide> = {top: 'bottom', bottom: 'top', left: 'right', right: 'left'};
    const house = createHouse(type, opposite[side]);
    house.sideMappings[side] = type === 'tipo6' ? 'front' : 'side2';
    const model = buildHouse3DViewerModel(project(house));
    expect(resolveHouse3DDoorFace(type, model.tipo6FrontSide, model.tipo3OpenSide)).toBe(face);
    expect(model.stairs?.face).toBe(face);
  });

  it.each(['tipo6', 'tipo3'] as const)('%s preserva fallback legado sem pré-atribuição', (type) => {
    const house = createHouse(type, type === 'tipo6' ? 'top' : 'left');
    house.preAssignedSides = {};
    const model = buildHouse3DViewerModel(project(house));
    expect(resolveHouse3DDoorFace(type, model.tipo6FrontSide, model.tipo3OpenSide))
      .toBe(type === 'tipo6' ? 'front' : 'right');
  });
});
