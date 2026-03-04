import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '@/shared/constants.ts';
import {HOUSE_3D_SCALE} from '@/components/rac-editor/lib/3d/constants.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {House3DElement, HouseType} from '@/shared/types/house.ts';

export function buildHouseElementsFromCanvasModel(
  houseType: HouseType,
  tipo6FrontSide?: 'top' | 'bottom' | null,
  tipo3OpenSide?: 'left' | 'right' | null,
): House3DElement[] {
  if (!houseType) return [];

  const s = HOUSE_3D_SCALE;
  const bodyW = HOUSE_BASE_WIDTH * s;
  const bodyH = HOUSE_DIMENSIONS.structure.bodyHeight * s;
  const sideW = HOUSE_BASE_HEIGHT * s;
  const sideWallH = HOUSE_DIMENSIONS.structure.wallHeight * s;

  const fbDoorW = HOUSE_DIMENSIONS.elements.common.doorWidth * s;
  const fbDoorH = HOUSE_DIMENSIONS.elements.common.doorHeight * s;
  const fbWindowW = HOUSE_DIMENSIONS.elements.common.windowWidth * s;
  const fbWindowH = HOUSE_DIMENSIONS.elements.common.windowHeight * s;
  const fbDoorShiftX = HOUSE_DIMENSIONS.elements.frontBack.doorShiftX * s;
  const fbWindowShiftX = HOUSE_DIMENSIONS.elements.frontBack.windowShiftX * s;
  const fbWindowY = bodyH - fbDoorH;
  const fbBackWindowX = HOUSE_DIMENSIONS.elements.frontBack.windowLateralX * s;

  const fbFrontDoorX = bodyW - fbWindowW - fbWindowShiftX - fbDoorW - fbDoorShiftX;
  const fbFrontWindowRightX = bodyW - fbWindowW - fbWindowShiftX;
  const fbFrontWindowLeftX = HOUSE_DIMENSIONS.elements.frontBack.windowLateralX * s;

  const sideDoorW = HOUSE_DIMENSIONS.elements.common.doorWidth * s;
  const sideDoorH = HOUSE_DIMENSIONS.elements.common.doorHeight * s;
  const sideWindowW = HOUSE_DIMENSIONS.elements.common.windowWidth * s;
  const sideWindowH = HOUSE_DIMENSIONS.elements.common.windowHeight * s;
  const sideDoorShiftX = HOUSE_DIMENSIONS.elements.side.doorShiftX * s;
  const sideWindowShiftX = HOUSE_DIMENSIONS.elements.side.windowShiftX * s;
  const sideDoorX = sideW - sideDoorW - sideDoorShiftX;
  const sideWindowX = sideW - sideDoorW - sideDoorShiftX - sideWindowW - sideWindowShiftX;
  const sideElementY = sideWallH - sideDoorH;

  const elements: House3DElement[] = [];

  if (houseType === 'tipo6') {
    const frontFace: House3DElement['face'] = tipo6FrontSide === 'bottom' ? 'back' : 'front';
    const backFace: House3DElement['face'] = frontFace === 'front' ? 'back' : 'front';
    elements.push(
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
    return elements;
  }

  const openSide: 'left' | 'right' =
    tipo3OpenSide === 'left' || tipo3OpenSide === 'right' ? tipo3OpenSide : 'right';

  elements.push(
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
      y: sideElementY,
      width: sideWindowW,
      height: sideWindowH,
    },
    {
      id: `canvas-tipo3-${openSide}-door`,
      type: 'door',
      face: openSide,
      x: sideDoorX,
      y: sideElementY,
      width: sideDoorW,
      height: sideDoorH,
    },
  );

  return elements;
}
