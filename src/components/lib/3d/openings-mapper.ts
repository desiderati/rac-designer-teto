import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '@/components/lib/canvas';
import {HOUSE_3D_SCALE} from '@/components/lib/3d/constants.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';
import {HouseType} from '@/shared/types/house.ts';

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
  tipo6FrontSide?: 'top' | 'bottom' | null,
  tipo3OpenSide?: 'left' | 'right' | null,
): SceneOpening[] {
  if (!houseType) return [];

  const s = HOUSE_3D_SCALE;
  const bodyW = HOUSE_BASE_WIDTH * s;
  const bodyH = HOUSE_DIMENSIONS.structure.bodyHeight * s;
  const sideW = HOUSE_BASE_HEIGHT * s;
  const sideWallH = HOUSE_DIMENSIONS.structure.wallHeight * s;

  const fbDoorW = HOUSE_DIMENSIONS.openings.common.doorWidth * s;
  const fbDoorH = HOUSE_DIMENSIONS.openings.common.doorHeight * s;
  const fbWindowW = HOUSE_DIMENSIONS.openings.common.windowWidth * s;
  const fbWindowH = HOUSE_DIMENSIONS.openings.common.windowHeight * s;
  const fbDoorShiftX = HOUSE_DIMENSIONS.openings.frontBack.doorShiftX * s;
  const fbWindowShiftX = HOUSE_DIMENSIONS.openings.frontBack.windowShiftX * s;
  const fbWindowY = bodyH - fbDoorH;
  const fbBackWindowX = HOUSE_DIMENSIONS.openings.frontBack.windowLateralX * s;

  const fbFrontDoorX = bodyW - fbWindowW - fbWindowShiftX - fbDoorW - fbDoorShiftX;
  const fbFrontWindowRightX = bodyW - fbWindowW - fbWindowShiftX;
  const fbFrontWindowLeftX = HOUSE_DIMENSIONS.openings.frontBack.windowLateralX * s;

  const sideDoorW = HOUSE_DIMENSIONS.openings.common.doorWidth * s;
  const sideDoorH = HOUSE_DIMENSIONS.openings.common.doorHeight * s;
  const sideWindowW = HOUSE_DIMENSIONS.openings.common.windowWidth * s;
  const sideWindowH = HOUSE_DIMENSIONS.openings.common.windowHeight * s;
  const sideDoorShiftX = HOUSE_DIMENSIONS.openings.side.doorShiftX * s;
  const sideWindowShiftX = HOUSE_DIMENSIONS.openings.side.windowShiftX * s;
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

  const openSide: 'left' | 'right' =
    tipo3OpenSide === 'left' || tipo3OpenSide === 'right' ? tipo3OpenSide : 'right';

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
