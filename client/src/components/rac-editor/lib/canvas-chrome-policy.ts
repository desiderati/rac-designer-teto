export function requiredCanvasHeight({headerBottom, railHeights, gap = 16}: {
  headerBottom: number; railHeights: readonly number[]; gap?: number;
}) {
  const tallestRail = Math.max(0, ...railHeights);
  return tallestRail > 0 ? tallestRail + 2 * (headerBottom + gap) : 0;
}

export function shouldCompactCanvas(viewportHeight: number, requiredHeight: number) {
  return requiredHeight > 0 && viewportHeight < requiredHeight;
}
