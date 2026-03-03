import {useEffect, useState} from 'react';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {getSettings, updateSetting} from '@/infra/settings.ts';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({isOpen, onOpenChange, onSettingsChange}: SettingsModalProps) {
  const isMobile = useIsMobile();
  const [tempSettings, setTempSettings] = useState(getSettings);

  useEffect(() => {
    if (isOpen) {
      setTempSettings(getSettings());
    }
  }, [isOpen]);

  const handleToggle = (
    key: 'autoNavigatePiloti'
      | 'zoomEnabledByDefault'
      | 'openEditorsAtFixedPosition'
      | 'disableDrawModeAfterFreehand'
      | 'showStairsOnTopView',
    value: boolean
  ) => {
    setTempSettings((prev) => ({...prev, [key]: value}));
  };

  const handleConfirm = () => {
    updateSetting('autoNavigatePiloti', tempSettings.autoNavigatePiloti);
    updateSetting('zoomEnabledByDefault', tempSettings.zoomEnabledByDefault);
    updateSetting('openEditorsAtFixedPosition', tempSettings.openEditorsAtFixedPosition);
    updateSetting('disableDrawModeAfterFreehand', tempSettings.disableDrawModeAfterFreehand);
    updateSetting('showStairsOnTopView', tempSettings.showStairsOnTopView);
    onSettingsChange?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSettings(getSettings());
    onOpenChange(false);
  };

  const content =
    <>
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
        <Label htmlFor='zoom-enabled' className='text-sm leading-snug cursor-pointer flex-1'>
          Habilitar funcionalidade de Zoom/Minimap por padrão
        </Label>
        <Switch
          id='zoom-enabled'
          checked={tempSettings.zoomEnabledByDefault}
          onCheckedChange={(v) => handleToggle('zoomEnabledByDefault', v)}/>
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
        <Label htmlFor='show-stairs-top-view' className='text-sm leading-snug cursor-pointer flex-1'>
          Mostrar escada na vista superior, tipo planta
        </Label>
        <Switch
          id='show-stairs-top-view'
          checked={tempSettings.showStairsOnTopView}
          onCheckedChange={(v) => handleToggle('showStairsOnTopView', v)}/>
      </div>
    </>;

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
