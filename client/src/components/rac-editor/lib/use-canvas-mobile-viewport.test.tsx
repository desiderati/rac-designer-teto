import {act, cleanup, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CANVAS_MOBILE_QUERY, useCanvasMobileViewport} from './use-canvas-mobile-viewport.ts';
import {requiredCanvasHeight, shouldCompactCanvas} from './canvas-chrome-policy.ts';

let coarse = false;
let plainRailHeight = 360;
const resizeObservers: Array<{callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn>}> = [];
const removeMediaListener = vi.fn();
function viewport(width: number, height: number) {
  window.innerWidth = width; window.innerHeight = height;
  act(() => {window.dispatchEvent(new Event('resize'));});
}
function Chrome({labels = false}: {labels?: boolean}) {
  const state = useCanvasMobileViewport({showToolMenuLabels: labels});
  return <>
    <div id='canvas-top-bar' hidden={state.compact}/>
    {!state.compact ? <><aside data-canvas-rail='left' data-labels={labels} data-canvas-rail-labels={labels}/><aside data-canvas-rail='right' data-canvas-rail-labels={labels}/></> : null}
    <output data-testid='state'>{JSON.stringify(state)}</output>
  </>;
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!);

beforeEach(() => {
  coarse = false; plainRailHeight = 360; resizeObservers.length = 0;
  vi.stubGlobal('innerWidth', 1280); vi.stubGlobal('innerHeight', 1000);
  vi.stubGlobal('matchMedia', (query: string) => ({media: query,
    matches: query === CANVAS_MOBILE_QUERY && (window.innerWidth <= 767 || (coarse && window.innerHeight <= 600)),
    addEventListener: vi.fn(), removeEventListener: removeMediaListener}));
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn(); observe = vi.fn(); unobserve = vi.fn();
    constructor(callback: ResizeObserverCallback) {resizeObservers.push({callback, disconnect: this.disconnect});}
  });
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function(this: HTMLElement) {
    if (this.id === 'canvas-top-bar') return {height: 48, bottom: 64} as DOMRect;
    if (this.dataset.canvasRail) return {height: this.dataset.canvasRail === 'right' ? 240 : this.dataset.labels === 'true' ? 650 : plainRailHeight} as DOMRect;
    return original.call(this);
  });
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('política compartilhada do chrome do Canvas', () => {
  it('mede a barra mais alta e usa as duas margens do cabeçalho sem compactar no limite exato', () => {
    expect(requiredCanvasHeight({headerBottom: 64, railHeights: [360, 240]})).toBe(520);
    expect(shouldCompactCanvas(520, 520)).toBe(false);
    expect(shouldCompactCanvas(519, 520)).toBe(true);
    expect(requiredCanvasHeight({headerBottom: 64, railHeights: []})).toBe(0);
  });
  it('mantém o cache quando os rails desmontam, retorna no limite e não muda a política de gestos', () => {
    render(<Chrome/>);
    expect(state()).toMatchObject({compact: false, minimumHeight: 520});
    viewport(1280, 519);
    expect(state()).toMatchObject({compact: true, compactByHeight: true, mobile: false, landscape: false, portrait: false});
    expect(document.querySelector('[data-canvas-rail]')).toBeNull();
    viewport(1280, 500);
    expect(state()).toMatchObject({compact: true, minimumHeight: 520});
    viewport(1280, 520);
    expect(state()).toMatchObject({compact: false, minimumHeight: 520});
    expect(document.querySelectorAll('[data-canvas-rail]')).toHaveLength(2);
  });
  it('recalcula ao alternar os rótulos e reaproveita o cache correto da composição', () => {
    const {rerender} = render(<Chrome/>);
    viewport(1280, 700);
    rerender(<Chrome labels/>);
    expect(state()).toMatchObject({compact: true, minimumHeight: 810});
    rerender(<Chrome/>);
    expect(state()).toMatchObject({compact: false, minimumHeight: 520});
    rerender(<Chrome labels/>);
    expect(state()).toMatchObject({compact: true, minimumHeight: 810});
  });
  it('segue a query nativa nos limites de largura e ponteiro sem transformar altura em retrato', () => {
    render(<Chrome/>);
    viewport(767, 900);
    expect(state()).toMatchObject({compact: true, mobile: true, portrait: true, landscape: false});
    viewport(768, 900);
    expect(state()).toMatchObject({compact: false, mobile: false});
    coarse = true;
    viewport(1000, 600);
    expect(state()).toMatchObject({compact: true, mobile: true, landscape: true});
    viewport(1000, 601);
    expect(state()).toMatchObject({compact: false, mobile: false, landscape: false});
  });
  it('reage à mudança de tamanho real do rail observada após a montagem', async () => {
    render(<Chrome/>);
    expect(state().minimumHeight).toBe(520);
    plainRailHeight = 400;
    await act(async () => {
      resizeObservers[0].callback([], {} as ResizeObserver);
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
    });
    expect(state().minimumHeight).toBe(560);
    viewport(1280, 559);
    expect(state().compact).toBe(true);
  });
  it('desliga observers e listeners ao desmontar e não deixa medidas antigas na próxima montagem', () => {
    const {unmount} = render(<Chrome labels/>);
    expect(state().minimumHeight).toBe(810);
    const observer = resizeObservers[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
    expect(removeMediaListener).toHaveBeenCalledWith('change', expect.any(Function));
    render(<Chrome/>);
    expect(state().minimumHeight).toBe(520);
  });
});
