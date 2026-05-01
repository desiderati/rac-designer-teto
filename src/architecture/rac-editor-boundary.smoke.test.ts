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

const canvasInteractionPortImportPattern =
  /(?:from\s+['"][^'"]*CanvasInteractionPort(?:\.ts)?['"]|import\s*\(\s*['"][^'"]*CanvasInteractionPort(?:\.ts)?['"]\s*\))/;

const canvasInteractionPortPath = 'src/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';

const concreteCanvasTypePattern = /\bCanvas(?:Group|Object)\b/;

const allowedConcreteCanvasTypeRoots = [
  'src/components/rac-editor/@canvas',
];

const viewerRuntimeLeakPattern =
  /(?:\bCanvas(?:Group|Object)\b|\bHouseRuntimeSnapshot\b|useHouseRuntimeSnapshot)/;

const globalHouseControllerSingletonPattern =
  /(?:export\s+const\s+houseManager\b|import\s*\{\s*houseManager\s*\}\s*from\s+['"][^'"]*canvas-house-(?:manager|controller)(?:\.ts)?['"])/;

const concreteInfraImportPattern =
  /from\s+['"]@\/infra\//;

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

  it('não reintroduz CanvasInteractionPort como handle amplo do canvas', () => {
    const rootPath = resolve(projectRoot, 'src/components/rac-editor');
    const violations = [
      ...(existsSync(resolve(projectRoot, canvasInteractionPortPath))
        ? [`${canvasInteractionPortPath}: port amplo do canvas reintroduzido`]
        : []),
      ...collectSourceFiles(rootPath).flatMap((filePath) => {
        const content = readFileSync(filePath, 'utf8');
        if (!canvasInteractionPortImportPattern.test(content)) return [];

        const fileLabel = toPosixPath(relative(projectRoot, filePath));
        return [`${fileLabel}: import direto de CanvasInteractionPort`];
      }),
    ];

    expect(violations).toEqual([]);
  });

  it('confina CanvasGroup e CanvasObject ao slice de canvas', () => {
    const rootPath = resolve(projectRoot, 'src');
    const violations = collectSourceFiles(rootPath).flatMap((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      if (!concreteCanvasTypePattern.test(content)) return [];

      const fileLabel = toPosixPath(relative(projectRoot, filePath));
      if (allowedConcreteCanvasTypeRoots.some((root) => fileLabel.startsWith(`${root}/`))) return [];

      return [`${fileLabel}: tipo concreto de canvas fora da fronteira permitida`];
    });

    expect(violations).toEqual([]);
  });

  it('mantém o viewer 3D dependente da projeção serializável, não do runtime visual', () => {
    const rootPath = resolve(projectRoot, 'src/components/rac-editor/@viewer-3d');
    const violations = collectSourceFiles(rootPath).flatMap((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      if (!viewerRuntimeLeakPattern.test(content)) return [];

      const fileLabel = toPosixPath(relative(projectRoot, filePath));
      return [`${fileLabel}: vazamento de runtime visual no viewer 3D`];
    });

    expect(violations).toEqual([]);
  });

  it('impede reintrodução do singleton global da casa', () => {
    const rootPath = resolve(projectRoot, 'src');
    const violations = collectSourceFiles(rootPath).flatMap((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      if (!globalHouseControllerSingletonPattern.test(content)) return [];

      const fileLabel = toPosixPath(relative(projectRoot, filePath));
      return [`${fileLabel}: singleton global da casa`];
    });

    expect(violations).toEqual([]);
  });

  it('mantém adapters concretos de infra fora do código produtivo do editor', () => {
    const rootPath = resolve(projectRoot, 'src/components/rac-editor');
    const violations = collectSourceFiles(rootPath).flatMap((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      if (!concreteInfraImportPattern.test(content)) return [];

      const fileLabel = toPosixPath(relative(projectRoot, filePath));
      return [`${fileLabel}: import direto de adapter concreto de infra`];
    });

    expect(violations).toEqual([]);
  });
});
