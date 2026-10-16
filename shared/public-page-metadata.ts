export const PUBLIC_APP_URL = 'https://tetopr.manus.space/';
export const HOME_TITLE = 'Editor de RAC — TETO';
export const HOME_DESCRIPTION = 'Editor de RAC para a ONG TETO. Crie e edite plantas de casas com sincronização remota segura.';
export const NOT_FOUND_TITLE = 'Página não encontrada | RAC Designer TETO';
export const NOT_FOUND_DESCRIPTION = 'A página solicitada não existe. Volte ao RAC Designer TETO para continuar.';

/** Metadados disponíveis no HTML inicial, inclusive para crawlers sem JavaScript. */
export function publicPageMetadata(html: string, requestPath: string): {html: string; status: number} {
  const home = requestPath.split('?')[0] === '/';
  const title = home ? HOME_TITLE : NOT_FOUND_TITLE;
  const description = home ? HOME_DESCRIPTION : NOT_FOUND_DESCRIPTION;
  let result = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}" />`)
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');
  result = result.replace('</head>', `${home ? `<link rel="canonical" href="${PUBLIC_APP_URL}" />` : ''}<meta name="robots" content="${home ? 'index,follow' : 'noindex,follow'}" /></head>`);
  return {html: result, status: home ? 200 : 404};
}
