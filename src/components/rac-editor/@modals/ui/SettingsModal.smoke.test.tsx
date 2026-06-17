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
