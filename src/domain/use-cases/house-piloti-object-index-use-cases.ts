export interface PilotiObjectLike {
  pilotiId?: unknown;
  isPilotiCircle?: unknown;
  isPilotiRect?: unknown;
}

export interface PilotiObjectIndexEntry<TObject> {
  circle?: TObject;
  rect?: TObject;
}

export type PilotiObjectIndex<TObject> = Record<string, PilotiObjectIndexEntry<TObject>>;

export function buildPilotiObjectIndex<TObject extends PilotiObjectLike>(
  objects: TObject[],
): PilotiObjectIndex<TObject> {
  return objects.reduce((acc, object) => {
    const pilotiId = typeof object.pilotiId === 'string' ? object.pilotiId : '';
    if (!pilotiId) return acc;

    const entry = acc[pilotiId] ?? {};
    if (object.isPilotiCircle && !entry.circle) {
      entry.circle = object;
    }
    if (object.isPilotiRect && !entry.rect) {
      entry.rect = object;
    }
    acc[pilotiId] = entry;
    return acc;
  }, {} as PilotiObjectIndex<TObject>);
}
