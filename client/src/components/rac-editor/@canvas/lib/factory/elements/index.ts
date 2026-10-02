import type {ElementStrategy, ElementStrategyKey} from './element.strategy.ts';
import {arrowStrategy} from './arrow.strategy.ts';
import {distanceStrategy} from './distance.strategy.ts';
import {doorStrategy} from './door.strategy.ts';
import {fossaStrategy} from './fossa.strategy.ts';
import {lineStrategy} from './line.strategy.ts';
import {textStrategy} from './text.strategy.ts';
import {treeStrategy} from './tree.strategy.ts';
import {wallStrategy} from './wall.strategy.ts';
import {stairsStrategy} from './stairs.strategy.ts';
import {waterStrategy} from './water.strategy.ts';
import {circleStrategy, squareStrategy, triangleStrategy} from './geometry.strategy.ts';
import {
  streetCornerStrategy,
  streetStraightStrategy,
  dirtRoadStrategy,
} from './street.strategy.ts';

export const elementStrategies: Record<ElementStrategyKey, ElementStrategy> = {
  line: lineStrategy,
  arrow: arrowStrategy,
  distance: distanceStrategy,
  wall: wallStrategy,
  streetStraight: streetStraightStrategy,
  streetCorner: streetCornerStrategy,
  dirtRoad: dirtRoadStrategy,
  square: squareStrategy,
  triangle: triangleStrategy,
  circle: circleStrategy,
  water: waterStrategy,
  stairs: stairsStrategy,
  door: doorStrategy,
  fossa: fossaStrategy,
  tree: treeStrategy,
  text: textStrategy,
};

export function getElementStrategy(key: ElementStrategyKey): ElementStrategy {
  return elementStrategies[key];
}

export type {ElementStrategy, ElementStrategyKey};
