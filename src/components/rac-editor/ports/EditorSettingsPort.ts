import type {AppSettingKey, AppSettings} from '@/shared/types/settings.ts';

/**
 * Porta de leitura e escrita das configurações do editor.
 */
export interface EditorSettingsPort {
  /** Retorna as configurações atuais aplicando defaults quando necessário. */
  getSettings(): AppSettings;

  /** Persiste uma configuração individual do editor. */
  updateSetting<K extends AppSettingKey>(key: K, value: AppSettings[K]): void;
}
