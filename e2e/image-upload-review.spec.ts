import {expect, test, type Page} from '@playwright/test';
import {deflateSync} from 'node:zlib';
import {setupRacEditorPage} from './helpers/rac-editor.helpers';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SMALL_PNG = createPngBuffer(32, 24, false);

interface StorageUploadPayload {
  fileName?: string;
  mimeType?: string;
  base64?: string;
}

function createPngBuffer(width: number, height: number, noisy: boolean): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let seed = 0x12345678;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 4;
      if (noisy) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        raw[pixelOffset] = seed & 0xff;
        raw[pixelOffset + 1] = (seed >>> 8) & 0xff;
        raw[pixelOffset + 2] = (seed >>> 16) & 0xff;
      } else {
        raw[pixelOffset] = 206;
        raw[pixelOffset + 1] = 224;
        raw[pixelOffset + 2] = 238;
      }
      raw[pixelOffset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), data.length + 8);
  return chunk;
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function openUploadDialog(page: Page) {
  await page.getByRole('button', {name: 'Upload de Imagem'}).click();
  const dialog = page.getByRole('dialog').filter({hasText: 'Inserir imagem'});
  await expect(dialog).toBeVisible();
  return dialog;
}

async function installStorageUploadMock(page: Page, holdResponse = false) {
  let payload: StorageUploadPayload | null = null;
  let releaseResponse = () => undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });

  await page.route('**/api/trpc/storage.uploadImage**', async (route) => {
    const rawBody = route.request().postData() ?? '{}';
    const parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    const firstInput = (parsedBody['0'] ?? parsedBody) as Record<string, unknown>;
    payload = (firstInput.json ?? (firstInput.input as Record<string, unknown> | undefined)?.json ?? firstInput) as StorageUploadPayload;

    if (holdResponse) await responseGate;

    const response = {
      key: 'rac-designer-teto/e2e/photos/terreno-grande.webp',
      url: `data:image/png;base64,${SMALL_PNG.toString('base64')}`,
      bytes: payload.base64 ? Buffer.from(payload.base64, 'base64').byteLength : 0,
      mimeType: payload.mimeType ?? 'image/webp',
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{result: {data: {json: response}}}]),
    });
  });

  return {
    getPayload: () => payload,
    releaseResponse,
  };
}

test.describe('Revisão de imagem — Dialog desktop', () => {
  test.beforeEach(async ({page}) => {
    await setupRacEditorPage(page);
  });

  test('abre o Dialog, mostra preview e retorna ao seletor ao cancelar', async ({page}) => {
    const uploadDialog = await openUploadDialog(page);
    await uploadDialog.getByLabel('Selecionar imagem para inserir no canvas').setInputFiles({
      name: 'terreno.png',
      mimeType: 'image/png',
      buffer: SMALL_PNG,
    });

    const reviewDialog = page.getByRole('dialog').filter({hasText: 'Revisar imagem para o Canvas'});
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByRole('checkbox', {name: 'Manter qualidade original'})).toBeVisible();
    await expect(reviewDialog.getByRole('button', {name: 'Comparar original e otimizada'})).toHaveCount(0);

    await reviewDialog.getByRole('button', {name: 'Cancelar'}).click();
    await expect(reviewDialog).toBeHidden();
    await expect(uploadDialog).toBeVisible();
  });
});

test.describe('Revisão de imagem — Drawer mobile', () => {
  test.use({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});

  test.beforeEach(async ({page}) => {
    await setupRacEditorPage(page);
  });

  test('usa Drawer no mobile e preserva a escolha de qualidade', async ({page}) => {
    const uploadDrawer = await openUploadDialog(page);
    await uploadDrawer.getByLabel('Selecionar imagem para inserir no canvas').setInputFiles({
      name: 'terreno-mobile.png',
      mimeType: 'image/png',
      buffer: SMALL_PNG,
    });

    const reviewDrawer = page.getByRole('dialog').filter({hasText: 'Revisar imagem para o Canvas'});
    await expect(reviewDrawer).toBeVisible();
    const checkbox = reviewDrawer.getByRole('checkbox', {name: 'Manter qualidade original'});
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await reviewDrawer.getByRole('button', {name: 'Cancelar'}).click();
    await expect(uploadDrawer).toBeVisible();
  });
});

test.describe('Upload comprimido — fluxo completo', () => {
  test.beforeEach(async ({page}) => {
    await setupRacEditorPage(page);
  });

  test('prepara no cliente, mostra comparação, fecha a revisão e envia o arquivo otimizado', async ({page}) => {
    const storageMock = await installStorageUploadMock(page, true);
    const originalPng = createPngBuffer(1200, 900, true);
    expect(originalPng.byteLength).toBeGreaterThan(2.5 * 1024 * 1024);

    const uploadDialog = await openUploadDialog(page);
    await uploadDialog.getByLabel('Selecionar imagem para inserir no canvas').setInputFiles({
      name: 'terreno-grande.png',
      mimeType: 'image/png',
      buffer: originalPng,
    });

    const reviewDialog = page.getByRole('dialog').filter({hasText: 'Revisar imagem para o Canvas'});
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByRole('button', {name: 'Comparar original e otimizada'})).toBeVisible({timeout: 20_000});
    await reviewDialog.getByRole('button', {name: 'Comparar original e otimizada'}).click();
    await expect(reviewDialog.getByText('Otimizada')).toBeVisible();
    await expect(reviewDialog.getByText(/\d+,\d+%/)).toBeVisible();

    await reviewDialog.getByRole('button', {name: 'Usar esta imagem'}).click();
    await expect(reviewDialog).toBeHidden();
    await expect(uploadDialog).toBeHidden();
    await expect(page.getByText('Enviando imagem em segundo plano…')).toBeVisible();

    await expect.poll(() => storageMock.getPayload()?.mimeType, {timeout: 20_000}).toBe('image/webp');
    const uploadedPayload = storageMock.getPayload();
    expect(uploadedPayload?.fileName).toMatch(/terreno-grande\.webp$/);
    expect(uploadedPayload?.base64).toBeTruthy();
    expect(Buffer.from(uploadedPayload?.base64 ?? '', 'base64').byteLength).toBeLessThan(originalPng.byteLength);

    storageMock.releaseResponse();
    await expect(page.getByText('Imagem enviada e inserida no Canvas.')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Upload de Imagem'})).toBeVisible();
  });
});
