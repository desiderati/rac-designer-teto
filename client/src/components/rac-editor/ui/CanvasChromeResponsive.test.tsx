import {act, cleanup, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import {CanvasToolsMenu} from '../@menus/ui/CanvasToolsMenu.tsx';
import {HouseDifficultyControls} from './HouseDifficultyControls.tsx';
import type {MenuActionMap} from '../@menus/lib/menu-types.ts';
import {CANVAS_MOBILE_QUERY, useCanvasMobileViewport} from '../lib/use-canvas-mobile-viewport.ts';

const actions = new Proxy({}, {get: () => () => undefined}) as MenuActionMap;
const count = {current: 0, max: 1};
function Chrome({labels = false}: {labels?: boolean}) {
  const {compact, minimumHeight, mobile} = useCanvasMobileViewport();
  return <TooltipProvider>
    <div id='canvas-top-bar' hidden={compact}/>
    <CanvasToolsMenu actions={actions} isDrawing={false} activeSubmenu={null} houseType='tipo6'
      frontViewCount={count} backViewCount={count} side1ViewCount={count} side2ViewCount={count}
      isMobile={false} showToolMenuLabels={labels}/>
    <HouseDifficultyControls indicator={{score: 36, label: 'Média', level: 'medium'}}
      enableMobileCollapse showToolMenuLabels={labels}/>
    <output data-testid='chrome-policy'>{JSON.stringify({compact, minimumHeight, mobile})}</output>
  </TooltipProvider>;
}
beforeEach(() => {
  vi.stubGlobal('innerWidth', 1280); vi.stubGlobal('innerHeight', 900);
  vi.stubGlobal('matchMedia', (query: string) => ({media: query,
    matches: query === CANVAS_MOBILE_QUERY && window.innerWidth <= 767,
    addEventListener: vi.fn(), removeEventListener: vi.fn()}));
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function(this: HTMLElement) {
    if (this.id === 'canvas-top-bar') return {height: 48, bottom: 64} as DOMRect;
    if (this.dataset.canvasRail) return {height: this.dataset.canvasRail === 'right' ? 240
      : this.dataset.canvasRailLabels === 'true' ? 650 : 360} as DOMRect;
    return original.call(this);
  });
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
const resize = (height: number) => act(() => {window.innerHeight = height; window.dispatchEvent(new Event('resize'));});
function expectFabs() {
  expect(screen.getByRole('button', {name: 'Ferramentas do Canvas'})).toBeVisible();
  expect(screen.getByRole('button', {name: 'Dificuldade da casa'})).toBeVisible();
  expect(document.querySelectorAll('[data-canvas-rail]')).toHaveLength(0);
}

describe('consumidores reais da compactação do Canvas', () => {
  it('troca ambos os rails por FABs por altura, conserva o limite e retorna sem oscilação', () => {
    render(<Chrome/>);
    expect(document.querySelectorAll('[data-canvas-rail]')).toHaveLength(2);
    resize(519);
    expectFabs();
    expect(screen.getByTestId('chrome-policy')).toHaveTextContent('"mobile":false');
    resize(519);
    expectFabs();
    resize(520);
    expect(document.querySelectorAll('[data-canvas-rail]')).toHaveLength(2);
    expect(screen.queryByRole('button', {name: 'Ferramentas do Canvas'})).not.toBeInTheDocument();
  });
  it('mede corretamente a montagem inicial com rótulos e alterna as composições em pouca altura', () => {
    const {rerender} = render(<Chrome labels/>);
    resize(700);
    expectFabs();
    expect(screen.getByTestId('chrome-policy')).toHaveTextContent('"minimumHeight":810');
    rerender(<Chrome/>);
    expect(document.querySelectorAll('[data-canvas-rail]')).toHaveLength(2);
    expect(screen.getByTestId('chrome-policy')).toHaveTextContent('"minimumHeight":520');
    rerender(<Chrome labels/>);
    expectFabs();
  });
});
