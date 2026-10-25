import {Circle} from 'fabric';
import type {CanvasObject} from './canvas.ts';
import type {createConfiguredHouseViewGroup} from './house-view-groups.ts';

export function layoutFieldAnalysisLabels(group: ReturnType<typeof createConfiguredHouseViewGroup>) {
  const objects = group.getObjects() as CanvasObject[];
  const gap = 4;
  const topLevelHeight = Math.max(0, ...objects
    .filter((object) => object.isPilotiNivelText && object.visible && object.pilotiId?.endsWith('_0'))
    .map((object) => object.height));
  for (const circle of objects.filter((object) => object.isPilotiCircle && object instanceof Circle)) {
    const radius = (circle as unknown as Circle).radius;
    const isRowA = circle.pilotiId?.endsWith('_0');
    const name = objects.find((object) => object.isPilotiNameLabel && object.pilotiId === circle.pilotiId);
    // Reservar a faixa do nível em toda a linha A mantém os quatro IDs alinhados.
    const nameBottom = circle.top - radius - (isRowA ? gap + topLevelHeight + 2 : 8);
    if (name) name.set({top: nameBottom - name.height / 2});
    const nivel = objects.find((object) => object.isPilotiNivelText && object.pilotiId === circle.pilotiId);
    if (nivel?.visible) nivel.set({top: isRowA
      ? circle.top - radius - gap - nivel.height / 2
      : circle.top + radius + gap + nivel.height / 2});
  }
  objects.forEach((object) => object.setCoords());
}

export function styleFieldAnalysisPilotis(group: ReturnType<typeof createConfiguredHouseViewGroup>, selectedPilotiId?: string) {
  const objects = group.getObjects() as CanvasObject[];
  const circles = objects.filter((object) => object.isPilotiCircle && object instanceof Circle);
  // Conservar a grade; deslocar somente a representação da linha de borda pelo delta do raio.
  for (const circle of circles) {
    const radius = (circle as unknown as Circle).radius;
    const row = Number(circle.pilotiId?.split('_')[2]);
    const delta = radius * .75;
    const dy = row === 0 ? delta : row === 2 ? -delta : 0;
    circle.set({radius: radius * 1.75, top: circle.top + dy,
      ...(circle.pilotiId === selectedPilotiId ? {stroke: '#3b82f6', strokeWidth: 4} : {})});
    objects.filter((object) => object.pilotiId === circle.pilotiId && object.isPilotiText)
      .forEach((object) => {
        const text = object as CanvasObject & {fontSize: number};
        text.set({top: text.top + dy, fontSize: text.fontSize * 1.35, fontWeight: 'bold'});
      });
  }
  objects.filter((object) => object.isPilotiNameLabel).forEach((object) => {
    const text = object as CanvasObject & {fontSize: number};
    text.set({fontSize: text.fontSize * 1.2});
  });
  layoutFieldAnalysisLabels(group);
  return circles;
}
