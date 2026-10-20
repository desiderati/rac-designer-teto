import type {ComponentProps} from 'react';
import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RacEditorModalEditors} from './RacEditorModalEditors.tsx';

const viewport = vi.hoisted(() => ({mobile: false, portrait: false, landscape: false}));
vi.mock('@/components/rac-editor/lib/use-canvas-mobile-viewport.ts', () => ({
  useCanvasMobileViewport: () => viewport,
}));
vi.mock('@/components/rac-editor/lib/house-store.ts', () => ({useHouseRuntimeSnapshot: () => null}));
vi.mock('./editors/piloti/PilotiEditor.tsx', () => ({
  PilotiEditor: ({isOpen}: {isOpen: boolean}) => isOpen ? <div role='dialog' aria-label='Piloti'/> : null,
}));
vi.mock('./editors/generic/GenericObjectEditor.tsx', () => ({
  GenericObjectEditor: ({isOpen}: {isOpen: boolean}) => isOpen ? <div role='dialog' aria-label='Objeto'/> : null,
}));
vi.mock('./editors/terrain/TerrainEditor.tsx', () => ({
  TerrainEditor: ({isOpen}: {isOpen: boolean}) => isOpen ? <div role='dialog' aria-label='Terreno'/> : null,
}));
vi.mock('./selectors/HouseSideSelector.tsx', () => ({HouseSideSelector: () => null}));

function props(): ComponentProps<typeof RacEditorModalEditors> {
  return {
    isMobile: false,
    pendingViewType: null,
    houseSideSlots: [],
    sideSelectorOpen: false,
    sideSelectorMode: 'position',
    onSideSelected: vi.fn(),
    onSideSelectorClose: vi.fn(),
    isPilotiEditorOpen: false,
    pilotiSelection: null,
    selectedPilotiHeights: [],
    onPilotiEditorClose: vi.fn(),
    onPilotiHeightChange: vi.fn(),
    onPilotiNavigate: vi.fn(),
    contraventamentoEditorState: {
      leftDisabled: false, rightDisabled: false, leftActive: false, rightActive: false,
      topDisabled: false, bottomDisabled: false, topActive: false, bottomActive: false,
    },
    onContraventamentoSelect: vi.fn(),
    onHorizontalContraventamentoSelect: vi.fn(),
    isContraventamentoMode: false,
    isPilotiEligibleAsDestination: () => false,
    onContraventamentoPilotiClick: vi.fn(),
    onCancelContraventamento: vi.fn(),
    onWallApply: vi.fn(),
    wallSelection: null,
    wallEditorColor: '#000000',
    isWallEditorOpen: false,
    onWallEditorClose: vi.fn(),
    onLinearApply: vi.fn(),
    linearSelection: null,
    linearEditorType: 'line',
    isLinearEditorOpen: false,
    onLinearEditorClose: vi.fn(),
    terrainSelection: null,
    isTerrainEditorOpen: false,
    onTerrainEditorClose: vi.fn(),
    onTerrainApply: vi.fn(),
  };
}

beforeEach(() => Object.assign(viewport, {mobile: false, portrait: false, landscape: false}));

