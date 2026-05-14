import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('app-loading-fallback em index.html', () => {
  const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

  it('mantém estilos autocontidos sem depender de CSS externo', () => {
    expect(indexHtml).toContain('<style id="app-loading-style">');
    expect(indexHtml).toContain('#app-loading {');
    expect(indexHtml).toContain('.fallback {');
    expect(indexHtml).toContain('.brand {');
    expect(indexHtml).toContain('.mark {');
    expect(indexHtml).toContain('.progress {');
    expect(indexHtml).toContain('.bar {');
    expect(indexHtml).toContain('@keyframes app-loading-progress');
    expect(indexHtml).toContain('@media (prefers-reduced-motion: reduce)');
    expect(indexHtml).not.toContain('<link rel="stylesheet" href="/app-loading');
    expect(indexHtml).not.toContain('app-loading-fallback');
    expect(indexHtml).not.toContain('app-loading-brand');
    expect(indexHtml).not.toContain('app-loading-error');
  });

  it('mantém o fallback inicial sem estilos inline extensos no markup', () => {
    expect(indexHtml).toContain('<div id="app-loading" role="status" aria-live="polite">');
    expect(indexHtml).toContain('<div class="fallback">');
    expect(indexHtml).toContain('<div class="brand">');
    expect(indexHtml).toContain('<span class="mark">RAC</span>');
    expect(indexHtml).toContain('<div class="progress" aria-hidden="true">');
    expect(indexHtml).toContain('<div class="bar"></div>');
    expect(indexHtml).not.toContain('<div id="app-loading" style=');
  });

  it('usa a mesma raiz visual para o erro de bootstrap e para o timeout', () => {
    expect(indexHtml).toContain("'<div id=\"app-loading\" role=\"alert\">'");
    expect(indexHtml).toContain("document.getElementById('app-loading')");
  });
});
