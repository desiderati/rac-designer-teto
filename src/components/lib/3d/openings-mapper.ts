import {BASE_TOP_HEIGHT, BASE_TOP_WIDTH} from '@/components/lib/canvas';
import {TOP_VIEW_SCALE} from '@/components/lib/3d/constants.ts';
import {HouseElement, HouseType} from '@/shared/types/house.ts';

export interface SceneOpening {
  id: string;
  type: 'window' | 'door';
  face: 'front' | 'back' | 'left' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
}

export function buildOpeningsFromCanvasModel(
  houseType: HouseType,
  rawElements: HouseElement[],
  tipo6FrontSide?: 'top' | 'bottom' | null,
  tipo3OpenSide?: 'left' | 'right' | null,
): SceneOpening[] {
  if (!houseType) return [];

  const s = TOP_VIEW_SCALE;
  const bodyW = BASE_TOP_WIDTH * s;
  const bodyH = 273 * s;
  const sideW = BASE_TOP_HEIGHT * s;
  const sideWallH = 213 * s;

  const fbDoorW = 80 * s;
  const fbDoorH = 191 * s;
  const fbWindowW = 80 * s;
  const fbWindowH = 70 * s;
  const fbDoorShiftX = 30 * s;
  const fbWindowShiftX = 30 * s;
  const fbWindowY = bodyH - fbDoorH;
  const fbBackWindowX = 95 * s;

  const fbFrontDoorX = bodyW - fbWindowW - fbWindowShiftX - fbDoorW - fbDoorShiftX;
  const fbFrontWindowRightX = bodyW - fbWindowW - fbWindowShiftX;
  const fbFrontWindowLeftX = 95 * s;

  const sideDoorW = 80 * s;
  const sideDoorH = 191 * s;
  const sideWindowW = 80 * s;
  const sideWindowH = 70 * s;
  const sideDoorShiftX = 45 * s;
  const sideWindowShiftX = 45 * s;
  const sideDoorX = sideW - sideDoorW - sideDoorShiftX;
  const sideWindowX = sideW - sideDoorW - sideDoorShiftX - sideWindowW - sideWindowShiftX;
  const sideOpeningY = sideWallH - sideDoorH;

  const openings: SceneOpening[] = [];

  if (houseType === 'tipo6') {
    const frontFace: SceneOpening['face'] = tipo6FrontSide === 'bottom' ? 'back' : 'front';
    const backFace: SceneOpening['face'] = frontFace === 'front' ? 'back' : 'front';
    openings.push(
      {
        id: 'canvas-front-window-left',
        type: 'window',
        face: frontFace,
        x: fbFrontWindowLeftX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-window-right',
        type: 'window',
        face: frontFace,
        x: fbFrontWindowRightX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
      {
        id: 'canvas-front-door',
        type: 'door',
        face: frontFace,
        x: fbFrontDoorX,
        y: fbWindowY,
        width: fbDoorW,
        height: fbDoorH,
      },
      {
        id: 'canvas-back-window',
        type: 'window',
        face: backFace,
        x: fbBackWindowX,
        y: fbWindowY,
        width: fbWindowW,
        height: fbWindowH,
      },
    );
    return openings;
  }

  const hasLeftDoor = rawElements.some((e) => e.type === 'door' && e.face === 'left');
  const hasRightDoor = rawElements.some((e) => e.type === 'door' && e.face === 'right');
  const inferredOpenSide: 'left' | 'right' = hasLeftDoor ? 'left' : hasRightDoor ? 'right' : 'right';
  const openSide: 'left' | 'right' = tipo3OpenSide === 'left' || tipo3OpenSide === 'right'
    ? tipo3OpenSide
    : inferredOpenSide;

  openings.push(
    {
      id: 'canvas-tipo3-front-window',
      type: 'window',
      face: 'front',
      x: fbBackWindowX,
      y: fbWindowY,
      width: fbWindowW,
      height: fbWindowH,
    },
    {
      id: 'canvas-tipo3-back-window',
      type: 'window',
      face: 'back',
      x: fbBackWindowX,
      y: fbWindowY,
      width: fbWindowW,
      height: fbWindowH,
    },
    {
      id: `canvas-tipo3-${openSide}-window`,
      type: 'window',
      face: openSide,
      x: sideWindowX,
      y: sideOpeningY,
      width: sideWindowW,
      height: sideWindowH,
    },
    {
      id: `canvas-tipo3-${openSide}-door`,
      type: 'door',
      face: openSide,
      x: sideDoorX,
      y: sideOpeningY,
      width: sideDoorW,
      height: sideDoorH,
    },
  );

  return openings;
}
