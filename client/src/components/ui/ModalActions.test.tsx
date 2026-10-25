import {createRef, useState} from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ModalActions} from './ModalActions.tsx';
import {ModalFrame} from './ModalFrame.tsx';

afterEach(() => {cleanup(); vi.restoreAllMocks();});

function viewport(initial: number) {
  let width = initial;
  const listeners = new Set<() => void>();
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    get matches() {return width < 460;}, media: query, onchange: null,
    addEventListener: (_event: string, callback: EventListenerOrEventListenerObject) => listeners.add(callback as () => void),
    removeEventListener: (_event: string, callback: EventListenerOrEventListenerObject) => listeners.delete(callback as () => void),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => true,
  } as MediaQueryList));
  return (next: number) => act(() => {width = next; listeners.forEach(listener => listener());});
}

describe('ações e regiões modais R48', () => {
  it.each([459,460,461])('preserva a ordem de leitura e tabulação em %i px', width => {
    viewport(width);
    render(<ModalActions cancel={<button>Cancelar</button>} confirm={<button>Confirmar</button>}/>);
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(width < 460 ? ['Confirmar','Cancelar'] : ['Cancelar','Confirmar']);
  });

  it('reorganiza sem remontar controles, perder estado ou trocar callbacks', () => {
    const resize = viewport(460);
    const reference = createRef<HTMLButtonElement>();
    const onCancel = vi.fn();
    function StatefulAction() {
      const [clicks, setClicks] = useState(0);
      return <button ref={reference} onClick={() => {setClicks(clicks + 1); onCancel();}}>Cancelar {clicks}</button>;
    }
    render(<ModalActions cancel={<StatefulAction/>} confirm={<button disabled>Gerando…</button>}/>);
    fireEvent.click(screen.getByRole('button', {name:'Cancelar 0'}));
    const control = reference.current;
    resize(459);
    expect(reference.current).toBe(control);
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['Gerando…','Cancelar 1']);
    expect(screen.getByRole('button', {name:'Gerando…'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name:'Cancelar 1'}));
    expect(onCancel).toHaveBeenCalledTimes(2);
    resize(460);
    expect(reference.current).toBe(control);
    expect(screen.getByRole('button', {name:'Cancelar 2'})).toBeInTheDocument();
  });

  it('deixa título e ações fora da região de conteúdo sem inspecionar filhos', () => {
    viewport(460);
    const {container} = render(<ModalFrame header={<h2>Título</h2>} actions={<ModalActions confirm={<button>Fechar</button>}/>}><p>Conteúdo longo</p></ModalFrame>);
    const content = container.querySelector('[data-rac-modal-region="content"]');
    expect(content).toContainElement(screen.getByText('Conteúdo longo'));
    expect(content).not.toContainElement(screen.getByRole('heading', {name:'Título'}));
    expect(content).not.toContainElement(screen.getByRole('button', {name:'Fechar'}));
    expect(container.querySelectorAll('[data-rac-modal-region="content"]')).toHaveLength(1);
  });
});
