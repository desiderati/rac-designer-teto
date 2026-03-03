export interface ResolvePilotiHeightSegmentsParams {
  nominalHeight: number;
  minHeightToTouchTerrain: number;
  hideBelowTerrain: boolean;
  minVisibleHeightWhenHidden?: number;
}

interface PilotiHeightSegments {
  fullHeight: number;
  visibleHeight: number;
  topVisibleHeight: number;
  bottomVisibleHeight: number;
}

export function resolvePilotiHeightSegments({
  nominalHeight,
  minHeightToTouchTerrain,
  hideBelowTerrain,
  minVisibleHeightWhenHidden = 0,
}: ResolvePilotiHeightSegmentsParams): PilotiHeightSegments {

  const normalizedMinHeight = Math.max(minHeightToTouchTerrain, 0);
  const normalizedMinVisibleHeightWhenHidden = Math.max(minVisibleHeightWhenHidden, 0);
  const fullHeight = Math.max(nominalHeight, normalizedMinHeight, 0.5);

  const visibleCutHeight = hideBelowTerrain
    ? Math.max(normalizedMinHeight, normalizedMinVisibleHeightWhenHidden)
    : normalizedMinHeight;

  const visibleHeight = hideBelowTerrain
    ? Math.min(fullHeight, visibleCutHeight)
    : fullHeight;

  if (visibleHeight <= 0) {
    return {
      fullHeight,
      visibleHeight: 0,
      topVisibleHeight: 0,
      bottomVisibleHeight: 0,
    };
  }

  // Mantém a fronteira de cor na proporção do piloti completo (1/3 topo e 2/3 base),
  // mesmo quando a parte abaixo do terreno é ocultada.
  const fullTopHeight = fullHeight / 3;
  const topVisibleHeight = Math.min(fullTopHeight, visibleHeight);
  const bottomVisibleHeight = Math.max(visibleHeight - fullTopHeight, 0);

  return {fullHeight, visibleHeight, topVisibleHeight, bottomVisibleHeight};
}
