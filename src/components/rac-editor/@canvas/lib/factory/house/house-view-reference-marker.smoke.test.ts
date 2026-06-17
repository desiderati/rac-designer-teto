import {describe, expect, it, vi} from 'vitest';

vi.mock('fabric', () => {
  class FabricObject {
    type?: string;

    constructor(props: Record<string, unknown> = {}) {
      Object.assign(this, props);
    }

    set(patch: Record<string, unknown>) {
      Object.assign(this, patch);
    }

    toObject() {
      return {...this};
    }
  }

  class Group extends FabricObject {
    private objects: FabricObject[];

    constructor(objects: FabricObject[], props: Record<string, unknown> = {}) {
      super({...props, type: 'group'});
      this.objects = objects;
    }

    getObjects() {
      return this.objects;
    }

    add(...objects: FabricObject[]) {
      this.objects.push(...objects);
    }

    remove(...objects: FabricObject[]) {
      this.objects = this.objects.filter((object) => !objects.includes(object));
    }
  }

  class Text extends FabricObject {
    constructor(text: string, props: Record<string, unknown> = {}) {
      super({...props, text});
    }
  }

  class Rect extends FabricObject {}

  class Triangle extends FabricObject {}

  return {FabricObject, Group, Rect, Text, Triangle};
});

import {
  collectHouseViewReferenceEntries,
  createHouseElevationReferenceLabel,
  createHousePlanReferenceMarker,
  refreshHouseViewReferenceMarkersInViews,
} from './house-view-reference-marker.ts';
import {toCanvasGroup} from '@/components/rac-editor/@canvas/lib';

function createMockGroup(objects: any[] = []) {
  const group = {
    _objects: objects,
    getCanvasObjects() {
      return this._objects;
    },
    getObjects() {
      return this._objects;
    },
    setCoords: vi.fn(),
    _clearCache: vi.fn(),
    _calcBounds: vi.fn(),
    dirty: false,
  };

  return toCanvasGroup(group);
}

