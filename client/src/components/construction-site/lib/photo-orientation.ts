export type PhotoOrientation = 'landscape' | 'portrait' | 'square';

export function getPhotoOrientation(width: number, height: number): PhotoOrientation {
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}
