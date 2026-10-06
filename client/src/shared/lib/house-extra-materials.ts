import type {HouseExtraMaterials, StairType} from '@/shared/types/construction-site.ts';

export const EXTRA_MATERIAL_LABELS = [
  ['stairBeams', 'Vigas p/ Escada'], ['stairType', 'Tipo Escada'],
  ['gutterCount', 'Calhas'], ['gutterCaps', 'Tampão'],
  ['gutterElbows', 'Joelhos'], ['asphaltBlanket', 'Manta Asfáltica'],
  ['bracing', 'Contraventamento'], ['rafters', 'Caibros'],
  ['secondaryBeams', 'Secundárias'], ['gutters', 'Mata-Juntas'],
] as const;

export const STAIR_TYPE_LABELS: Record<StairType, string> = {
  straight: 'Reta', landing: 'Com Patamar', access_ramp: 'Rampa de Acesso',
};

export function getExtraMaterialSummary(materials?: HouseExtraMaterials) {
  const rows = EXTRA_MATERIAL_LABELS.flatMap<{label: string; value: string}>(([key, label]) => {
    const value = materials?.[key];
    if (key === 'stairType') return value ? [{label, value: STAIR_TYPE_LABELS[value as StairType]}] : [];
    if (key === 'asphaltBlanket') return typeof value === 'boolean' ? [{label, value: value ? 'Sim' : 'Não'}] : [];
    return typeof value === 'number' && value > 0 ? [{label, value: String(value)}] : [];
  });
  if (materials?.justification?.trim()) rows.push({label: 'Outros / Justificativas', value: materials.justification.trim()});
  return rows;
}
