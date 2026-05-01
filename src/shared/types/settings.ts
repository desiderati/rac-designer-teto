export interface AppSettings {
  autoNavigatePiloti: boolean;
  zoomEnabledByDefault: boolean;
  openEditorsAtFixedPosition: boolean;
  disableDrawModeAfterFreehand: boolean;
  showStairsOnTopView: boolean;
}

export type AppSettingKey = keyof AppSettings;
