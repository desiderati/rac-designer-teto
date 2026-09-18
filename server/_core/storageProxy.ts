import type {Express, Request, Response} from 'express';
import {ENV} from './env';

const PUBLIC_LANDING_ASSETS = new Set([
  'rac-editor-landing-screenshot-harmonized_95473d21.png',
  'teto-house-linework-transparent-cropped_770579e2.png',
]);

export function registerStorageProxy(app: Express) {
  app.get('/api/public-assets/:asset', async (req, res) => {
    const asset = String(req.params.asset ?? '');
    if (!PUBLIC_LANDING_ASSETS.has(asset)) {
      res.status(404).send('Public asset not found');
      return;
    }

    await redirectToStorageAsset(asset, req, res);
  });

  app.get('/manus-storage/*', async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send('Missing storage key');
      return;
    }

    await redirectToStorageAsset(key, req, res);
  });
}

async function redirectToStorageAsset(key: string, _req: Request, res: Response) {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send('Storage proxy not configured');
    return;
  }

  try {
    const forgeUrl = new URL(
      'v1/storage/presign/get',
      ENV.forgeApiUrl.replace(/\/+$/, '') + '/',
    );
    forgeUrl.searchParams.set('path', key);

    const forgeResp = await fetch(forgeUrl, {
      headers: {Authorization: `Bearer ${ENV.forgeApiKey}`},
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => '');
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(502).send('Storage backend error');
      return;
    }

    const {url} = (await forgeResp.json()) as {url: string};
    if (!url) {
      res.status(502).send('Empty signed URL from backend');
      return;
    }

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.redirect(307, url);
  } catch (err) {
    console.error('[StorageProxy] failed:', err);
    res.status(502).send('Storage proxy error');
  }
}
