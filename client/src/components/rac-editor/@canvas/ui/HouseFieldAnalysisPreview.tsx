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
      .forEach((object) => object.set({top: object.top + dy}));
    objects.filter((object) => object.pilotiId === circle.pilotiId && object.isPilotiNameLabel)
      .forEach((object) => object.set({top: object.top + (row === 2 ? -2 * delta - 4 : row === 0 ? 2 * delta + 4 : delta + 4)}));
  }
  objects.filter((object) => object.isPilotiNameLabel).forEach((object) => {
    const text = object as CanvasObject & {fontSize: number};
    text.set({fontSize: text.fontSize * 1.2});
  });
  return circles;
}

/** Projeção isolada: nunca altera o documento nem a geometria real da casa. */
export function HouseFieldAnalysisPreview({draft, selectedPilotiId, onSelectPiloti}: {
  draft: HouseFieldAnalysisDraft; selectedPilotiId?: string; onSelectPiloti?(id: string): void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const element = document.createElement('canvas');
    container.prepend(element);
    const canvas = new Canvas(element, {width: 960, height: 600, selection: false, skipTargetFind: true,
      renderOnAddRemove: false, backgroundColor: '#f8fafc'});
    const group = createConfiguredHouseViewGroup({canvas, viewType: 'top', instanceId: 'field-analysis-preview',
      pilotis: draft.house.pilotis, terrainType: draft.house.terrainType});
    refreshTopDoorMarkersInViews({houseType: draft.house.houseType, sideMappings: draft.house.sideMappings,
      preAssignedSides: draft.house.preAssignedSides, topViews: [{instanceId: 'field-analysis-preview', group}]});
    applyFieldAnalysisContraventamentos(group, draft.contraventamentos);
    const circles = styleFieldAnalysisPilotis(group, selectedPilotiId);
    const labels = (group.getObjects() as CanvasObject[]).filter((object) => object.isPilotiNameLabel)
      .map((label) => ({label, fontSize: Number((label as CanvasObject & {fontSize: number}).fontSize)}));
    group.set({selectable: false, evented: false});
    canvas.add(group);
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.min(400, Math.max(220, width * .62));
      canvas.setDimensions({width, height});
      const bounds = group.getBoundingRect();
      const scale = Math.min((width - 16) / bounds.width, (height - 16) / bounds.height);
      labels.forEach(({label, fontSize}) => label.set({fontSize: Math.max(fontSize, 10 / scale)}));
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
      aria-pressed={id === selectedPilotiId} onClick={() => onSelectPiloti?.(id)}
      style={{left: x, top: y, width: diameter, height: diameter, transform: 'translate(-50%, -50%)'}}
      className='absolute z-10 touch-manipulation rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'/>) }
  </div>;
}
