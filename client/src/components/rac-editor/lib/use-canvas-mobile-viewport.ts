import {useLayoutEffect, useSyncExternalStore} from 'react';
import {requiredCanvasHeight, shouldCompactCanvas} from './canvas-chrome-policy.ts';

export const CANVAS_MOBILE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-height: 600px)';
const subscribers = new Set<() => void>();
const measurements = new Map<boolean, Map<string, number>>();
let labels = false;
let headerBottom = 0;
let observer: ResizeObserver | undefined;
let mutations: MutationObserver | undefined;
let media: MediaQueryList | undefined;
let frame: number | undefined;
let observed: Element[] = [];
const serverSnapshot = {mobile: false, portrait: false, landscape: false, compact: false,
  compactByHeight: false, minimumHeight: 0};
let snapshot = serverSnapshot;

function publish() {
  const mobile = window.matchMedia(CANVAS_MOBILE_QUERY).matches;
  const portrait = window.innerHeight > window.innerWidth;
  const minimumHeight = requiredCanvasHeight({headerBottom,
    railHeights: [...(measurements.get(labels)?.values() ?? [])]});
  const compactByHeight = shouldCompactCanvas(window.innerHeight, minimumHeight);
  const next = {mobile, portrait, landscape: mobile && !portrait,
    compact: mobile || compactByHeight, compactByHeight, minimumHeight};
  if (Object.keys(next).every(key => next[key as keyof typeof next] === snapshot[key as keyof typeof next])) return;
  snapshot = next;
  for (const notify of subscribers) notify();
}

function measure() {
  const header = document.getElementById('canvas-top-bar');
  const rails = [...document.querySelectorAll<HTMLElement>('[data-canvas-rail]')];
  const nodes = [header, ...rails].filter((node): node is HTMLElement => Boolean(node));
  if (nodes.length !== observed.length || nodes.some((node, index) => node !== observed[index])) {
    observer?.disconnect(); observed = nodes;
    nodes.forEach(node => observer?.observe(node));
  }
  // FABs unmount both rails. Retain their expanded sizes so resizing is stable.
  if (!window.matchMedia(CANVAS_MOBILE_QUERY).matches && !snapshot.compactByHeight) {
    const rect = header?.getBoundingClientRect();
    if (rect?.height) headerBottom = rect.bottom;
    for (const rail of rails) {
      const height = rail.getBoundingClientRect().height;
      const railLabels = rail.dataset.canvasRailLabels === 'true';
      const sizes = measurements.get(railLabels) ?? new Map<string, number>();
      if (height > 0) sizes.set(rail.dataset.canvasRail!, height);
      measurements.set(railLabels, sizes);
    }
  }
  publish();
}

function scheduleMeasure() {
  if (frame !== undefined) return;
  frame = window.requestAnimationFrame(() => {frame = undefined; measure();});
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  if (subscribers.size === 1) {
    observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleMeasure);
    mutations = new MutationObserver(scheduleMeasure);
    mutations.observe(document.body, {subtree: true, childList: true,
      attributes: true, attributeFilter: ['class', 'hidden', 'data-canvas-rail', 'data-canvas-rail-labels']});
    media = window.matchMedia(CANVAS_MOBILE_QUERY);
    media.addEventListener('change', measure);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();
  }
  return () => {
    subscribers.delete(notify);
    if (subscribers.size) return;
    observer?.disconnect(); mutations?.disconnect();
    media?.removeEventListener('change', measure);
    window.removeEventListener('resize', measure);
    window.visualViewport?.removeEventListener('resize', measure);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    observer = undefined; mutations = undefined; media = undefined; frame = undefined;
    observed = []; measurements.clear(); headerBottom = 0; labels = false; snapshot = serverSnapshot;
  };
}

/** Presentation compaction never changes native orientation or gesture policy. */
export function useCanvasMobileViewport(options: {showToolMenuLabels?: boolean} = {}) {
  const viewport = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  useLayoutEffect(() => {
    if (options.showToolMenuLabels !== undefined && options.showToolMenuLabels !== labels) {
      labels = options.showToolMenuLabels;
      // A new label composition needs an expanded measurement if it has no cache.
      publish();
    }
    measure();
  });
  return viewport;
}
