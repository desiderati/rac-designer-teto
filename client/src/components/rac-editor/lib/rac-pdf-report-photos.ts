import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

export interface RacPdfPreparedPhotos {
  familyPhotoImageDataUrl: string | null;
  terrainPhotoImageDataUrls: (string | null)[];
}

/** Reduz fotos para a resolução útil no PDF antes de incorporá-las ao documento. */
export async function prepareRacPdfReportPhotos(
  constructionSite: ConstructionSiteState,
  houseId?: string,
): Promise<RacPdfPreparedPhotos> {
  const house = houseId
    ? constructionSite.houses.find((entry) => entry.id === houseId && entry.status !== 'archived')
    : constructionSite.houses.find((entry) => entry.id === constructionSite.constructionSite.activeHouseId && entry.status !== 'archived')
      ?? constructionSite.houses.find((entry) => entry.status !== 'archived');
  const family = constructionSite.families.find((entry) => entry.id === house?.familyId);
  const sources = [
    family?.photoDataUrl,
    ...Array.from({length: 4}, (_, index) => house?.siteAssessment.terrainPhotos?.[index]?.url),
  ];
  const [familyPhotoImageDataUrl, ...terrainPhotoImageDataUrls] = await Promise.all(
    sources.map(preparePhoto),
  );

  return {familyPhotoImageDataUrl, terrainPhotoImageDataUrls};
}

async function preparePhoto(source: string | undefined): Promise<string | null> {
  if (!source) return null;

  return new Promise((resolve) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => finish(null), 8000);
    let finished = false;

    function finish(value: string | null) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    }

    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) return finish(null);
        const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return finish(null);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.86));
      } catch {
        finish(null);
      }
    };
    image.onerror = () => finish(null);
    if (!source.startsWith('data:')) image.crossOrigin = 'anonymous';
    try {
      image.src = source;
    } catch {
      finish(null);
    }
  });
}
