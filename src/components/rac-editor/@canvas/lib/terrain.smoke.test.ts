import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {PILOTI_BASE_HEIGHT_PX} from '@/shared/constants.ts';
import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {
  collectPilotiGroundAnchors,
  createGroundElements,
  generateGroundLinePoints,
  sampleGroundYAtX,
  updateGroundInGroup,
} from '@/components/rac-editor/@canvas/lib/terrain.ts';

function createCanvasObject(props: Partial<CanvasObject> = {}): CanvasObject {
  return {
    ...props,
    set(patch: Record<string, unknown>) {
      Object.assign(this, patch);
    },
    setCoords: vi.fn(),
  } as unknown as CanvasObject;
}

function createElevationGroup(objects: CanvasObject[]): CanvasGroup {
  const group = {
    _objects: objects,
    houseView: 'side',
    isRightSide: false,
    getObjects() {
      return this._objects;
    },
    getCanvasObjects() {
      return this._objects;
    },
    setCoords: vi.fn(),
    _clearCache: vi.fn(),
    _calcBounds: vi.fn(),
  };

  return group as unknown as CanvasGroup;
}

function createPilotiRect(
  pilotiId: string,
  left: number,
  nivel: number,
  pilotiBaseHeight = PILOTI_BASE_HEIGHT_PX,
): CanvasObject {
  return createCanvasObject({
    isPilotiRect: true,
    pilotiId,
    pilotiNivel: nivel,
    pilotiBaseHeight,
    left,
    top: 100,
    width: 10,
    height: 100,
  });
}

function getGroundLinePoints(group: CanvasGroup): Array<{ x: number; y: number }> {
  const groundLine = group.getCanvasObjects().find((object) => object.isGroundLine);
  return (groundLine as CanvasObject & { points?: Array<{ x: number; y: number }> })?.points ?? [];
}

function getMainGroundFillRight(group: CanvasGroup): number {
  const groundFill = group.getCanvasObjects()
    .find((object) => object.isGroundFill && !object.isTerrainSideGravel && !object.isTerrainRachao);
  const points = (groundFill as CanvasObject & { points?: Array<{ x: number; y: number }> })?.points ?? [];
  return Math.max(...points.map((point) => point.x));
}

function getMainGroundFillLeft(group: CanvasGroup): number {
  const groundFill = group.getCanvasObjects()
    .find((object) => object.isGroundFill && !object.isTerrainSideGravel && !object.isTerrainRachao);
  const points = (groundFill as CanvasObject & { points?: Array<{ x: number; y: number }> })?.points ?? [];
  return Math.min(...points.map((point) => point.x));
}

function getNivelLabelTexts(objects: CanvasObject[]): string[] {
  return objects
    .filter((object) => object.isNivelLabel)
    .map((object) => String(object.text ?? ''));
}

