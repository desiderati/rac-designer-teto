import type {
  ConstructionSiteState,
  PersistedHouseRecord,
} from '@/shared/types/construction-site.ts';
import {ALL_HOUSE_VIEW_TYPES, type HouseViewType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

export type RacPdfExportChecklistSeverity = 'required' | 'recommended';
export type RacPdfExportChecklistStatus = 'ok' | 'missing';

export interface RacPdfExportChecklistItem {
  id: string;
  label: string;
  description: string;
  severity: RacPdfExportChecklistSeverity;
  status: RacPdfExportChecklistStatus;
}

export interface RacPdfExportChecklist {
  items: RacPdfExportChecklistItem[];
  missingRequiredItems: RacPdfExportChecklistItem[];
  missingRecommendedItems: RacPdfExportChecklistItem[];
  hasBlockingItems: boolean;
}

const ELEVATION_VIEW_TYPES: HouseViewType[] = ['front', 'back', 'side1', 'side2'];

export function buildRacPdfExportChecklist(
  constructionSite: ConstructionSiteState | null | undefined,
): RacPdfExportChecklist {
  const activeHouse = getChecklistHouse(constructionSite);
  const family = getChecklistFamily(constructionSite, activeHouse);
  const activeMonitors = Array.isArray(constructionSite?.monitors)
    ? constructionSite.monitors.filter((monitor) => monitor.status === 'active')
    : [];
  const pilotis = activeHouse?.drawingDocument?.house?.pilotis ?? {};

  const items: RacPdfExportChecklistItem[] = [
    createChecklistItem({
      id: 'construction',
      label: 'Construção ativa',
      description: 'Existe uma Construção TETO ativa para compor o cabeçalho do PDF.',
      severity: 'required',
      ok: Boolean(constructionSite?.constructionSite?.id),
    }),
    createChecklistItem({
      id: 'house',
      label: 'Casa ativa não arquivada',
      description: 'Existe uma casa disponível para impressão da RAC.',
      severity: 'required',
      ok: Boolean(activeHouse),
    }),
    createChecklistItem({
      id: 'house-drawing',
      label: 'Desenho da casa',
      description: 'A casa possui documento de desenho sincronizado para gerar a RAC.',
      severity: 'required',
      ok: Boolean(activeHouse?.drawingDocument?.house),
    }),
    createChecklistItem({
      id: 'any-view',
      label: 'Vista no canvas',
      description: 'Ao menos uma vista da casa foi inserida no canvas.',
      severity: 'required',
      ok: hasAnyHouseView(activeHouse),
    }),
    createChecklistItem({
      id: 'family-name',
      label: 'Nome da família',
      description: 'A família vinculada tem nome preenchido.',
      severity: 'recommended',
      ok: hasText(family?.name),
    }),
    createChecklistItem({
      id: 'construction-code',
      label: 'Código da construção',
      description: 'O código da construção aparece no cabeçalho do relatório.',
      severity: 'recommended',
      ok: hasText(constructionSite?.constructionSite?.externalCode),
    }),
    createChecklistItem({
      id: 'community',
      label: 'Comunidade',
      description: 'A construção tem comunidade identificada.',
      severity: 'recommended',
      ok: hasText(getCommunityName(constructionSite)),
    }),
    createChecklistItem({
      id: 'house-type',
      label: 'Tipo da casa',
      description: 'O tipo da casa está definido como Tipo 3 ou Tipo 6.',
      severity: 'required',
      ok: Boolean(activeHouse?.houseType),
    }),
    createChecklistItem({
      id: 'house-size',
      label: 'Tamanho da casa',
      description: 'O tamanho da casa foi preenchido no formulário.',
      severity: 'recommended',
      ok: Boolean(activeHouse?.houseSize),
    }),
    createChecklistItem({
      id: 'top-view',
      label: 'Vista planta',
      description: 'A RAC inclui uma planta da casa.',
      severity: 'recommended',
      ok: getHouseViewCount(activeHouse, 'top') > 0,
    }),
    createChecklistItem({
      id: 'elevation-view',
      label: 'Vista elevada ou lateral',
      description: 'A RAC inclui ao menos uma vista elevada, frontal, traseira ou lateral.',
      severity: 'recommended',
      ok: ELEVATION_VIEW_TYPES.some((viewType) => getHouseViewCount(activeHouse, viewType) > 0),
    }),
    createChecklistItem({
      id: 'piloti-master',
      label: 'Piloti mestre',
      description: 'Exatamente um piloti mestre está definido para orientar leitura de níveis.',
      severity: 'recommended',
      ok: Object.values(pilotis).filter((piloti) => piloti?.isMaster === true).length === 1,
    }),
    createChecklistItem({
      id: 'pilotis-complete',
      label: 'Níveis e alturas dos pilotis',
      description: 'Todos os pilotis esperados possuem nível e altura numéricos.',
      severity: 'recommended',
      ok: getAllPilotiIds().every((pilotiId) => {
        const piloti = pilotis[pilotiId];
        return Number.isFinite(piloti?.height) && Number.isFinite(piloti?.nivel);
      }),
    }),
    createChecklistItem({
      id: 'soil',
      label: 'Solo',
      description: 'O perfil de solo foi informado para o cálculo de dificuldade.',
      severity: 'recommended',
      ok: Boolean(activeHouse?.siteAssessment?.soilProfile),
    }),
    createChecklistItem({
      id: 'construction-date',
      label: 'Data da construção',
      description: 'A data da construção está preenchida.',
      severity: 'recommended',
      ok: hasText(constructionSite?.constructionSite?.constructionDate),
    }),
    createChecklistItem({
      id: 'location',
      label: 'Localização',
      description: 'A localização do terreno foi registrada na avaliação da casa.',
      severity: 'recommended',
      ok: hasText(activeHouse?.siteAssessment?.locationQuery),
    }),
    createChecklistItem({
      id: 'family-contact',
      label: 'Contato da família',
      description: 'O contato principal da família tem nome ou telefone preenchido.',
      severity: 'recommended',
      ok: hasText(family?.primaryContactName) || hasText(family?.primaryContactPhone),
    }),
    createChecklistItem({
      id: 'leaders',
      label: 'Lideranças',
      description: 'As lideranças responsáveis pela casa foram informadas.',
      severity: 'recommended',
      ok: hasText(activeHouse?.leaders),
    }),
    createChecklistItem({
      id: 'monitor',
      label: 'Monitoria ativa',
      description: 'Há ao menos um monitor ativo para aparecer no relatório.',
      severity: 'recommended',
      ok: activeMonitors.length > 0,
    }),
    createChecklistItem({
      id: 'extra-materials-justification',
      label: 'Justificativa de materiais extras',
      description: 'Materiais extras com quantidade informada têm justificativa preenchida.',
      severity: 'recommended',
      ok: !hasExtraMaterialCount(activeHouse) || hasText(activeHouse?.extraMaterials?.justification),
    }),
  ];

  const missingRequiredItems = items.filter((item) => item.status === 'missing' && item.severity === 'required');
  const missingRecommendedItems = items
    .filter((item) => item.status === 'missing' && item.severity === 'recommended');

  return {
    items,
    missingRequiredItems,
    missingRecommendedItems,
    hasBlockingItems: missingRequiredItems.length > 0,
  };
}

export function formatRacPdfExportChecklistSummary(checklist: RacPdfExportChecklist): string {
  const missingItems = [
    ...checklist.missingRequiredItems,
    ...checklist.missingRecommendedItems,
  ];

  if (missingItems.length === 0) return 'Checklist sem pendências.';

  const visibleLabels = missingItems.slice(0, 3).map((item) => item.label);
  const remainingCount = missingItems.length - visibleLabels.length;
  return remainingCount > 0
    ? `${visibleLabels.join(', ')} e mais ${remainingCount}`
    : visibleLabels.join(', ');
}

function createChecklistItem(input: {
  id: string;
  label: string;
  description: string;
  severity: RacPdfExportChecklistSeverity;
  ok: boolean;
}): RacPdfExportChecklistItem {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    severity: input.severity,
    status: input.ok ? 'ok' : 'missing',
  };
}

