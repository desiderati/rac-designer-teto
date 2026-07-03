import {describe, expect, it, vi} from 'vitest';
import {getGenericObjectEditorStrategy} from './generic-object-editor-strategy.ts';
import {CanvasObject} from './canvas.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

type FakeCanvasChild = {
  type?: string;
  myType?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  visible?: boolean;
  left?: number;
  top?: number;
  scaleX?: number;
  scaleY?: number;
  set: (values: Partial<FakeCanvasChild>) => void;
};

function createChild(initial: Omit<FakeCanvasChild, 'set'>): FakeCanvasChild {
  const child: FakeCanvasChild = {
    ...initial,
    set(values) {
      Object.assign(child, values);
    },
  };
  return child;
}

function createObject(children: FakeCanvasChild[]): CanvasObject {
  return {
    getObjects: () => children,
  } as unknown as CanvasObject;
}

describe('generic-object-editor-strategy.ts', () => {
  it('aplica edição de muro mantendo fallback de cor', () => {
    const canvas = {requestRenderAll: vi.fn()};
    const wallBody = createChild({myType: 'wallBody', stroke: '#111'});
    const wallLabel = createChild({myType: 'wallLabel', text: '', fill: '#111'});

    const strategy = getGenericObjectEditorStrategy('wall');
    strategy.apply({
      canvas: canvas as never,
      object: createObject([wallBody, wallLabel]),
      color: '',
      label: 'Vizinho',
    });

    expect(wallBody.stroke).toBe(CANVAS_ELEMENT_STYLE.strokeColor.wallElement);
    expect(wallBody.fill).toBe('rgb(215, 215, 215)');
    expect(wallLabel.text).toBe('Vizinho');
    expect(wallLabel.fill).toBe(CANVAS_ELEMENT_STYLE.strokeColor.wallElement);
    expect(canvas.requestRenderAll).toHaveBeenCalledOnce();
    expect(strategy.getInfoMessage()).toBe('Objeto atualizado.');
  });

  it('aplica edição de distância em linha e label', () => {
    const canvas = {requestRenderAll: vi.fn()};
    const line = createChild({type: 'line', stroke: '#111'});
    const label = createChild({myType: 'objLabel', text: '', fill: '#111'});

    const strategy = getGenericObjectEditorStrategy('distance');
    strategy.apply({
      canvas: canvas as never,
      object: createObject([line, label]),
      color: '#f00',
      label: '1,0 m',
    });

    expect(line.stroke).toBe('#f00');
    expect(label.text).toBe('1,0 m');
    expect(label.fill).toBe('#f00');
    expect(canvas.requestRenderAll).toHaveBeenCalledOnce();
    expect(strategy.getInfoMessage()).toBe('Distância atualizada.');
  });

  it('aplica preenchimento pastel ao muro pela cor escolhida', () => {
    const canvas = {requestRenderAll: vi.fn()};
    const wallBody = createChild({myType: 'wallBody', stroke: '#111', fill: '#eee'});
    const wallLabel = createChild({myType: 'wallLabel', text: '', fill: '#111'});

    getGenericObjectEditorStrategy('wall').apply({
      canvas: canvas as never,
      object: createObject([wallBody, wallLabel]),
      color: '#ff0000',
      label: 'Casa Atual',
    });

    expect(wallBody.stroke).toBe('#ff0000');
    expect(wallBody.fill).toBe('rgb(255, 189, 189)');
    expect(wallLabel.fill).toBe('#ff0000');
  });
});