describe('terrain.ts', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn((text: string) => ({
        width: text.length * 8,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
      })),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mantém os pontos de terreno não editados quando uma âncora de nível muda', () => {
    const before = generateGroundLinePoints(
      0,
      140,
      42,
      [
        {x: 15, y: 120},
        {x: 65, y: 130},
        {x: 115, y: 140},
      ],
    );
    const after = generateGroundLinePoints(
      0,
      140,
      42,
      [
        {x: 15, y: 150},
        {x: 65, y: 130},
        {x: 115, y: 140},
      ],
    );

    expect(sampleGroundYAtX(after, 15)).toBe(150);
    expect(sampleGroundYAtX(after, 65)).toBe(sampleGroundYAtX(before, 65));
    expect(sampleGroundYAtX(after, 115)).toBe(sampleGroundYAtX(before, 115));
  });

  it('usa todos os pilotis visíveis como âncoras do terreno da elevação', () => {
    const pilotis = [
      createPilotiRect('piloti_0_0', 10, 0.2),
      createPilotiRect('piloti_0_1', 60, 0.3),
      createPilotiRect('piloti_0_2', 110, 0.4),
    ];

    expect(collectPilotiGroundAnchors(pilotis)).toEqual([
      {x: 15, y: 120, nivel: 0.2},
      {x: 65, y: 130, nivel: 0.3},
      {x: 115, y: 140, nivel: 0.4},
    ]);
  });

  it('exibe níveis centrais na elevação somente quando o modo manual habilita esse visual', () => {
    const pilotiRects = [
      {pilotiId: 'piloti_0_0', left: 10, top: 100, width: 10, height: 100},
      {pilotiId: 'piloti_0_1', left: 60, top: 100, width: 10, height: 100},
      {pilotiId: 'piloti_0_2', left: 110, top: 100, width: 10, height: 100},
    ];
    const groundAnchors = [
      {x: 15, y: 120, nivel: 0.2},
      {x: 65, y: 130, nivel: 0.3},
      {x: 115, y: 140, nivel: 0.4},
    ];

    const automaticElements = createGroundElements(
      0,
      15,
      120,
      140,
      115,
      140,
      1,
      42,
      '0,20',
      '0,40',
      220,
      1,
      pilotiRects,
      groundAnchors,
      false,
    );
    const manualElements = createGroundElements(
      0,
      15,
      120,
      140,
      115,
      140,
      1,
      42,
      '0,20',
      '0,40',
      220,
      1,
      pilotiRects,
      groundAnchors,
      true,
    );

    expect(getNivelLabelTexts(automaticElements)).toEqual(['0,20', '0,40']);
    expect(automaticElements.filter((object) => object.isNivelMarker)).toHaveLength(4);
    expect(getNivelLabelTexts(manualElements)).toEqual(['0,20', '0,40', '0,30']);
    expect(manualElements.filter((object) => object.isNivelMarker)).toHaveLength(6);
  });

  it('redesenha o terreno sem deslocar o ponto dos demais pilotis no modo manual', () => {
    const middlePiloti = createPilotiRect('piloti_0_1', 60, 0.3);
    const leftPiloti = createPilotiRect('piloti_0_0', 10, 0.2);
    const group = createElevationGroup([
      createCanvasObject({left: 0, top: 0, width: 130, height: 80}),
      leftPiloti,
      middlePiloti,
      createPilotiRect('piloti_0_2', 110, 0.4),
    ]);

    updateGroundInGroup(group);
    const middleGroundYBefore = sampleGroundYAtX(getGroundLinePoints(group), 65);

    leftPiloti.pilotiNivel = 0.5;
    updateGroundInGroup(group);
    const groundPointsAfter = getGroundLinePoints(group);

    expect(sampleGroundYAtX(groundPointsAfter, 15)).toBe(150);
    expect(sampleGroundYAtX(groundPointsAfter, 65)).toBe(middleGroundYBefore);
    expect(middlePiloti.pilotiNivel).toBe(0.3);
  });

  it('mantém a largura lateral do terreno estável em redesenhos sucessivos', () => {
    const leftPiloti = createPilotiRect('piloti_0_0', 10, 0.2);
    const group = createElevationGroup([
      createCanvasObject({isHouseBody: true, left: 0, top: 0, width: 130, height: 80}),
      leftPiloti,
      createPilotiRect('piloti_0_1', 60, 0.3),
      createPilotiRect('piloti_0_2', 110, 0.4),
    ]);

    updateGroundInGroup(group);
    const fillRightBefore = getMainGroundFillRight(group);

    group.getCanvasObjects().push(createCanvasObject({left: 140, top: 0, width: 80, height: 10}));
    leftPiloti.pilotiNivel = 0.5;
    updateGroundInGroup(group);

    expect(getMainGroundFillRight(group)).toBe(fillRightBefore);
  });

  it('recalcula o recuo do terreno pelo corpo da casa quando há limite persistido maior', () => {
    const group = createElevationGroup([
      createCanvasObject({isHouseBody: true, left: 0, top: 0, width: 130, height: 80}),
      createPilotiRect('piloti_0_0', 10, 0.2),
      createPilotiRect('piloti_0_1', 60, 0.3),
      createPilotiRect('piloti_0_2', 110, 0.4),
    ]);
    group.groundViewLeftX = -100;
    group.groundViewRightX = 220;

    updateGroundInGroup(group);

    expect(group.groundViewLeftX).toBe(0);
    expect(group.groundViewRightX).toBe(130);
    expect(getMainGroundFillLeft(group)).toBe(-50);
    expect(getMainGroundFillRight(group)).toBe(180);
  });

  it('escala o recuo lateral do terreno junto com a vista elevada', () => {
    const scale = 0.5;
    const pilotiBaseHeight = PILOTI_BASE_HEIGHT_PX * scale;
    const group = createElevationGroup([
      createCanvasObject({isHouseBody: true, left: 0, top: 0, width: 130, height: 80}),
      createPilotiRect('piloti_0_0', 10, 0.2, pilotiBaseHeight),
      createPilotiRect('piloti_0_1', 60, 0.3, pilotiBaseHeight),
      createPilotiRect('piloti_0_2', 110, 0.4, pilotiBaseHeight),
    ]);

    updateGroundInGroup(group);

    const expectedPadding = HOUSE_DEFAULTS.viewPadding * scale;
    expect(getMainGroundFillLeft(group)).toBe(-expectedPadding);
    expect(getMainGroundFillRight(group)).toBe(130 + expectedPadding);
  });

  it('redesenha a elevação manual com labels de nível nos pilotis centrais visíveis', () => {
    const group = createElevationGroup([
      createCanvasObject({left: 0, top: 0, width: 130, height: 80}),
      createPilotiRect('piloti_0_0', 10, 0.2),
      createPilotiRect('piloti_0_1', 60, 0.3),
      createPilotiRect('piloti_0_2', 110, 0.4),
    ]);
    group.showAllPilotiNivelLabels = true;

    updateGroundInGroup(group);

    expect(getNivelLabelTexts(group.getCanvasObjects())).toEqual(['0,20', '0,40', '0,30']);
  });
});
