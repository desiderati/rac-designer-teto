import {afterEach, describe, expect, it, vi} from 'vitest';
import {prepareRacPdfReportPhotos} from '@/components/rac-editor/lib/rac-pdf-report-photos.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('preparação de fotos para o PDF', () => {
  it('seleciona as fotos da casa correta e converte imagens disponíveis para JPEG', async () => {
    const loadedSources: string[] = [];
    class FakeImage {
      naturalWidth = 1600;
      naturalHeight = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin = '';
      set src(source: string) {
        loadedSources.push(source);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);
    const originalCreateElement = document.createElement.bind(document);
    const canvases: Array<{width: number; height: number}> = [];
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName !== 'canvas') return originalCreateElement(tagName);
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({fillRect: vi.fn(), drawImage: vi.fn()}),
        toDataURL: () => {
          canvases.push({width: canvas.width, height: canvas.height});
          return 'data:image/jpeg;base64,prepared';
        },
      };
      return canvas as unknown as HTMLCanvasElement;
    }) as typeof document.createElement);

    const constructionSite = {
      constructionSite: {activeHouseId: 'house-1'},
      houses: [
        {id: 'house-1', status: 'draft', familyId: 'family-1', siteAssessment: {terrainPhotos: [{id: 'wrong', url: '/wrong.jpg'}]}},
        {id: 'house-2', status: 'draft', familyId: 'family-2', siteAssessment: {terrainPhotos: [
          {id: 'one', url: '/terrain-1.jpg'},
          {id: 'two', url: '/terrain-2.jpg'},
        ]}},
      ],
      families: [
        {id: 'family-1', photoDataUrl: '/wrong-family.jpg'},
        {id: 'family-2', photoDataUrl: '/family-2.jpg'},
      ],
    } as unknown as ConstructionSiteState;

    const photos = await prepareRacPdfReportPhotos(constructionSite, 'house-2');

    expect(loadedSources).toEqual(['/family-2.jpg', '/terrain-1.jpg', '/terrain-2.jpg']);
    expect(photos.familyPhotoImageDataUrl).toBe('data:image/jpeg;base64,prepared');
    expect(photos.terrainPhotoImageDataUrls).toEqual([
      'data:image/jpeg;base64,prepared',
      'data:image/jpeg;base64,prepared',
      null,
      null,
    ]);
    expect(canvases).toEqual(Array(3).fill({width: 1200, height: 600}));
  });
});