function getChecklistHouse(constructionSite: ConstructionSiteState | null | undefined): PersistedHouseRecord | null {
  const houses = Array.isArray(constructionSite?.houses) ? constructionSite.houses : [];
  const activeHouseId = constructionSite?.constructionSite?.activeHouseId;
  return houses.find((house) => house.id === activeHouseId && house.status !== 'archived')
    ?? houses.find((house) => house.status !== 'archived')
    ?? null;
}

function getChecklistFamily(
  constructionSite: ConstructionSiteState | null | undefined,
  house: PersistedHouseRecord | null,
) {
  const families = Array.isArray(constructionSite?.families) ? constructionSite.families : [];
  return families.find((family) => family.id === house?.familyId) ?? null;
}

function getCommunityName(constructionSite: ConstructionSiteState | null | undefined): string {
  const communityId = constructionSite?.constructionSite?.communityId;
  const communities = Array.isArray(constructionSite?.communities) ? constructionSite.communities : [];
  return communities.find((community) => community.id === communityId)?.name ?? '';
}

function getHouseViewCount(house: PersistedHouseRecord | null, viewType: HouseViewType): number {
  const documentViews = house?.drawingDocument?.views?.[viewType]?.length ?? 0;
  const houseViews = house?.drawingDocument?.house?.views?.[viewType]?.length ?? 0;
  return Math.max(documentViews, houseViews);
}

function hasAnyHouseView(house: PersistedHouseRecord | null): boolean {
  return ALL_HOUSE_VIEW_TYPES.some((viewType) => getHouseViewCount(house, viewType) > 0);
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasExtraMaterialCount(house: PersistedHouseRecord | null): boolean {
  const extraMaterials = house?.extraMaterials;
  if (!extraMaterials) return false;

  return [
    extraMaterials.floorBeams,
    extraMaterials.rafters,
    extraMaterials.secondaryBeams,
    extraMaterials.gutters,
  ].some((value) => Number.isInteger(value) && value > 0);
}
