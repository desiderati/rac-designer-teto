import {afterAll, afterEach, describe, expect, it} from 'vitest';
import {useState} from 'react';
import {act, render, screen, waitFor} from '@testing-library/react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => value + 1)}>Contagem: {count}</button>;
}

// Executado apenas pelo teste de contrato em um processo Vitest separado.
it('rejeita atualização React fora de act', async () => {
  render(<Counter/>);
  screen.getByRole('button').click();
  await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Contagem: 1'));
});

it('aceita atualização React aguardada', async () => {
  render(<Counter/>);
  await act(async () => screen.getByRole('button').click());
  expect(screen.getByRole('button')).toHaveTextContent('Contagem: 1');
});

it('preserva mensagens não relacionadas', () => {
  console.warn('Aviso de negócio: %s', 'controle');
  console.error('Erro de negócio esperado: %s', 'controle');
  console.warn('Documentação: use act(...) nos testes React.');
  expect(2 + 2).toBe(4);
});

it.each([
  ['ambiente', 'The current testing environment is not configured to support act(...)'],
  ['sem await', 'You called act(async () => ...) without await.'],
  ['sobreposição', 'You seem to have overlapping act() calls, this is not supported.'],
  ['API obsoleta', '`ReactDOMTestUtils.act` is deprecated in favor of `React.act`.'],
  ['MessageChannel', 'This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail.'],
])('rejeita aviso de %s', (_name, message) => {
  console.error('Warning: ' + message);
  expect(true).toBe(true);
});

describe('limpeza do teste', () => {
  afterEach(() => {
    console.warn('Warning: An update to %s inside a test was not wrapped in act(...).', 'CleanupFixture');
  });

  it('rejeita aviso emitido no afterEach', () => {
    expect(true).toBe(true);
  });
});

describe('limpeza da suíte', () => {
  afterAll(() => {
    console.error('Warning: A suspended resource finished loading inside a test, but the event was not wrapped in act(...).');
  });

  it('conclui o corpo antes do aviso de afterAll', () => {
    expect(true).toBe(true);
  });
});