describe('editores ao mudar para o Canvas mobile', () => {
  it.each([true, false])('cancela a escolha de destino com editor fechado (retrato inicial: %s)', (initiallyPortrait) => {
    Object.assign(viewport, {mobile: initiallyPortrait, portrait: initiallyPortrait});
    const input = {...props(), isContraventamentoMode: true};
    const {rerender} = render(<RacEditorModalEditors {...input}/>);
    if (!initiallyPortrait) {
      expect(input.onCancelContraventamento).not.toHaveBeenCalled();
      Object.assign(viewport, {mobile: true, portrait: true});
      rerender(<RacEditorModalEditors {...input}/>);
    }
    expect(input.onCancelContraventamento).toHaveBeenCalledOnce();
    expect(input.onPilotiEditorClose).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  });

  it.each([true, false])('bloqueia editores em retrato, inclusive ao abrir depois do aviso (aberto inicialmente: %s)', (initiallyOpen) => {
    Object.assign(viewport, {mobile: true, portrait: true});
    const input = {
      ...props(),
      isPilotiEditorOpen: initiallyOpen,
      isWallEditorOpen: initiallyOpen,
      isLinearEditorOpen: initiallyOpen,
      isTerrainEditorOpen: initiallyOpen,
    };
    const {rerender} = render(<RacEditorModalEditors {...input}/>);
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    if (!initiallyOpen) {
      Object.assign(input, {isPilotiEditorOpen: true, isWallEditorOpen: true,
        isLinearEditorOpen: true, isTerrainEditorOpen: true});
      rerender(<RacEditorModalEditors {...input}/>);
    }
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    expect(input.onPilotiEditorClose).toHaveBeenCalledOnce();
    expect(input.onWallEditorClose).toHaveBeenCalledOnce();
    expect(input.onLinearEditorClose).toHaveBeenCalledOnce();
    expect(input.onTerrainEditorClose).toHaveBeenCalledOnce();
    expect(input.onCancelContraventamento).not.toHaveBeenCalled();
  });

  it.each([
    ['isPilotiEditorOpen', 'onPilotiEditorClose'],
    ['isWallEditorOpen', 'onWallEditorClose'],
    ['isLinearEditorOpen', 'onLinearEditorClose'],
    ['isTerrainEditorOpen', 'onTerrainEditorClose'],
  ] as const)('fecha %s ao entrar no mobile, sem confirmar alterações', (openKey, closeKey) => {
    const input = props();
    input[openKey] = true;
    const {rerender} = render(<RacEditorModalEditors {...input}/>);
    expect(input[closeKey]).not.toHaveBeenCalled();

    Object.assign(viewport, {mobile: true, landscape: true});
    rerender(<RacEditorModalEditors {...input}/>);
    expect(input[closeKey]).toHaveBeenCalledOnce();
    expect(input.onWallApply).not.toHaveBeenCalled();
    expect(input.onLinearApply).not.toHaveBeenCalled();
    expect(input.onTerrainApply).not.toHaveBeenCalled();
    expect(input.onPilotiHeightChange).not.toHaveBeenCalled();
    expect(input.onCancelContraventamento).not.toHaveBeenCalled();

    rerender(<RacEditorModalEditors {...input}/>);
    expect(input[closeKey]).toHaveBeenCalledOnce();
  });

  it('permite abrir no mobile e fecha ao girar para retrato sem reabrir em paisagem', () => {
    Object.assign(viewport, {mobile: true, landscape: true});
    const input = props();
    input.isContraventamentoMode = true;
    const {rerender} = render(<RacEditorModalEditors {...input}/>);
    input.isPilotiEditorOpen = true;
    rerender(<RacEditorModalEditors {...input}/>);
    expect(input.onPilotiEditorClose).not.toHaveBeenCalled();

    Object.assign(viewport, {portrait: true, landscape: false});
    rerender(<RacEditorModalEditors {...input}/>);
    expect(input.onPilotiEditorClose).toHaveBeenCalledOnce();
    expect(input.onCancelContraventamento).toHaveBeenCalledOnce();

    input.isPilotiEditorOpen = false;
    Object.assign(viewport, {portrait: false, landscape: true});
    rerender(<RacEditorModalEditors {...input}/>);
    input.isPilotiEditorOpen = true;
    rerender(<RacEditorModalEditors {...input}/>);
    expect(input.onPilotiEditorClose).toHaveBeenCalledOnce();
  });

  it('mantém a edição em resize sem troca de modo ou orientação e ao sair do mobile', () => {
    Object.assign(viewport, {mobile: true, landscape: true});
    const input = {...props(), isWallEditorOpen: true};
    const {rerender} = render(<RacEditorModalEditors {...input}/>);
    rerender(<RacEditorModalEditors {...input}/>);
    Object.assign(viewport, {mobile: false, landscape: false});
    rerender(<RacEditorModalEditors {...input}/>);
    expect(input.onWallEditorClose).not.toHaveBeenCalled();
  });
});
