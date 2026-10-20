import {useEffect, useRef, useState} from 'react';
import {Canvas, Circle, util} from 'fabric';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import type {CanvasObject} from '../lib/canvas.ts';
import {createConfiguredHouseViewGroup} from '../lib/house-view-groups.ts';
import {applyFieldAnalysisContraventamentos} from '../lib/field-analysis-contraventamentos.ts';
import {refreshTopDoorMarkersInViews} from '../lib/house-top-view-door-marker.ts';
import {getPilotiName} from '@/shared/types/piloti.ts';
import {createResizeObserverScheduler} from '@/shared/lib/resize-observer-scheduler.ts';

interface Target {id: string; x: number; y: number; diameter: number}

function layoutFieldAnalysisLabels(group: ReturnType<typeof createConfiguredHouseViewGroup>) {
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

/** Projeção isolada: nunca altera o documento nem a geometria real da casa. */
export function HouseFieldAnalysisPreview({draft, selectedPilotiId, onSelectPiloti, destinationPilotiIds}: {
  draft: HouseFieldAnalysisDraft; selectedPilotiId?: string; onSelectPiloti?(id: string): void;
  destinationPilotiIds?: readonly string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const element = document.createElement('canvas');
    container.prepend(element);
    const canvas = new Canvas(element, {width: 960, height: 600, selection: false, skipTargetFind: true,
      renderOnAddRemove: false, backgroundColor: '#fff'});
    const group = createConfiguredHouseViewGroup({canvas, viewType: 'top', instanceId: 'field-analysis-preview',
      pilotis: draft.house.pilotis, terrainType: draft.house.terrainType});
    refreshTopDoorMarkersInViews({houseType: draft.house.houseType, sideMappings: draft.house.sideMappings,
      preAssignedSides: draft.house.preAssignedSides, topViews: [{instanceId: 'field-analysis-preview', group}]});
    const circles = styleFieldAnalysisPilotis(group, selectedPilotiId);
    applyFieldAnalysisContraventamentos(group, draft.contraventamentos);
    const objects = group.getObjects() as CanvasObject[];
    const labels = objects.filter((object) => object.isPilotiNameLabel || object.isPilotiText || (object.isPilotiNivelText && object.visible))
      .map((label) => ({label, fontSize: Number((label as CanvasObject & {fontSize: number}).fontSize)}));
    const visibleBounds = () => {
      const bounds = objects.filter((object) => object.visible).map((object) => object.getBoundingRect());
      const left = Math.min(...bounds.map((rect) => rect.left));
      const top = Math.min(...bounds.map((rect) => rect.top));
      return {left, top, width: Math.max(...bounds.map((rect) => rect.left + rect.width)) - left,
        height: Math.max(...bounds.map((rect) => rect.top + rect.height)) - top};
    };
    group.set({selectable: false, evented: false});
    canvas.add(group);
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.min(400, Math.max(220, width * .62));
      canvas.setDimensions({width, height});
      let bounds = visibleBounds();
      let scale = Math.min((width - 16) / bounds.width, (height - 16) / bounds.height);
      for (let pass = 0; pass < 2; pass++) {
        labels.forEach(({label, fontSize}) => label.set({fontSize: Math.max(fontSize, (label.isPilotiText ? 12 : 10) / scale)}));
        layoutFieldAnalysisLabels(group);
        bounds = visibleBounds();
        scale = Math.min((width - 16) / bounds.width, (height - 16) / bounds.height);
      }
      canvas.setViewportTransform([scale, 0, 0, scale,
        (width - bounds.width * scale) / 2 - bounds.left * scale,
        (height - bounds.height * scale) / 2 - bounds.top * scale]);
      canvas.requestRenderAll();
      setTargets(circles.map((circle) => {
        const point = util.transformPoint(circle.getCenterPoint(), canvas.viewportTransform);
        return {id: circle.pilotiId!, x: point.x, y: point.y,
          diameter: Math.max(44, (circle as unknown as Circle).radius * 4 * scale)};
      }));
    };
    fit();
    const scheduler = createResizeObserverScheduler(fit);
    const observer = new ResizeObserver(scheduler.schedule);
    observer.observe(container);
    return () => {
      disposed = true;
      observer.disconnect();
      scheduler.cancel();
      void canvas.dispose().then(() => element.remove());
    };
  }, [draft, selectedPilotiId]);
  return <div ref={containerRef} aria-label='Planta da casa: selecione um piloti' className='relative w-full min-w-0 overflow-hidden'>
    {targets.map(({id, x, y, diameter}) => <button key={id} type='button' aria-label={`Selecionar piloti ${getPilotiName(id)}`}
      aria-pressed={id === selectedPilotiId}
      disabled={destinationPilotiIds !== undefined && !destinationPilotiIds.includes(id)} onClick={() => onSelectPiloti?.(id)}
      style={{left: x, top: y, width: diameter, height: diameter, transform: 'translate(-50%, -50%)'}}
      className={`absolute z-10 touch-manipulation rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${destinationPilotiIds?.includes(id) ? 'ring-2 ring-blue-500 bg-blue-100/30' : ''}`} />) }
  </div>;
}
