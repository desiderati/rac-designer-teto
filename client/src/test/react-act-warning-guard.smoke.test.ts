import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {expect, it, vi} from 'vitest';
import {installReactActWarningGuard} from './react-act-warning-guard';

const execute = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../../..');
const require = createRequire(import.meta.url);
const vitestCli = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');

interface FixtureReport {
  testResults: Array<{
    assertionResults: Array<{title: string; status: string; failureMessages: string[]}>;
  }>;
}

async function runFixture(testNamePattern?: string) {
  const directory = await mkdtemp(path.join(tmpdir(), 'rac-react-act-'));
  const reportPath = path.join(directory, 'report.json');
  const configPath = path.join(directory, 'vitest.config.mjs');
  const fixturePath = path.resolve(import.meta.dirname, 'fixtures/react-act-warnings.fixture.tsx');

  try {
    // Deriva da configuração real para comprovar que o setup da aplicação ativa a guarda.
    await writeFile(configPath, `
      import projectConfig from ${JSON.stringify(path.join(projectRoot, 'vite.config.ts'))};
      export default (environment) => {
        const config = projectConfig(environment);
        return {...config, test: {...config.test,
          include: [${JSON.stringify(fixturePath)}],
          reporters: ['default', 'json'], outputFile: ${JSON.stringify(reportPath)},
          maxWorkers: 1, minWorkers: 1,
        }};
      };
    `);

    const args = [vitestCli, 'run', '--config', configPath];
    if (testNamePattern) args.push('--testNamePattern', testNamePattern);
    const result = await execute(process.execPath, args, {
      cwd: projectRoot,
      timeout: 25_000,
      maxBuffer: 1024 * 1024,
    }).then(
      (output) => ({...output, code: 0}),
      (error: {code: number | string; stdout: string; stderr: string}) => error,
    );
    const report = JSON.parse(await readFile(reportPath, 'utf8')) as FixtureReport;
    const tests = report.testResults.flatMap((file) => file.assertionResults);
    return {...result, tests};
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

it('falha com avisos act reais e de limpeza, preservando saída e controles válidos', async () => {
  const result = await runFixture();
  const resultOf = (title: string) => result.tests.find((test) => test.title === title);

  expect(result.code).toBe(1);
  for (const title of ['rejeita atualização React fora de act', 'rejeita aviso emitido no afterEach',
    'rejeita aviso de ambiente', 'rejeita aviso de sem await', 'rejeita aviso de sobreposição',
    'rejeita aviso de API obsoleta', 'rejeita aviso de MessageChannel']) {
    expect(resultOf(title)).toMatchObject({status: 'failed'});
    expect(resultOf(title)?.failureMessages.join('\n')).toContain('React act');
  }
  expect(resultOf('aceita atualização React aguardada')).toMatchObject({status: 'passed'});
  expect(resultOf('preserva mensagens não relacionadas')).toMatchObject({status: 'passed'});
  expect(result.stderr).toContain('An update to Counter inside a test was not wrapped in act(...)');
  expect(result.stderr).toContain('An update to CleanupFixture inside a test was not wrapped in act(...)');
  expect(result.stderr).toContain('A suspended resource finished loading inside a test');
  expect(result.stderr).toContain('Aviso de negócio: controle');
  expect(result.stderr).toContain('Erro de negócio esperado: controle');
}, 30_000);

it('falha também quando o único aviso ocorre no afterAll', async () => {
  const result = await runFixture('conclui o corpo antes do aviso de afterAll');
  expect(result.code).toBe(1);
  expect(result.tests.find((test) => test.title === 'conclui o corpo antes do aviso de afterAll'))
    .toMatchObject({status: 'passed'});
  expect(result.stderr).toContain('A suspended resource finished loading inside a test');
}, 30_000);

it('encerra com sucesso quando só há atualizações aguardadas e mensagens não relacionadas', async () => {
  const result = await runFixture('aceita atualização|preserva mensagens');
  expect(result.code).toBe(0);
  expect(result.tests.filter((test) => test.status === 'passed')).toHaveLength(2);
  expect(result.stderr).toContain('Aviso de negócio: controle');
  expect(result.stderr).toContain('Erro de negócio esperado: controle');
}, 30_000);

it('encaminha os argumentos originais e restaura o console sem vazar avisos', () => {
  const target = {error: vi.fn(), warn: vi.fn()};
  const original = {...target};
  const guard = installReactActWarningGuard(target);
  const details = {reason: 'controle'};
  target.error('Warning: An update to %s inside a test was not wrapped in act(...).', 'Counter', details);
  expect(original.error).toHaveBeenCalledExactlyOnceWith(
    'Warning: An update to %s inside a test was not wrapped in act(...).', 'Counter', details,
  );
  expect(original.error.mock.contexts[0]).toBe(target);
  expect(() => guard.assertNoWarnings()).toThrow('React act');
  expect(() => guard.assertNoWarnings()).not.toThrow();
  guard.restore();
  expect(target.error).toBe(original.error);
  expect(target.warn).toBe(original.warn);
});
