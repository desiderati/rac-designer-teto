import {describe, expect, it} from 'vitest';
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {dirname, extname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(srcRoot, '..');

const guardedRoots = [
  'src/domain',
  'src/shared',
  'src/infra',
  'src/components/rac-editor/ports',
  'src/components/rac-editor/lib',
];

const forbiddenPatterns = [
  {
    label: 'import direto de Fabric',
    pattern: /(?:from\s+['"]fabric['"]|import\s*\(\s*['"]fabric['"]\s*\))/,
  },
  {
    label: 'import direto do slice @canvas',
    pattern: /from\s+['"]@\/components\/rac-editor\/@canvas(?:\/|['"])/,
  },
  {
    label: 'tipo concreto CanvasGroup/CanvasObject',
    pattern: /\bCanvas(?:Group|Object)\b/,
  },
];

function toPosixPath(value: string) {
  return value.split('\\').join('/');
}

function isSourceFile(filePath: string) {
  if (!['.ts', '.tsx'].includes(extname(filePath))) return false;
  if (filePath.endsWith('.smoke.test.ts') || filePath.endsWith('.test.ts')) return false;
  if (filePath.endsWith('.smoke.test.tsx') || filePath.endsWith('.test.tsx')) return false;

  return true;
}

function collectSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const entryPath = resolve(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) return collectSourceFiles(entryPath);
    if (!stats.isFile() || !isSourceFile(entryPath)) return [];

    return [entryPath];
  });
}

describe('fronteira arquitetural do editor RAC', () => {
  it('mantém Fabric e canvas fora do núcleo lógico testável', () => {
    const violations = guardedRoots.flatMap((root) => {
      const rootPath = resolve(projectRoot, root);

      return collectSourceFiles(rootPath).flatMap((filePath) => {
        const content = readFileSync(filePath, 'utf8');
        const fileLabel = toPosixPath(relative(projectRoot, filePath));

        return forbiddenPatterns
          .filter(({pattern}) => pattern.test(content))
          .map(({label}) => `${fileLabel}: ${label}`);
      });
    });

    expect(violations).toEqual([]);
  });
});
