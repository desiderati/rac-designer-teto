/** Aproxima grupos pequenos sem reduzir os alvos de toque ou espalhar nomes sobre outros itens. */
export function getRadialMenuPositions(count: number, side: 'left' | 'right', viewportHeight: number) {
  const availableRadius = Math.min(155, Math.max(90, (viewportHeight - 100) / 2));
  const compactRadii = [56, 68, 84, 100, 116];
  // Distribuir por ângulo permite reduzir o raio sem perder folga. A corda entre vizinhos
  // deve medir ao menos 50 px: alvo de 44 px mais 6 px de espaço livre.
  const minimumRadius = count >= 4 ? 50 / (2 * Math.sin(Math.PI / (2 * (count - 1)))) : 0;
  const radius = count < 4
    ? Math.min(availableRadius, compactRadii[count - 1] ?? availableRadius)
    : Math.max(minimumRadius, Math.min(availableRadius, compactRadii[count - 1] ?? availableRadius));
  const positions = Array.from({length: count}, (_, index) => {
    const angle = count === 1 ? 0
      : count <= 3 ? -Math.PI / 3 + (2 * Math.PI / 3) * index / (count - 1)
        : -Math.PI / 2 + Math.PI * index / (count - 1);
    const y = Math.sin(angle) * radius;
    const x = (side === 'left' ? 1 : -1) * Math.sqrt(Math.max(0, radius * radius - y * y));
    return {x, y};
  });
  return positions.map(({x, y}, index) => {
    const next = positions[y < 0 ? index + 1 : index - 1];
    // Os nomes das pontas não podem cobrir os círculos vizinhos, em nenhum dos menus.
    const labelY = next && count >= 4
      ? y < 0 ? Math.min(y, next.y - 38) : Math.max(y, next.y + 38) : y;
    return {x, y, labelOffsetY: labelY - y};
  });
}
