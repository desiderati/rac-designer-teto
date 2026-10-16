import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {EditorPortsContext, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import type {AppSettingKey, AppSettings} from '@/shared/types/settings.ts';
import {SettingsModal} from '@/components/rac-editor/@modals/ui/SettingsModal.tsx';

vi.mock('@/components/rac-editor/lib/use-mobile.tsx', () => ({
  useIsMobile: () => false,
}));

function renderSettingsModal() {
  let settings: AppSettings = {...APP_SETTINGS_DEFAULTS};
  const updateSetting = vi.fn((key: AppSettingKey, value: boolean) => {settings = {...settings, [key]: value};});
  const settingsPort = {getSettings: () => settings, updateSetting};
  const ports = {settingsPort} as unknown as EditorPorts;
  const onOpenChange = vi.fn();
  const onSettingsChange = vi.fn();
  const node = (isOpen: boolean) => <EditorPortsContext.Provider value={ports}>
    <SettingsModal isOpen={isOpen} onOpenChange={onOpenChange} onSettingsChange={onSettingsChange}/>
  </EditorPortsContext.Provider>;
  const view = render(node(true));
  return {updateSetting, settingsPort, onOpenChange, onSettingsChange, ...view,
    rerenderOpen: (isOpen: boolean) => view.rerender(node(isOpen))};
}

describe('SettingsModal.tsx', () => {
  it('renderiza as opções padrão do editor conforme configuração inicial', () => {
    renderSettingsModal();

    expect(screen.getByLabelText('Recalcular alturas automaticamente ao alterar níveis')).toBeChecked();
    expect(screen.getByLabelText(
      'Navegar automaticamente para o próximo piloti ao definir a altura do piloti selecionado',
    )).not.toBeChecked();
    expect(screen.getByLabelText('Habilitar Minimap por padrão')).not.toBeChecked();
    expect(screen.getByLabelText(
      'Abrir modais de editores em posição fixa ao lado da barra de ferramentas esquerda',
    )).toBeChecked();
    expect(screen.getByLabelText('Desabilitar a opção Lápis após desenho à mão livre')).toBeChecked();
    expect(screen.getByLabelText('Configurar o nível dos pilotis dos cantos ao inserir uma casa')).toBeChecked();
    expect(screen.getByLabelText(
      'Permitir a definição das alturas dos pilotis ao inserir uma casa',
    )).not.toBeChecked();
    expect(screen.getByLabelText('Mostrar escada na vista planta')).not.toBeChecked();
    expect(screen.getByLabelText('Mostrar labels dos pilotis na vista planta')).toBeChecked();
    expect(screen.getByLabelText('Mostrar rótulos nos menus (desktop)')).toBeChecked();
  });

  it('mantém a configuração de recalcular alturas sem título ou subtexto auxiliar', () => {
    renderSettingsModal();

    expect(screen.getByText('Recalcular alturas automaticamente ao alterar níveis')).toBeInTheDocument();
    expect(screen.queryByText('Alturas dos pilotis')).not.toBeInTheDocument();
    expect(screen.queryByText(/Desative para preservar alturas/i)).not.toBeInTheDocument();
  });

  it('permite configurar a visibilidade das labels dos pilotis na vista planta', async () => {
    const user = userEvent.setup();
    const {updateSetting} = renderSettingsModal();

    await user.click(screen.getByLabelText('Mostrar labels dos pilotis na vista planta'));
    await user.click(screen.getByRole('button', {name: 'Confirmar'}));

    expect(updateSetting).toHaveBeenCalledWith('showPilotiLabelsOnTopView', false);
  });
  it('salva a desativação dos rótulos somente ao confirmar e reapresenta a preferência persistida', async () => {
    const user = userEvent.setup();
    const {updateSetting, settingsPort, onSettingsChange, rerenderOpen} = renderSettingsModal();
    await user.click(screen.getByLabelText('Mostrar rótulos nos menus (desktop)'));
    expect(updateSetting).not.toHaveBeenCalled();
    expect(settingsPort.getSettings().showToolMenuLabels).toBe(true);
    await user.click(screen.getByRole('button', {name: 'Confirmar'}));
    expect(updateSetting).toHaveBeenCalledWith('showToolMenuLabels', false);
    expect(onSettingsChange).toHaveBeenCalledTimes(1);
    rerenderOpen(false); rerenderOpen(true);
    expect(screen.getByLabelText('Mostrar rótulos nos menus (desktop)')).not.toBeChecked();
  });

  it('descarta o rascunho dos rótulos ao cancelar e reabre marcado', async () => {
    const user = userEvent.setup();
    const {updateSetting, settingsPort, onSettingsChange, rerenderOpen} = renderSettingsModal();
    await user.click(screen.getByLabelText('Mostrar rótulos nos menus (desktop)'));
    await user.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(updateSetting).not.toHaveBeenCalled();
    expect(onSettingsChange).not.toHaveBeenCalled();
    expect(settingsPort.getSettings().showToolMenuLabels).toBe(true);
    rerenderOpen(false); rerenderOpen(true);
    expect(screen.getByLabelText('Mostrar rótulos nos menus (desktop)')).toBeChecked();
  });

});
