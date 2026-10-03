import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {applyPilotiPatch, recalculateRecommendedPilotiData} from '@/domain/house/use-cases/house-piloti.use-case.ts';
import {
  collectAutoContraventamentoRowsByColumn,
  HOUSE_CONTRAVENTAMENTO_COLUMNS,
  isHouseContraventamentoDestinationEligible,
  isHouseHorizontalContraventamentoDestinationEligible,
  resolveAutoContraventamentoRows,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';
import {PILOTI_CORNER_IDS} from '@/shared/config.ts';
import {ALL_PILOTI_HEIGHTS, DEFAULT_HOUSE_PILOTI, type HouseSide, type HouseType} from '@/shared/types/house.ts';
import {clampNivel, clampNivelByHeight, getAllPilotiIds, getMaxNivelForAvailableHeights, parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {isContraventamentoHorizontalSide, isContraventamentoVerticalSide, type ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import type {FieldContraventamentoDefinition, HouseFieldAnalysisDraft, HouseFieldAnalysisMetadata} from '@/shared/types/house-field-analysis.ts';
import type {HousePilotiPatch, InitialPilotiNivelDefinition} from '@/components/rac-editor/ports/HousePilotiPort.ts';

export function hasPersistedHouseView(house: PersistedHouseRecord): boolean {
  return Object.values(house.drawingDocument.house?.views ?? {}).some((views) => views.length > 0)
    || house.drawingDocument.canvas.objects.some((object) => object.kind === 'house' || object.metadata?.myType === 'house');
}

export function getHouseFieldAnalysisDisabledReason(site: ConstructionSiteState, house: PersistedHouseRecord): string | null {
  if (site.constructionSite.status !== 'in_progress') return 'A construção está bloqueada para edição.';
  if (house.status === 'built' || house.status === 'archived') return 'A casa está bloqueada para edição.';
  if (house.fieldAnalysis?.status === 'inserted' || hasPersistedHouseView(house)) return 'A casa já foi inserida no Canvas.';
  return null;
}

export function createHouseFieldAnalysisDraft(house: PersistedHouseRecord): HouseFieldAnalysisDraft {
  const state = house.drawingDocument.house ?? HouseAggregate.createInitialHouseState({
    id: house.id, pilotiIds: getAllPilotiIds(), defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: house.terrainType,
  });
  return structuredClone({
    house: {...state, id: house.id, houseType: house.houseType, terrainType: house.terrainType},
    selectedPilotiHeights: house.designSettings.selectedPilotiHeights,
    contraventamentos: house.fieldAnalysis?.contraventamentos ?? [],
  });
}

export function configureHouseFieldAnalysis(draft: HouseFieldAnalysisDraft, input: {
  houseType: Exclude<HouseType, null>;
  initialSide: HouseSide;
  selectedPilotiHeights: number[];
  cornerNiveis?: Record<string, InitialPilotiNivelDefinition>;
}): HouseFieldAnalysisDraft {
  const next = structuredClone(draft);
  const aggregate = HouseAggregate.fromState(next.house);
  aggregate.setHouseType(input.houseType);
  aggregate.autoAssignAllSides(input.initialSide);
  next.selectedPilotiHeights = [...input.selectedPilotiHeights];
  const maxNivel = getMaxNivelForAvailableHeights(next.selectedPilotiHeights);
  for (const [index, id] of PILOTI_CORNER_IDS.entries()) {
    const entry = input.cornerNiveis?.[id] ?? {nivel: DEFAULT_HOUSE_PILOTI.nivel, isMaster: index === 0};
    aggregate.applyPilotiPatch(id, {
      nivel: clampNivel(entry.nivel, DEFAULT_HOUSE_PILOTI.nivel, maxNivel), isMaster: entry.isMaster,
    });
  }
  next.house.pilotis = recalculateRecommendedPilotiData({
    pilotis: next.house.pilotis, defaultPiloti: DEFAULT_HOUSE_PILOTI, availableHeights: next.selectedPilotiHeights,
  });
  next.contraventamentos = reconcileFieldAnalysisContraventamentos(next.house.pilotis, []);
  return next;
}

/** Mesmas decisões automáticas da planta: conservar coluna ocupada e remover verticais inelegíveis. */
function reconcileFieldAnalysisContraventamentos(
  pilotis: HouseFieldAnalysisDraft['house']['pilotis'], definitions: FieldContraventamentoDefinition[],
): FieldContraventamentoDefinition[] {
  const required = collectAutoContraventamentoRowsByColumn(pilotis);
  const next = definitions.filter((definition) => isContraventamentoHorizontalSide(definition.side)
    || required.has(parsePilotiGridPosition(definition.originPilotiId)!.col));
  for (const col of HOUSE_CONTRAVENTAMENTO_COLUMNS) {
    const requiredRows = required.get(col);
    if (!requiredRows?.length || next.some((definition) => isContraventamentoVerticalSide(definition.side)
      && parsePilotiGridPosition(definition.originPilotiId)!.col === col)) continue;
    const {anchorRow, targetRow} = resolveAutoContraventamentoRows({col, pilotis, requiredRows});
    next.push({originPilotiId: `piloti_${col}_${anchorRow}`, destinationPilotiId: `piloti_${col}_${targetRow}`, side: 'left', isAuto: true});
  }
  return next;
}

export function updateFieldAnalysisPiloti(draft: HouseFieldAnalysisDraft, pilotiId: string, patch: HousePilotiPatch): HouseFieldAnalysisDraft {
  const current = draft.house.pilotis[pilotiId];
  if (!current) throw new Error('Piloti inválido.');
  const height = patch.height ?? current.height;
  if (!draft.selectedPilotiHeights.includes(height)) throw new Error('Altura de piloti indisponível nesta casa.');
  const nivel = clampNivelByHeight(patch.nivel ?? current.nivel, height);
  const {pilotis} = applyPilotiPatch({
    pilotis: draft.house.pilotis, pilotiId, defaultPiloti: DEFAULT_HOUSE_PILOTI,
    patch: {height, nivel, isMaster: PILOTI_CORNER_IDS.includes(pilotiId) && (patch.isMaster ?? current.isMaster)},
  });
  return {
    ...draft, house: {...draft.house, pilotis},
    contraventamentos: height !== current.height || nivel !== current.nivel
      ? reconcileFieldAnalysisContraventamentos(pilotis, draft.contraventamentos)
      : draft.contraventamentos,
  };
}

function definitionTouches(definition: FieldContraventamentoDefinition, pilotiId: string): boolean {
  const point = parsePilotiGridPosition(pilotiId);
  const origin = parsePilotiGridPosition(definition.originPilotiId);
  const destination = parsePilotiGridPosition(definition.destinationPilotiId);
  if (!point || !origin || !destination) return false;
  if (isContraventamentoVerticalSide(definition.side)) return point.col === origin.col;
  return point.row === origin.row && point.col >= Math.min(origin.col, destination.col)
    && point.col <= Math.max(origin.col, destination.col);
}

function definitionsOverlap(a: FieldContraventamentoDefinition, b: FieldContraventamentoDefinition): boolean {
  return a.side === b.side && getAllPilotiIds().some((id) => definitionTouches(a, id) && definitionTouches(b, id));
}

export function getFieldAnalysisDestinations(draft: HouseFieldAnalysisDraft, originPilotiId: string, side: ContraventamentoSide): string[] {
  const first = parsePilotiGridPosition(originPilotiId);
  return getAllPilotiIds().filter((id) => {
    const candidate = parsePilotiGridPosition(id)!;
    const eligible = isContraventamentoVerticalSide(side)
      ? isHouseContraventamentoDestinationEligible({first, candidate, pilotis: draft.house.pilotis})
      : isHouseHorizontalContraventamentoDestinationEligible({first, candidate, side, pilotis: draft.house.pilotis});
    const proposed = {originPilotiId, destinationPilotiId: id, side, isAuto: false};
    return eligible && !draft.contraventamentos.some((definition) => definitionsOverlap(definition, proposed));
  });
}

export function getFieldAnalysisContraventamentoState(draft: HouseFieldAnalysisDraft, pilotiId: string): Record<ContraventamentoSide, {active: boolean; disabled: boolean}> {
  return Object.fromEntries((['left', 'right', 'top', 'bottom'] as const).map((side) => {
    const active = draft.contraventamentos.some((definition) => definition.side === side && definitionTouches(definition, pilotiId));
    return [side, {active, disabled: !active && getFieldAnalysisDestinations(draft, pilotiId, side).length === 0}];
  })) as Record<ContraventamentoSide, {active: boolean; disabled: boolean}>;
}

export function addFieldAnalysisContraventamento(draft: HouseFieldAnalysisDraft, originPilotiId: string, destinationPilotiId: string, side: ContraventamentoSide): HouseFieldAnalysisDraft {
  if (!getFieldAnalysisDestinations(draft, originPilotiId, side).includes(destinationPilotiId)) throw new Error('Destino de contraventamento inválido.');
  return {...draft, contraventamentos: [...draft.contraventamentos, {originPilotiId, destinationPilotiId, side, isAuto: false}]};
}

export function removeFieldAnalysisContraventamento(draft: HouseFieldAnalysisDraft, pilotiId: string, side: ContraventamentoSide): HouseFieldAnalysisDraft {
  return {...draft, contraventamentos: draft.contraventamentos.filter((definition) => definition.side !== side || !definitionTouches(definition, pilotiId))};
}

export function normalizeHouseFieldAnalysis(value: unknown): HouseFieldAnalysisMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as HouseFieldAnalysisMetadata;
  if (!['prepared', 'inserted'].includes(candidate.status) || !Array.isArray(candidate.contraventamentos)) return undefined;
  const definitions: FieldContraventamentoDefinition[] = [];
  for (const definition of candidate.contraventamentos) {
    const origin = /^piloti_[0-3]_[0-2]$/.test(definition?.originPilotiId) && parsePilotiGridPosition(definition.originPilotiId);
    const destination = /^piloti_[0-3]_[0-2]$/.test(definition?.destinationPilotiId) && parsePilotiGridPosition(definition.destinationPilotiId);
    if (!origin || !destination || typeof definition.isAuto !== 'boolean') return undefined;
    if (isContraventamentoVerticalSide(definition.side)) {
      if (origin.col !== destination.col || origin.row === destination.row) return undefined;
    } else if (isContraventamentoHorizontalSide(definition.side)) {
      if (origin.row !== destination.row || origin.col === destination.col || definition.isAuto
        || (origin.row === 0 && definition.side !== 'bottom') || (origin.row === 2 && definition.side !== 'top')) return undefined;
    } else return undefined;
    if (definitions.some((existing) => definitionsOverlap(existing, definition))) return undefined;
    definitions.push({originPilotiId: definition.originPilotiId, destinationPilotiId: definition.destinationPilotiId, side: definition.side, isAuto: definition.isAuto});
  }
  if (candidate.status === 'inserted' && definitions.length > 0) return undefined;
  return {status: candidate.status, contraventamentos: definitions};
}

export function validateHouseFieldAnalysisDraft(draft: HouseFieldAnalysisDraft): void {
  const ids = getAllPilotiIds();
  const heights = draft.selectedPilotiHeights;
  const validHeights = heights.length === 8 && new Set(heights).size === 8 && heights.every((height) => (ALL_PILOTI_HEIGHTS as readonly number[]).includes(height));
  const validPilotis = ids.every((id) => {
    const piloti = draft.house.pilotis[id];
    return piloti && heights.includes(piloti.height) && Number.isFinite(piloti.nivel)
      && piloti.nivel >= DEFAULT_HOUSE_PILOTI.nivel && piloti.nivel <= piloti.height / 2
      && typeof piloti.isMaster === 'boolean' && (!piloti.isMaster || PILOTI_CORNER_IDS.includes(id));
  });
  const masters = Object.values(draft.house.pilotis).filter((piloti) => piloti.isMaster).length;
  const sourceView = draft.house.houseType === 'tipo6' ? 'front' : 'side2';
  const side = draft.house.preAssignedSides[sourceView];
  const validSide = draft.house.houseType === 'tipo6' ? ['top', 'bottom'].includes(side) : ['left', 'right'].includes(side);
  if (!['tipo6', 'tipo3'].includes(draft.house.houseType) || !validSide || !validHeights || !validPilotis || masters > 1
    || !normalizeHouseFieldAnalysis({status: 'prepared', contraventamentos: draft.contraventamentos})) {
    throw new Error('A configuração da Análise de Campo é inválida. Revise os dados antes de salvar.');
  }
}
