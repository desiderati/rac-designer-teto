import {describe, expect, it} from 'vitest';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ROOTS_TO_SCAN = ['src', 'e2e'];

function collectSourceFiles(baseDir: string): string[] {
  const entries = readdirSync(baseDir);
  const files: string[] = [];

  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;

    const absolutePath = join(baseDir, entry);
    const entryStats = statSync(absolutePath);

    if (entryStats.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(absolutePath);
    }
  }

  return files;
}

describe('legacy import guards', () => {
  it('does not reference removed legacy src/lib modules', () => {
    const projectRoot = process.cwd();
    const candidates = ROOTS_TO_SCAN
      .map((relativeDir) => join(projectRoot, relativeDir))
      .flatMap((absoluteDir) => collectSourceFiles(absoluteDir));

    const offenders: string[] = [];

    for (const file of candidates) {
      const content = readFileSync(file, 'utf8');
      const hasAliasLegacyImport = /from\s+["']@\/lib\//.test(content);
      const hasAbsoluteLegacyImport = /from\s+["'][^"']*src\/lib\//.test(content);

      if (hasAliasLegacyImport || hasAbsoluteLegacyImport) {
        offenders.push(file.replace(projectRoot + '\\', ''));
      }
    }

    expect(offenders).toEqual([]);
  });
});
