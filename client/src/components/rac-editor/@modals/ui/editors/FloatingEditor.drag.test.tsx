import {fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {FloatingEditor} from './FloatingEditor.tsx';

vi.mock('@/bootstrap/editor-bootstrap.ts', () => ({
  useEditorPorts: () => ({settingsPort: {getSettings: () => ({openEditorsAtFixedPosition: true})}}),
}));
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

function editor(header = true) {
  render(<FloatingEditor isOpen isMobile={false}
    header={header ? <h2>Editor flutuante</h2> : undefined}
    cardContent={<span>Conteúdo</span>} confirmLabel='Confirmar'
    onCancel={vi.fn()} onConfirm={vi.fn()}/>);
  const dialog = screen.getByRole('dialog');
  vi.spyOn(dialog, 'getBoundingClientRect').mockImplementation(() => ({
    left: 88, top: Number.parseFloat(dialog.style.top), width: 304, height: 300,
  }) as DOMRect);
  return dialog;
}

it.each([true, false])('preserva o topo inicial e arrasta nos dois eixos, com cabeçalho=%s', header => {
  vi.stubGlobal('innerHeight', 900);
  const dialog = editor(header);
  expect(dialog).toHaveStyle({top: '8px'});
  const before = dialog.style.left;
  fireEvent.mouseDown(header ? screen.getByText('Editor flutuante') : dialog, {clientX: 120, clientY: 40});
  fireEvent.mouseMove(window, {clientX: 200, clientY: 120});
  fireEvent.mouseUp(window);
  expect(dialog.style.left).not.toBe(before);
  expect(dialog).toHaveStyle({top: '88px'});
});

it('não salta ao iniciar o arrasto a partir da posição real limitada pela viewport', () => {
  const dialog = editor();
  vi.mocked(dialog.getBoundingClientRect).mockReturnValue({left: 30, top: 8, width: 304, height: 300} as DOMRect);
  fireEvent.mouseDown(screen.getByText('Editor flutuante'), {clientX: 50, clientY: 40});
  fireEvent.mouseMove(window, {clientX: 50, clientY: 40});
  fireEvent.mouseUp(window);
  expect(dialog.style.left).toContain('30px');
  expect(dialog).toHaveStyle({top: '8px'});
});

it('limita o arrasto à altura útil e reposiciona o editor ao reduzir a viewport', () => {
  vi.stubGlobal('innerHeight', 900);
  const dialog = editor();
  fireEvent.mouseDown(screen.getByText('Editor flutuante'), {clientX: 120, clientY: 40});
  fireEvent.mouseMove(window, {clientX: 120, clientY: 2000});
  expect(dialog).toHaveStyle({top: '592px'});
  fireEvent.mouseMove(window, {clientX: 120, clientY: -100});
  expect(dialog).toHaveStyle({top: '8px'});
  fireEvent.mouseMove(window, {clientX: 120, clientY: 2000});
  fireEvent.mouseUp(window);
  window.innerHeight = 600;
  fireEvent(window, new Event('resize'));
  expect(dialog).toHaveStyle({top: '292px'});
});

it('não inicia um arrasto ao usar as ações do editor', () => {
  const dialog = editor(false);
  fireEvent.mouseDown(screen.getByRole('button', {name: 'Confirmar'}), {clientX: 120, clientY: 40});
  fireEvent.mouseMove(window, {clientX: 200, clientY: 120});
  fireEvent.mouseUp(window);
  expect(dialog).toHaveStyle({top: '8px'});
});
