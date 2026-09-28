import type {Express, Response} from 'express';
import {ENV} from './env';
import {sdk} from './sdk';
import {logSafeServerError} from './safe-error-log';

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

    await redirectToStorageAsset(asset, res, true);
  });

  app.get('/manus-storage/*', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    res.vary('Cookie');
    res.vary('Authorization');
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) throw new Error('Missing session');
    } catch {
      res.status(401).send('Authentication required');
      return;
    }
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send('Missing storage key');
      return;
    }

    await redirectToStorageAsset(key, res, false);
  });
}

async function redirectToStorageAsset(key: string, res: Response, publicAsset: boolean) {
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
      console.error(`[StorageProxy] forge error: ${forgeResp.status}`);
      res.status(502).send('Storage backend error');
      return;
    }

    const {url} = (await forgeResp.json()) as {url: string};
    if (!url) {
      res.status(502).send('Empty signed URL from backend');
      return;
    }

    const assetResponse = await fetch(url);
    if (!assetResponse.ok) {
      console.error(`[StorageProxy] asset error: ${assetResponse.status}`);
      res.status(502).send('Storage asset unavailable');
      return;
    }

    const contentType = assetResponse.headers.get('content-type') ?? 'application/octet-stream';
    const contentLength = assetResponse.headers.get('content-length');
    const contentDisposition = assetResponse.headers.get('content-disposition');
    const assetBytes = Buffer.from(await assetResponse.arrayBuffer());

    res.set('Cache-Control', publicAsset ? 'public, max-age=300, stale-while-revalidate=3600' : 'private, no-store');
    res.set('Content-Type', contentType);
    res.set('X-Content-Type-Options', 'nosniff');
    if (contentLength) res.set('Content-Length', contentLength);
    if (contentDisposition) res.set('Content-Disposition', contentDisposition);
    res.status(200).send(assetBytes);
  } catch (err) {
    logSafeServerError('[StorageProxy] failed', err);
    res.status(502).send('Storage proxy error');
  }
}
