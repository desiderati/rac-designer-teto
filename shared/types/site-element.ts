/** Objetos livres do entorno; não são vistas estruturais da Casa TETO. */
export type BuildingDoorSide = 'top' | 'bottom' | 'left' | 'right';
export type SiteElementKey =
  | 'siteHouse'
  | 'buildingTop' | 'buildingBottom' | 'buildingLeft' | 'buildingRight'
  | 'fence'
  | 'entryUp' | 'entryDown' | 'entryLeft' | 'entryRight'
  | 'gateSwing';
export type SiteLabelEditorType = 'siteHouse' | 'siteBuilding' | 'fence' | 'terrainEntry';

export function isSiteLabelEditorType(kind: string | undefined): kind is SiteLabelEditorType {
  return kind === 'siteHouse' || kind === 'siteBuilding' || kind === 'fence' || kind === 'terrainEntry';
}
