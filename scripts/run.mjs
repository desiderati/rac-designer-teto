import {spawn} from 'node:child_process';
import {rm} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = path => resolve(projectRoot, 'node_modules', path);

function run(script, args = [], environment = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: projectRoot,
      env: {...process.env, ...environment},
      stdio: 'inherit',
    });
    child.once('error', rejectRun);
    child.once('close', code => resolveRun(code ?? 1));
  });
}

async function main() {
  const command = process.argv[2];
  switch (command) {
    case 'dev':
    case 'dev:local':
    case 'e2e-server': {
      const environment = {NODE_ENV: 'development'};
      if (command !== 'dev') environment.PORT = '5200';
      if (command === 'e2e-server') environment.VITE_E2E = 'true';
      return run(cli('tsx/dist/cli.mjs'), ['watch', 'server/_core/index.ts'], environment);
    }
    case 'build': {
      // This fixed target is inside the repository and is never supplied by the caller.
      await rm(resolve(projectRoot, 'dist'), {recursive: true, force: true});
      const clientResult = await run(cli('vite/bin/vite.js'), ['build']);
      if (clientResult !== 0) return clientResult;
      await build({
        entryPoints: [resolve(projectRoot, 'server/_core/index.ts')],
        platform: 'node',
        packages: 'external',
        bundle: true,
        format: 'esm',
        logLevel: 'info',
        outdir: resolve(projectRoot, 'dist'),
      });
      return 0;
    }
    case 'start':
      return run(resolve(projectRoot, 'dist/index.js'), [], {NODE_ENV: 'production'});
    default:
      throw new Error(`Comando desconhecido: ${command ?? '(vazio)'}`);
  }
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
