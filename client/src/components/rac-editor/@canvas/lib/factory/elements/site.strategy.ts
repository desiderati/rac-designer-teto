import {Canvas as FabricCanvas, Group, IText, Line, Path, Polygon, Rect, type FabricObject} from 'fabric';
import {CANVAS_STYLE} from '@/shared/config.ts';
import type {BuildingDoorSide, SiteElementKey} from '@shared/types/site-element.ts';
import type {CanvasGroup} from '../../canvas.ts';
import type {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';

const INK = '#475569';
const TIMBER = '#c7a779';
const strokeOptions = {stroke: INK, strokeWidth: 1.5, fill: 'transparent', selectable: false, evented: false};
const roofSegments: Array<[number, number, number, number]> = [
  [50, 55, 190, 55], [0, 0, 50, 55], [0, 110, 50, 55],
  [240, 0, 190, 55], [240, 110, 190, 55],
];
const roofCourses = [12, 24, 36, 74, 86, 98];

function mark<T extends FabricObject>(object: T, kind = 'siteDetail'): T {
  setCanvasObjectMyType(object, kind);
  return object;
}

function label(text: string, left: number, top: number): IText {
  return mark(new IText(text, {
    left, top, fontFamily: CANVAS_STYLE.fontFamily, fontSize: CANVAS_STYLE.fontSize,
    fill: INK, textAlign: 'center', originX: 'center', originY: 'center',
    selectable: false, evented: false, visible: Boolean(text),
  }), 'siteLabel');
}

function group(canvas: FabricCanvas, objects: FabricObject[], kind: string): CanvasGroup {
  const result = setCanvasGroupMyType(new Group(objects, {
    left: canvas.width! / 2, top: canvas.height! / 2,
    originX: 'center', originY: 'center', subTargetCheck: false,
  }), kind);
  refreshSiteElementGeometry(result);
  result.set({left: canvas.width! / 2, top: canvas.height! / 2});
  return result;
}

function createHouse(canvas: FabricCanvas): CanvasGroup {
  const roof = mark(new Rect({left: 0, top: 0, width: 240, height: 160,
    ...strokeOptions, fill: '#d9a27d', stroke: '#80563e'}), 'siteBody');
  const lines = roofSegments.map(points => mark(new Line(points, {...strokeOptions, stroke: '#80563e', strokeWidth: 2})));
  const courses = roofCourses.map(y =>
    mark(new Line([0, y, 240, y], {...strokeOptions, stroke: '#ae7956', strokeWidth: 0.5})),
  );
  const name = label('Casa', 120, 120);
  name.set({backgroundColor: 'rgba(255,255,255,0.55)'});
  const house = group(canvas, [roof, ...courses, ...lines, name], 'siteHouse');
  fitSiteLabel(house);
  return house;
}

function createBuilding(canvas: FabricCanvas, side: BuildingDoorSide): CanvasGroup {
  // Mantém a mesma área inicial ao trocar somente o lado da porta.
  const vertical = side === 'left' || side === 'right';
  const width = vertical ? 110 : 130;
  const height = vertical ? 130 : 110;
  const start = width / 2 - 20;
  const end = width / 2 + 20;
  const walls = mark(new Path(`M 0 0 H ${width} V ${height} H ${end} M ${start} ${height} H 0 V 0`, {
    ...strokeOptions, strokeWidth: 4,
  }), 'siteBody');
  const leaf = mark(new Line([end, height, end, height - 40], {...strokeOptions}));
  const arc = mark(new Path(`M ${start} ${height} A 40 40 0 0 1 ${end} ${height - 40}`, {
    ...strokeOptions, strokeWidth: 1, strokeDashArray: [3, 3],
  }));
  const shell = new Group([walls, leaf, arc], {left: 0, top: 0, originX: 'center', originY: 'center'});
  shell.set({angle: {bottom: 0, top: 180, left: 90, right: -90}[side]});
  mark(shell, 'siteBody');
  const building = group(canvas, [shell, label('Banheiro', 0, 0)], 'siteBuilding');
  building.siteElementVariant = side;
  fitSiteLabel(building);
  return building;
}

/** Ajusta nomes compridos ao corpo; a escala do grupo continua escalando o texto. */
export function fitSiteLabel(object: CanvasGroup): void {
  if (object.myType === 'terrainEntry') {positionEntryLabel(object); return;}
  if (object.myType !== 'siteHouse' && object.myType !== 'siteBuilding') return;
  const children = object.getCanvasObjects();
  const body = children.find(child => child.myType === 'siteBody');
  const name = children.find(child => child.myType === 'siteLabel') as IText | undefined;
  if (!body || !name) return;
  const width = Math.abs(body.angle % 180) === 90 ? body.height : body.width;
  name.set({fontSize: CANVAS_STYLE.fontSize});
  name.initDimensions();
  const available = Math.max(1, width - 20);
  if (name.width > available) {
    name.set({fontSize: CANVAS_STYLE.fontSize * available / name.width});
    name.initDimensions();
  }
}

function createEntry(canvas: FabricCanvas, angle: number): CanvasGroup {
  const arrow = mark(new Polygon([
    {x: 0, y: -50}, {x: 20, y: -22}, {x: 7, y: -22},
    {x: 7, y: 40}, {x: -7, y: 40}, {x: -7, y: -22}, {x: -20, y: -22},
  ], {fill: INK, stroke: INK, originX: 'center', originY: 'center', angle}), 'siteBody');
  const entry = group(canvas, [arrow, label('Entrada no Terreno', 0, 70)], 'terrainEntry');
  entry.siteElementVariant = String(angle);
  return entry;
}

const ENTRY_LABEL_GAP = 16;

function positionEntryLabel(entry: CanvasGroup): void {
  const children = entry.getCanvasObjects();
  const arrow = children.find(child => child.myType === 'siteBody');
  const name = children.find(child => child.myType === 'siteLabel') as IText | undefined;
  if (!arrow || !name) return;
  const angle = ((arrow.angle % 360) + 360) % 360;
  const vertical = angle % 180 === 0;
  const center = arrow.getRelativeCenterPoint();
  name.set({fontSize: CANVAS_STYLE.fontSize * (vertical ? 1.2 : 1), originX: 'center', originY: 'center'});
  name.initDimensions();
  const span = vertical ? arrow.getScaledHeight() : arrow.getScaledWidth();
  const offset = span / 2 + ENTRY_LABEL_GAP + name.getScaledHeight() / 2;
  name.set({left: center.x, top: center.y + (angle === 180 ? -offset : offset)});
}

/** Corrige a geometria também nos grupos existentes, sem recriar objetos ou seus nomes/IDs. */
export function refreshSiteElementGeometry(object: CanvasGroup): void {
  if (!['siteHouse', 'siteBuilding', 'terrainEntry'].includes(object.myType)) return;
  const children = object.getCanvasObjects();
  const body = children.find(child => child.myType === 'siteBody');
  if (!body) return;
  const anchor = body.getCenterPoint();
  if (object.myType === 'terrainEntry') positionEntryLabel(object);
  if (object.myType === 'siteHouse') {
    const center = body.getRelativeCenterPoint();
    body.set({left: center.x, top: center.y, originX: 'center', originY: 'center',
      strokeUniform: true, strokeWidth: 2, strokeLineJoin: 'miter'});
    const segments = [...roofCourses.map(y => [0, y, 240, y]), ...roofSegments];
    children.filter(child => child.type === 'line').forEach((line, i) => {
      // Fabric serializa os endpoints relativos ao centro de cada Line. A geometria do telhado
      // é canônica e não pode ser deduzida desses endpoints depois da reabertura.
      const points = segments[i];
      if (!points) return;
      const [x1, y1, x2, y2] = points.map((value, index) => value * (index % 2 ? body.height / 110 : body.width / 240));
      line.set({x1, y1, x2, y2,
        left: center.x + (x1 + x2) / 2 - body.width / 2,
        top: center.y + (y1 + y2) / 2 - body.height / 2,
        originX: 'center', originY: 'center', strokeUniform: true, strokeLineCap: 'round'});
    });
  }
  if (object.myType === 'siteBuilding') {
    const walls = body.getObjects?.().find(child => child.myType === 'siteBody') as Path | undefined;
    if (walls) {
      const width = walls.width, height = walls.height;
      // Um único percurso aberto apenas no vão da porta une as quatro quinas.
      walls.set({path: [['M', width / 2 + 20, height], ['L', width, height], ['L', width, 0],
        ['L', 0, 0], ['L', 0, height], ['L', width / 2 - 20, height]], strokeLineJoin: 'miter'});
      walls.dirty = true;
      body.dirty = true;
    }
  }
  object.triggerLayout();
  const next = body.getCenterPoint();
  object.set({left: object.left + anchor.x - next.x, top: object.top + anchor.y - next.y});
  object.setCoords();
  children.forEach(child => child.setCoords());
}

function createFence(canvas: FabricCanvas): CanvasGroup {
  const body = mark(new Rect({width: 240, height: 12, left: 0, top: 0,
    originX: 'center', originY: 'center', fill: 'transparent', strokeWidth: 0}), 'fenceBody');
  const wires = [-2, 2].map(y => mark(new Line([-120, y, 120, y], {
    ...strokeOptions, stroke: '#806448', originX: 'center', originY: 'center',
  }), 'fenceWire'));
  const posts = Array.from({length: 7}, (_, i) => mark(new Rect({
    left: -120 + i * 40, top: 0, width: 10, height: 10, fill: TIMBER,
    stroke: '#806448', strokeWidth: 1.5, originX: 'center', originY: 'center',
  }), 'fencePost'));
  const fence = group(canvas, [body, ...wires, ...posts, label('', 0, 0)], 'fence');
  fence.set({lockScalingFlip: true});
  bindFenceScaling(fence);
  return fence;
}

/** Mantém postes e texto legíveis ao alongar a cerca, inclusive depois de reabrir. */
export function bindFenceScaling(fence: CanvasGroup): void {
  withScalingGuard(fence, function () {
    const children = fence.getCanvasObjects();
    const body = children.find(o => o.myType === 'fenceBody');
    if (!body) return;
    const center = body.getCenterPoint();
    const width = Math.max(24, body.width * Math.abs(fence.scaleX));
    const height = Math.max(6, body.height * Math.abs(fence.scaleY));
    const postSize = Math.max(5, height - 2);
    body.set({left: 0, top: 0, width, height});
    children.filter(o => o.myType === 'fenceWire').forEach((wire, i) => {
      wire.set({x1: -width / 2, x2: width / 2, y1: (i ? 1 : -1) * height / 6,
        y2: (i ? 1 : -1) * height / 6, left: 0, top: (i ? 1 : -1) * height / 6});
    });
    const posts = children.filter(o => o.myType === 'fencePost');
    posts.forEach((post, i) => post.set({left: -width / 2 + i * width / (posts.length - 1),
      top: 0, width: postSize, height: postSize}));
    const name = children.find(o => o.myType === 'siteLabel');
    name?.set({left: 0, top: name.text?.trim() ? height / 2 + 18 : 0});
    fence.set({scaleX: 1, scaleY: 1});
    fence.triggerLayout();
    const next = body.getCenterPoint();
    fence.set({left: fence.left + center.x - next.x, top: fence.top + center.y - next.y});
    fence.setCoords();
  });
}

function createGate(canvas: FabricCanvas): CanvasGroup {
  const post = (left: number) => mark(new Rect({left, top: 0, width: 10, height: 10,
    originX: 'center', originY: 'center', fill: TIMBER, stroke: INK, strokeWidth: 1.5}), 'gatePost');
  const posts = [post(0), post(90)];
  const parts = [
    mark(new Rect({...strokeOptions, left: -3, top: -95, width: 6, height: 90}), 'gateLeaf'),
    mark(new Path('M 0 -95 A 90 90 0 0 1 90 -5', {...strokeOptions, strokeDashArray: [4, 4]})),
  ];
  const result = group(canvas, [...parts, ...posts], 'siteGate');
  result.siteElementVariant = 'swing';
  return result;
}

export const siteElementStrategies: Record<SiteElementKey, ElementStrategy> = {
  siteHouse: {create: createHouse},
  buildingTop: {create: canvas => createBuilding(canvas, 'top')},
  buildingBottom: {create: canvas => createBuilding(canvas, 'bottom')},
  buildingLeft: {create: canvas => createBuilding(canvas, 'left')},
  buildingRight: {create: canvas => createBuilding(canvas, 'right')},
  fence: {create: createFence},
  entryUp: {create: canvas => createEntry(canvas, 0)},
  entryRight: {create: canvas => createEntry(canvas, 90)},
  entryDown: {create: canvas => createEntry(canvas, 180)},
  entryLeft: {create: canvas => createEntry(canvas, 270)},
  gateSwing: {create: createGate},
};
