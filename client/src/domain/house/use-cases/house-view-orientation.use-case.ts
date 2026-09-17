import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {resolveDoorSideCornerIds} from '@/shared/types/piloti.ts';

export interface HouseElevationOrientationInput {
  houseSide?: HouseSide | null;
  houseView?: string | null;
  houseViewType?: HouseViewType | string | null;
  isFlippedHorizontally?: boolean | null;
  isRightSide?: boolean | null;
}

export interface HouseElevationAxisContext {
  side: HouseSide;
  reverseAxis: boolean;
}

function isHouseSide(value: unknown): value is HouseSide {
  return value === 'top'
    || value === 'bottom'
    || value === 'left'
    || value === 'right';
}

function resolveAxisFromSide(side: HouseSide): HouseElevationAxisContext {
  return {
    side,
    reverseAxis: side === 'top' || side === 'right',
  };
}

/**
 * Resolve o lado lógico de uma elevação a partir dos metadados da vista.
 *
 * Durante a transição, os metadados legados (`houseView`, `isRightSide` e
 * `isFlippedHorizontally`) têm precedência para preservar o comportamento já
 * renderizado. Quando eles não existem, `houseSide` passa a ser a fonte.
 */
export function resolveHouseElevationAxisContext(
  input: HouseElevationOrientationInput,
): HouseElevationAxisContext | null {
  const legacyHouseView = String(input.houseView ?? '');

  if (legacyHouseView === 'front' || legacyHouseView === 'back') {
    const isFlipped = Boolean(input.isFlippedHorizontally);
    return {side: isFlipped ? 'top' : 'bottom', reverseAxis: isFlipped};
  }

  if (legacyHouseView === 'side') {
    const isRight = Boolean(input.isRightSide);
    return {side: isRight ? 'right' : 'left', reverseAxis: isRight};
  }

  if (isHouseSide(input.houseSide)) {
    return resolveAxisFromSide(input.houseSide);
  }

  const viewType = String(input.houseViewType ?? '');
  if (viewType === 'front' || viewType === 'back') return resolveAxisFromSide('bottom');
  if (viewType === 'side1' || viewType === 'side2') return resolveAxisFromSide('left');

  return null;
}

/**
 * Resolve os IDs dos pilotis extremos da elevação na ordem visual esquerda/direita.
 */
export function resolveHouseElevationCornerPilotiIds(
  input: HouseElevationOrientationInput,
): { leftId: string; rightId: string } | null {
  const axisContext = resolveHouseElevationAxisContext(input);
  if (!axisContext) return null;

  const cornerIds = resolveDoorSideCornerIds(axisContext.side);
  if (!axisContext.reverseAxis) return cornerIds;

  return {
    leftId: cornerIds.rightId,
    rightId: cornerIds.leftId,
  };
}
