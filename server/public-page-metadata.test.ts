import {describe, expect, it, vi} from 'vitest';
import express from 'express';
import fs from 'node:fs';
import {readFileSync} from 'node:fs';
import {serveStatic} from './_core/vite';
import {publicPageMetadata, HOME_TITLE, NOT_FOUND_TITLE} from '../shared/public-page-metadata';
const template = readFileSync(new URL('../client/index.html', import.meta.url), 'utf8');
describe('A-027 metadados públicos', () => {
  it('preserva a rota original no fallback HTTP do Express', async () => {
    const readTemplate = vi.spyOn(fs.promises, 'readFile').mockResolvedValue(template);
    const directoryExists = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const app = express();
    serveStatic(app);
    const server = app.listen(0, '127.0.0.1');
    try {
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Servidor de teste sem porta.');
      const base = `http://127.0.0.1:${address.port}`;
      const home = await fetch(`${base}/?origem=teste`);
      expect(home.status).toBe(200);
      expect(await home.text()).toContain(`<title>${HOME_TITLE}</title>`);
      const missing = await fetch(`${base}/pagina-inexistente?origem=teste`);
      expect(missing.status).toBe(404);
      const html = await missing.text();
      expect(html).toContain(`<title>${NOT_FOUND_TITLE}</title>`);
      expect(html).toContain('noindex,follow');
      expect(html).not.toContain('rel="canonical"');
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      readTemplate.mockRestore();
      directoryExists.mockRestore();
    }
  });
  it('mantém canonical da home e diferencia erro com 404 e noindex no HTML inicial', () => {
    const home = publicPageMetadata(template, '/?source=test');
    const error = publicPageMetadata(template, '/pagina-inexistente');
    expect(home.status).toBe(200); expect(error.status).toBe(404);
    expect(home.html).toContain(`<title>${HOME_TITLE}</title>`);
    expect(error.html).toContain(`<title>${NOT_FOUND_TITLE}</title>`);
    expect(home.html).toContain('rel="canonical"');
    expect(error.html).not.toContain('rel="canonical"');
    expect(error.html).toContain('noindex,follow');
    expect(home.html.match(/name="description"[^>]+/)?.[0]).not.toBe(error.html.match(/name="description"[^>]+/)?.[0]);
  });
  it('publica somente a home no sitemap e não inclui dados privados no resumo', () => {
    const sitemap = readFileSync(new URL('../client/public/sitemap.xml', import.meta.url), 'utf8');
    const summary = readFileSync(new URL('../client/public/llms.txt', import.meta.url), 'utf8');
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(sitemap).toContain('https://tetopr.manus.space/');
    expect(summary).toContain('TETO');
    expect(summary).not.toMatch(/manus-storage|@|familyId|houseId/);
  });
});