describe('house-view-reference-marker.ts', () => {
  it('numera referencias pela ordem temporal das vistas elevadas', () => {
    const frontGroup = createMockGroup();
    const backGroup = createMockGroup();

    expect(
      collectHouseViewReferenceEntries({
        houseType: 'tipo6',
        elevationViews: {
          front: [{instanceId: 'front_200', side: 'bottom', group: frontGroup}],
          back: [{instanceId: 'back_100', side: 'top', group: backGroup}],
          side1: [],
          side2: [],
        },
      }).map((entry) => ({
        label: entry.label,
        sequence: entry.sequence,
        side: entry.side,
      })),
    ).toEqual([
      {label: 'Posterior', sequence: 1, side: 'top'},
      {label: 'Frontal', sequence: 2, side: 'bottom'},
    ]);
  });

  it('cria label de elevacao serializavel sem triangulo', () => {
    const marker = createHouseElevationReferenceLabel({
      label: 'Frontal',
      left: 10,
      sequence: 1,
      top: 20,
      scale: 0.5,
    });

    expect(marker.type).toBeUndefined();
    expect(marker.text).toBe('Frontal #1');
    expect(marker.fontSize).toBe(8);
    expect(marker.myType).toBe('houseViewReferenceMarker');
    expect(marker.isHouseViewReferenceMarker).toBe(true);
    expect(marker.houseViewReferenceMarkerCode).toBe('1');
    expect(marker.houseViewReferenceMarkerLabel).toBe('Frontal');
    expect(marker.selectable).toBe(false);
    expect(marker.evented).toBe(false);
  });

  it('mantem numero e label paralelos a base do triangulo em cada lado da planta', () => {
    const createMarkerObjects = (side: 'top' | 'bottom' | 'left' | 'right') => {
      const marker = createHousePlanReferenceMarker({
        label: 'Frontal',
        left: 10,
        sequence: 1,
        side,
        top: 20,
        scale: 1,
      }) as any;
      const [, triangle, codeText, labelText] = marker.getObjects();
      return {marker, triangle, codeText, labelText};
    };

    const top = createMarkerObjects('top');
    const bottom = createMarkerObjects('bottom');
    const left = createMarkerObjects('left');
    const right = createMarkerObjects('right');

    expect(bottom.marker.myType).toBe('houseViewReferenceMarker');
    expect(bottom.marker.houseViewReferenceMarkerCode).toBe('1');
    expect(bottom.marker.houseViewReferenceMarkerLabel).toBe('Frontal');
    expect(bottom.marker.houseViewReferenceMarkerSide).toBe('bottom');
    expect(bottom.codeText.fontSize).toBe(12);
    expect(bottom.labelText.fontSize).toBe(10.5);

    expect(top.triangle.angle).toBe(180);
    expect(top.codeText.angle).toBe(0);
    expect(top.labelText.angle).toBe(0);
    expect(top.labelText.top).toBeLessThan(-top.triangle.height / 2);

    expect(bottom.triangle.angle).toBe(0);
    expect(bottom.codeText.angle).toBe(0);
    expect(bottom.labelText.angle).toBe(0);
    expect(bottom.labelText.top).toBeGreaterThan(bottom.triangle.height / 2);

    expect(left.triangle.angle).toBe(90);
    expect(left.codeText.angle).toBe(90);
    expect(left.labelText.angle).toBe(90);
    expect(left.labelText.left).toBeLessThan(-left.triangle.height / 2);

    expect(right.triangle.angle).toBe(-90);
    expect(right.codeText.angle).toBe(90);
    expect(right.labelText.angle).toBe(90);
    expect(right.labelText.left).toBeGreaterThan(right.triangle.height / 2);
  });

  it('sincroniza triangulos na planta e labels simples com fonte uniforme nas vistas elevadas', () => {
    const topGroup = createMockGroup([
      {isHouseBody: true, width: 366, height: 132, scaleX: 1, scaleY: 1},
      {isHouseViewReferenceMarker: true},
    ]);
    const frontElevationGroup = createMockGroup([
      {left: 0, top: 0, width: 366, height: 160},
    ]);
    const sideElevationGroup = createMockGroup([
      {left: 0, top: 0, width: 150, height: 160},
    ]);

    const changed = refreshHouseViewReferenceMarkersInViews({
      houseType: 'tipo6',
      topViews: [{instanceId: 'top_1', group: topGroup}],
      elevationViews: {
        front: [{instanceId: 'front_1', side: 'bottom', group: frontElevationGroup}],
        back: [],
        side1: [{instanceId: 'side1_2', side: 'left', group: sideElevationGroup}],
        side2: [],
      },
    });

    const topMarker = topGroup.getCanvasObjects().find((object) => object.isHouseViewReferenceMarker) as any;
    const frontElevationMarker =
      frontElevationGroup.getCanvasObjects().find((object) => object.isHouseViewReferenceMarker) as any;
    const sideElevationMarker =
      sideElevationGroup.getCanvasObjects().find((object) => object.isHouseViewReferenceMarker) as any;

    expect(changed).toBe(true);
    expect(topGroup.getCanvasObjects().filter((object) => object.isHouseViewReferenceMarker)).toHaveLength(2);
    expect(topMarker.houseViewReferenceMarkerCode).toBe('1');
    expect(topMarker.houseViewReferenceMarkerLabel).toBe('Frontal');
    expect(topMarker.houseViewReferenceMarkerSide).toBe('bottom');
    expect(topMarker.top).toBeCloseTo(75.24);
    expect(frontElevationMarker.text).toBe('Frontal #1');
    expect(sideElevationMarker.text).toBe('Lateral Esquerda #2');
    expect(frontElevationMarker.fontSize).toBe(8);
    expect(frontElevationMarker.top).toBe(180);
    expect(sideElevationMarker.fontSize).toBe(frontElevationMarker.fontSize);
  });
});
