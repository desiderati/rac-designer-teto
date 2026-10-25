export const RAC_PDF_EXPORT_STEPS = [
  {id: 'capture-canvas', label: 'Capturar o desenho 2D do Canvas'},
  {id: 'capture-3d', label: 'Capturar a vista 3D da casa'},
  {id: 'prepare-photos', label: 'Preparar fotos da família e do terreno'},
  {id: 'build-report-model', label: 'Organizar dados da casa e da construção'},
  {id: 'render-pdf', label: 'Compor as páginas do PDF'},
  {id: 'create-preview', label: 'Preparar a prévia para revisão'},
] as const;

export type RacPdfExportStepId = typeof RAC_PDF_EXPORT_STEPS[number]['id'];

export type RacPdfExportStepStatus = 'pending' | 'active' | 'success' | 'error';

export function createInitialRacPdfExportStatuses(): Record<RacPdfExportStepId, RacPdfExportStepStatus> {
  return Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}, index) => [id, index === 0 ? 'active' : 'pending'])) as Record<RacPdfExportStepId, RacPdfExportStepStatus>;
}
