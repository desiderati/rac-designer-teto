import {useEffect, useRef} from 'react';
import {Canvas} from 'fabric';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import {createConfiguredHouseViewGroup} from '../lib/house-view-groups.ts';
import {applyFieldAnalysisContraventamentos} from '../lib/field-analysis-contraventamentos.ts';
import {refreshTopDoorMarkersInViews} from '../lib/house-top-view-door-marker.ts';

export function HouseFieldAnalysisPreview({draft}: {draft: HouseFieldAnalysisDraft}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const element = document.createElement('canvas');
    container.appendChild(element);
    const canvas = new Canvas(element, {
      width: 960, height: 600, selection: false, skipTargetFind: true,
      renderOnAddRemove: false, backgroundColor: '#f8fafc',
    });
    const group = createConfiguredHouseViewGroup({
      canvas, viewType: 'top', instanceId: 'field-analysis-preview',
      pilotis: draft.house.pilotis, terrainType: draft.house.terrainType,
    });
    refreshTopDoorMarkersInViews({
      houseType: draft.house.houseType, sideMappings: draft.house.sideMappings,
      preAssignedSides: draft.house.preAssignedSides,
      topViews: [{instanceId: 'field-analysis-preview', group}],
    });
    applyFieldAnalysisContraventamentos(group, draft.contraventamentos);
    group.set({selectable: false, evented: false});
    canvas.add(group);
    const fit = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.min(340, Math.max(220, width * .6));
      canvas.setDimensions({width, height});
      const bounds = group.getBoundingRect();
      const scale = Math.min((width - 24) / bounds.width, (height - 24) / bounds.height);
      canvas.setViewportTransform([scale, 0, 0, scale,
        (width - bounds.width * scale) / 2 - bounds.left * scale,
        (height - bounds.height * scale) / 2 - bounds.top * scale]);
      canvas.requestRenderAll();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => {
      observer.disconnect();
      void canvas.dispose();
      container.replaceChildren();
    };
  }, [draft]);
  return <div ref={containerRef} role='img' aria-label='Planta superior ilustrativa da casa, sem interação'
    className='pointer-events-none w-full min-w-0 overflow-hidden rounded-lg'/>;
}
