// Caracterização diagnóstica; não altera aplicação, testes ou dados persistidos.
import {JSDOM} from 'jsdom';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = new URL('../../../../', import.meta.url);
const source = 'client/src/components/rac-editor/@canvas/lib/contraventamento.ts';
const sourceSha256 = createHash('sha256').update(readFileSync(new URL(source, root))).digest('hex');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {url: 'http://localhost'});
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const {createHouseTop} = await import(new URL('client/src/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts', root));
const {refreshHouseViewReferenceMarkersInViews} = await import(new URL('client/src/components/rac-editor/@canvas/lib/factory/house/house-view-reference-marker.ts', root));
const {addContraventamentoBeam, addHorizontalContraventamentoBeam} = await import(new URL(source, root));
const {Group, Rect} = await import('fabric');

function markers(top) {
  const elevation = () => new Group([new Rect({width: 305, height: 120, originX: 'center', originY: 'center'})]);
  refreshHouseViewReferenceMarkersInViews({
    houseType: 'tipo6',
    sideMappings: {top: 'front', left: 'side1', bottom: null, right: null},
    topViews: [{instanceId: 'top_1', group: top}],
    elevationViews: {
      front: [{instanceId: 'front_2', side: 'top', group: elevation()}],
      side1: [{instanceId: 'side1_3', side: 'left', group: elevation()}],
      back: [], side2: [],
    },
  });
}

function characterize(name, before, after, horizontal = false) {
  const top = createHouseTop({width: 1000, height: 800});
  before?.(top);
  const sides = horizontal ? ['top', 'bottom'] : ['left', 'right'];
  for (const side of sides) {
    if (horizontal) addHorizontalContraventamentoBeam(top, {col: 0, row: 1}, {col: 3, row: 1}, {side});
    else addContraventamentoBeam(top, {col: 0, row: 0}, {col: 0, row: 2}, {side});
  }
  after?.(top);
  const objects = top.getObjects();
  const body = objects.find(object => object.isHouseBody);
  const piloti = objects.find(object => object.isPilotiCircle && object.pilotiId === (horizontal ? 'piloti_0_1' : 'piloti_0_0'));
  const center = piloti.getRelativeCenterPoint();
  const radius = piloti.radius;
  return {
    name,
    bodyCenter: body.getRelativeCenterPoint(),
    pilotiCenter: center,
    beams: objects.filter(object => object.isContraventamento).map(beam => {
      const side = beam.contraventamentoSide;
      const expectedLeft = horizontal ? center.x : center.x + (side === 'left' ? -radius - beam.width : radius);
      const expectedTop = horizontal ? center.y + (side === 'top' ? -radius - beam.height : radius) : center.y;
      const dx = beam.left - expectedLeft;
      const dy = beam.top - expectedTop;
      return {side, left: beam.left, top: beam.top, expectedLeft, expectedTop, dx, dy, aligned: Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7};
    }),
  };
}

const evidence = {
  capturedAt: new Date().toISOString(),
  boundary: 'Factory e geometria reais do Fabric em JSDOM, sem UI/controle/autosave',
  source, sourceSha256,
  cases: [
    characterize('controle: sem marcadores'),
    characterize('vertical: marcadores antes da inserção', markers),
    characterize('controle: marcadores depois da inserção', undefined, markers),
    characterize('horizontal: marcadores antes da inserção', markers, undefined, true),
    characterize('vertical: escala e rotação após marcadores', top => {markers(top); top.set({angle: 17, scaleX: 1.3, scaleY: 0.8});}),
  ],
};
const output = new URL('./evidence.json', import.meta.url);
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({output: fileURLToPath(output), ...evidence}, null, 2));
