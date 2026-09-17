import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {EditorPortsContext, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import {SettingsModal} from '@/components/rac-editor/@modals/ui/SettingsModal.tsx';

vi.mock('@/components/rac-editor/lib/use-mobile.tsx', () => ({
  useIsMobile: () => false,
}));

function renderSettingsModal() {
  const updateSetting = vi.fn();
  const settingsPort = {
    getSettings: () => APP_SETTINGS_DEFAULTS,
    updateSetting,
  };
  const ports = {
    settingsPort,
  } as unknown as EditorPorts;

  return {
    updateSetting,
    ...render(
      <EditorPortsContext.Provider value={ports}>
        <SettingsModal isOpen onOpenChange={vi.fn()}/>
      </EditorPortsContext.Provider>,
    ),
  };
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
});
