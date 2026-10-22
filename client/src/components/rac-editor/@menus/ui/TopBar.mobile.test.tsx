import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TopBar} from './TopBar.tsx';
import {CanvasOrientationNotice} from '@/components/rac-editor/ui/CanvasOrientationNotice.tsx';
import type {MenuActionMap} from '../lib/menu-types.ts';

const viewport = vi.hoisted(() => ({mobile: true, portrait: false, landscape: true}));
vi.mock('@/components/rac-editor/lib/use-canvas-mobile-viewport.ts', () => ({
  useCanvasMobileViewport: () => viewport,
}));
vi.mock('@/contexts/RemoteSyncContext.tsx', () => ({
  useRemoteSync: () => ({status: 'synced', lastSyncedAt: null}),
}));

function Fixture() {
  const noop = () => undefined;
  const actions: MenuActionMap = {
    openHouseTypeSelector: noop, addHouseFront: noop, addHouseBack: noop,
    addHouseSide1: noop, addHouseSide2: noop, addWall: noop, addSiteElement: noop,
    addStreetStraight: noop, addStreetCorner: noop, addDirtRoad: noop,
    addSquare: noop, addTriangle: noop, addCircle: noop, addDoor: noop,
    addStairs: noop, addTree: noop, addWater: noop, addFossa: noop,
    addLine: noop, addArrow: noop, addDistance: noop, toggleDrawMode: noop,
    addText: noop, openImageUpload: noop, openConstructionSites: noop,
    activateHouse: async () => undefined, deleteSelection: noop, savePDF: noop,
    toggleHouseMenu: noop, toggleElementsMenu: noop, toggleGeometryMenu: noop,
    toggleLinesMenu: noop, toggleOverflowMenu: noop, toggleTips: noop,
    toggleZoomControls: noop, open3DViewer: noop, toggleMenu: noop,
    restartDrawing: noop, exit: noop, renameFamily: noop, setCanvasToolMode: noop,
    fitToView: noop, fitContent: noop,
  };
  return <TopBar actions={actions} constructionGroups={[]} familyName='Casa de teste'
    showTips={false} zoom={.7} canvasToolMode='select' isMobile={viewport.mobile}
    documentSaveStatus='saved' documentTransitioning={false} canExportPDF/>;
}

describe('Barra superior do Canvas mobile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(viewport, {mobile: true, portrait: false, landscape: true});
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('mostra somente o puxador quando recolhida e o oculta enquanto os controles estão visíveis', () => {
    render(<Fixture/>);
    expect(screen.queryByRole('button', {name: 'Abrir menu principal'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    expect(screen.queryByRole('button', {name: /(?:Mostrar|Ocultar) barra superior/})).not.toBeInTheDocument();
  });

  it('não monta o puxador nem os controles durante o aviso de girar o celular', () => {
    Object.assign(viewport, {portrait: true, landscape: false});
    render(<><CanvasOrientationNotice onBackToConstructions={vi.fn()}/><Fixture/></>);
    expect(screen.getByRole('dialog', {name: 'Gire seu celular'})).toBeVisible();
    expect(screen.queryByLabelText('Mostrar barra superior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Abrir menu principal')).not.toBeInTheDocument();
    expect(screen.getByTestId('top-bar-layout')).not.toBeVisible();
  });

  it('recolhe controles e popovers ao girar para retrato e volta somente com o puxador', () => {
    const view = render(<Fixture/>);
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    fireEvent.click(screen.getByRole('button', {name: 'Zoom atual 70%. Abrir ferramentas de canvas.'}));
    expect(screen.getByRole('button', {name: 'Seleção'})).toBeVisible();

    Object.assign(viewport, {portrait: true, landscape: false});
    view.rerender(<Fixture/>);
    expect(screen.queryByLabelText('Mostrar barra superior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Abrir menu principal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Seleção'})).not.toBeInTheDocument();

    Object.assign(viewport, {portrait: false, landscape: true});
    view.rerender(<Fixture/>);
    expect(screen.getByRole('button', {name: 'Mostrar barra superior'})).toBeVisible();
    expect(screen.queryByLabelText('Abrir menu principal')).not.toBeInTheDocument();
  });

  it('recolhe em 5 segundos, fecha popovers e permite abrir novamente por mais 5 segundos', () => {
    render(<Fixture/>);
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    fireEvent.click(screen.getByRole('button', {name: 'Zoom atual 70%. Abrir ferramentas de canvas.'}));
    expect(screen.getByRole('button', {name: 'Seleção'})).toBeVisible();

    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('button', {name: 'Abrir menu principal'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Seleção'})).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    expect(screen.queryByRole('button', {name: 'Seleção'})).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('button', {name: 'Mostrar barra superior'})).toBeVisible();
  });

  it('mantém o desktop visível e volta recolhida ao retornar ao mobile', () => {
    const view = render(<Fixture/>);
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    viewport.mobile = false;
    view.rerender(<Fixture/>);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Mostrar barra superior'})).not.toBeInTheDocument();

    viewport.mobile = true;
    view.rerender(<Fixture/>);
    expect(screen.getByRole('button', {name: 'Mostrar barra superior'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Abrir menu principal'})).not.toBeInTheDocument();
  });

  it('cancela o temporizador ao desmontar', () => {
    const view = render(<Fixture/>);
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém a barra aberta enquanto o tour aponta para o sincronizador e recolhe após a orientação', () => {
    const view = render(<><Fixture/><div data-guided-tour-target='rac-sync-status'/></>);
    fireEvent.click(screen.getByRole('button', {name: 'Mostrar barra superior'}));
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();

    view.rerender(<><Fixture/></>);
    expect(screen.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('button', {name: 'Mostrar barra superior'})).toBeVisible();
  });
});
