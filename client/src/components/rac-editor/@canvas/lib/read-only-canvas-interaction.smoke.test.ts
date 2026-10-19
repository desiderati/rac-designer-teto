import {describe, expect, it, vi} from 'vitest';
import {ActiveSelection, Group, IText, Rect, type Canvas} from 'fabric';
import {bindReadOnlyCanvasInteraction} from './read-only-canvas-interaction.ts';

it('permite consulta sem transformar grupos, textos ou objetos hidratados e restaura edição', () => {
  const group = new Group([], {subTargetCheck: true, interactive: true});
  const text = new IText('Consulta', {editable: true});
  const rect = new Rect({lockMovementX: true, hasControls: false});
  const handlers = new Map<string, (event?: unknown) => void>();
  const canvas = {getObjects: () => [group, text, rect], getActiveObject: () => group,
    on: vi.fn((name, handler) => handlers.set(name, handler)), off: vi.fn()};
  const release = bindReadOnlyCanvasInteraction(canvas as unknown as Canvas);
  for (const object of [group, text, rect]) {
    expect(object.selectable).toBe(true);
    expect(object.lockMovementX).toBe(true); expect(object.lockMovementY).toBe(true);
    expect(object.lockScalingX).toBe(true); expect(object.lockRotation).toBe(true);
    expect(object.hasControls).toBe(false);
  }
  expect(text.editable).toBe(false); expect(group.subTargetCheck).toBe(false);
  const hydrated = new Rect();
  handlers.get('object:added')!({target: hydrated});
  expect(hydrated.lockMovementY).toBe(true);
  handlers.get('object:removed')!({target: hydrated});
  expect(hydrated.lockMovementY).toBe(false);
  release();
  expect(group.lockMovementX).toBe(false); expect(group.subTargetCheck).toBe(true);
  expect(group.interactive).toBe(true); expect(text.editable).toBe(true);
  expect(hydrated.lockMovementY).toBe(false);
  expect(rect.lockMovementX).toBe(true); expect(rect.hasControls).toBe(false);
  expect(canvas.off).toHaveBeenCalledTimes(4);
});

describe('multisseleção para consulta', () => {
  it('também bloqueia a transformação do contêiner da seleção', () => {
    const objects = [new Rect(), new Rect()];
    const selection: {active?: Rect | ActiveSelection} = {};
    const handlers = new Map<string, () => void>();
    const canvas = {getObjects: () => objects, getActiveObject: () => selection.active,
      on: (name: string, handler: () => void) => handlers.set(name, handler), off: vi.fn()};
    const release = bindReadOnlyCanvasInteraction(canvas as unknown as Canvas);
    const active = new ActiveSelection(objects);
    selection.active = active;
    handlers.get('selection:created')!();
    expect(active.lockMovementX).toBe(true); expect(active.lockMovementY).toBe(true);
    expect(active.lockScalingY).toBe(true); expect(active.lockRotation).toBe(true);
    release();
    expect(active.lockMovementX).toBe(false);
  });
});
