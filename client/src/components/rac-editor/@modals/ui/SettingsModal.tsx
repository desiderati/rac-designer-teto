import {useEffect, useState} from 'react';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {AppSettingKey} from '@/shared/types/settings.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({isOpen, onOpenChange, onSettingsChange}: SettingsModalProps) {
  const isMobile = useIsMobile();
  const {settingsPort} = useEditorPorts();
  const [tempSettings, setTempSettings] = useState(() => settingsPort.getSettings());

  useEffect(() => {
    if (isOpen) {
      setTempSettings(settingsPort.getSettings());
    }
  }, [isOpen, settingsPort]);

  const handleToggle = (key: AppSettingKey, value: boolean) => {
    setTempSettings((prev) => ({...prev, [key]: value}));
  };

  const handleConfirm = () => {
    settingsPort.updateSetting('autoNavigatePiloti', tempSettings.autoNavigatePiloti);
    settingsPort.updateSetting(
      'autoAdjustPilotiHeightsFromNivel',
      tempSettings.autoAdjustPilotiHeightsFromNivel,
    );
    settingsPort.updateSetting('zoomEnabledByDefault', tempSettings.zoomEnabledByDefault);
    settingsPort.updateSetting('openEditorsAtFixedPosition', tempSettings.openEditorsAtFixedPosition);
    settingsPort.updateSetting('disableDrawModeAfterFreehand', tempSettings.disableDrawModeAfterFreehand);
    settingsPort.updateSetting(
      'configureCornerPilotiNiveisOnHouseInsert',
      tempSettings.configureCornerPilotiNiveisOnHouseInsert,
    );
    settingsPort.updateSetting(
      'allowPilotiHeightDefinitionOnHouseInsert',
      tempSettings.allowPilotiHeightDefinitionOnHouseInsert,
    );
    settingsPort.updateSetting('showStairsOnTopView', tempSettings.showStairsOnTopView);
    settingsPort.updateSetting('showPilotiLabelsOnTopView', tempSettings.showPilotiLabelsOnTopView);
    onSettingsChange?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSettings(settingsPort.getSettings());
    onOpenChange(false);
  };

  const content =
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='auto-adjust-piloti-heights' className='text-sm leading-snug cursor-pointer flex-1'>
          Recalcular alturas automaticamente ao alterar níveis
        </Label>
        <Switch
          id='auto-adjust-piloti-heights'
          checked={tempSettings.autoAdjustPilotiHeightsFromNivel}
          onCheckedChange={(v) => handleToggle('autoAdjustPilotiHeightsFromNivel', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='auto-navigate' className='text-sm leading-snug cursor-pointer flex-1'>
          Navegar automaticamente para o próximo piloti ao definir a altura do piloti selecionado
        </Label>
        <Switch
          id='auto-navigate'
          checked={tempSettings.autoNavigatePiloti}
          onCheckedChange={(v) => handleToggle('autoNavigatePiloti', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label
          htmlFor='zoom-enabled'
          className='text-sm leading-snug cursor-pointer flex-1'
        >
          Habilitar Minimap por padrão
        </Label>
        <Switch
          id='zoom-enabled'
          checked={tempSettings.zoomEnabledByDefault}
          onCheckedChange={(v) => handleToggle('zoomEnabledByDefault', v)}
        />
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='fixed-editors' className='text-sm leading-snug cursor-pointer flex-1'>
          Abrir modais de editores em posição fixa ao lado da barra de ferramentas esquerda
        </Label>
        <Switch
          id='fixed-editors'
          checked={tempSettings.openEditorsAtFixedPosition}
          onCheckedChange={(v) => handleToggle('openEditorsAtFixedPosition', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='disable-draw-after-freehand' className='text-sm leading-snug cursor-pointer flex-1'>
          Desabilitar a opção Lápis após desenho à mão livre
        </Label>
        <Switch
          id='disable-draw-after-freehand'
          checked={tempSettings.disableDrawModeAfterFreehand}
          onCheckedChange={(v) => handleToggle('disableDrawModeAfterFreehand', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='configure-corner-piloti-niveis' className='text-sm leading-snug cursor-pointer flex-1'>
          Configurar o nível dos pilotis dos cantos ao inserir uma casa
        </Label>
        <Switch
          id='configure-corner-piloti-niveis'
          checked={tempSettings.configureCornerPilotiNiveisOnHouseInsert}
          onCheckedChange={(v) => handleToggle('configureCornerPilotiNiveisOnHouseInsert', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='allow-piloti-height-definition' className='text-sm leading-snug cursor-pointer flex-1'>
          Permitir a definição das alturas dos pilotis ao inserir uma casa
        </Label>
        <Switch
          id='allow-piloti-height-definition'
          checked={tempSettings.allowPilotiHeightDefinitionOnHouseInsert}
          onCheckedChange={(v) => handleToggle('allowPilotiHeightDefinitionOnHouseInsert', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='show-stairs-top-view' className='text-sm leading-snug cursor-pointer flex-1'>
          Mostrar escada na vista planta
        </Label>
        <Switch
          id='show-stairs-top-view'
          checked={tempSettings.showStairsOnTopView}
          onCheckedChange={(v) => handleToggle('showStairsOnTopView', v)}/>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <Label htmlFor='show-piloti-labels-top-view' className='text-sm leading-snug cursor-pointer flex-1'>
          Mostrar labels dos pilotis na vista planta
        </Label>
        <Switch
          id='show-piloti-labels-top-view'
          checked={tempSettings.showPilotiLabelsOnTopView}
          onCheckedChange={(v) => handleToggle('showPilotiLabelsOnTopView', v)}/>
      </div>
    </div>;

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      title='Configurações'
      content={content}
      confirmLabel='Confirmar'
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
    />
  );
}
