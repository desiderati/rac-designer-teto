import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';

const COLLECTIONS = [
  { key: 'communities', singular: 'comunidade', plural: 'comunidades', gender: 'f' },
  { key: 'families', singular: 'família', plural: 'famílias', gender: 'f' },
  { key: 'monitors', singular: 'monitor', plural: 'monitores', gender: 'm' },
  { key: 'houses', singular: 'casa', plural: 'casas', gender: 'f' },
] as const;

/** Resume cada lado do conflito em relação ao documento que a sessão carregou. */
export function summarizeConstructionSiteChanges(
  base: ConstructionSiteState | null,
  candidate: ConstructionSiteState,
): string[] {
  if (!base) return ['Versão-base indisponível para calcular as diferenças.'];

  const changes: string[] = [];
  if (!sameValue(withoutSessionMetadata(base.constructionSite), withoutSessionMetadata(candidate.constructionSite))) {
    changes.push('Dados da Construção alterados');
  }

  for (const { key, singular, plural, gender } of COLLECTIONS) {
    const before = new Map<string, unknown>(base[key].map((entry) => [entry.id, entry] as const));
    const after = new Map<string, unknown>(candidate[key].map((entry) => [entry.id, entry] as const));
    let added = 0;
    let changed = 0;
    let removed = 0;

    for (const [id, entry] of after) {
      const previous = before.get(id);
      if (!previous) added += 1;
      else if (!sameValue(previous, entry)) changed += 1;
    }
    for (const id of before.keys()) {
      if (!after.has(id)) removed += 1;
    }

    const suffix = gender === 'f' ? 'a' : 'o';
    if (added) changes.push(`${added} ${added === 1 ? singular : plural} adicionad${suffix}${added === 1 ? '' : 's'}`);
    if (changed) changes.push(`${changed} ${changed === 1 ? singular : plural} alterad${suffix}${changed === 1 ? '' : 's'}`);
    if (removed) changes.push(`${removed} ${removed === 1 ? singular : plural} removid${suffix}${removed === 1 ? '' : 's'}`);
  }

  return changes.length ? changes : ['Nenhuma mudança de cadastro ou RAC detectada.'];
}

function withoutSessionMetadata(site: ConstructionSiteState['constructionSite']) {
  const { activeHouseId: _activeHouseId, createdAt: _createdAt, documentVersion: _documentVersion, updatedAt: _updatedAt, ...data } = site;
  return data;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
