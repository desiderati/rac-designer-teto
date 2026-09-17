export interface AppSettings {
  autoNavigatePiloti: boolean;
  autoAdjustPilotiHeightsFromNivel: boolean;
  zoomEnabledByDefault: boolean;
  openEditorsAtFixedPosition: boolean;
  disableDrawModeAfterFreehand: boolean;
  configureCornerPilotiNiveisOnHouseInsert: boolean;
  allowPilotiHeightDefinitionOnHouseInsert: boolean;
  showStairsOnTopView: boolean;
  showPilotiLabelsOnTopView: boolean;
}

export type AppSettingKey = keyof AppSettings;
