import {useState} from 'react';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {useIsMobile} from '@/shared/hooks/use-mobile.tsx';
import {getSettings, updateSetting} from '@/lib/settings.ts';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({open, onOpenChange, onSettingsChange}: SettingsModalProps) {
  const isMobile = useIsMobile();
  const [tempSettings, setTempSettings] = useState(getSettings);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempSettings(getSettings());
    }
    if (!isOpen) {
      setTempSettings(getSettings());
    }
    onOpenChange(isOpen);
  };

  const handleToggle = (key: 'autoNavigatePiloti' | 'zoomEnabledByDefault', value: boolean) => {
    setTempSettings((prev) => ({...prev, [key]: value}));
  };

  const handleConfirm = () => {
    updateSetting('autoNavigatePiloti', tempSettings.autoNavigatePiloti);
    updateSetting('zoomEnabledByDefault', tempSettings.zoomEnabledByDefault);
    onSettingsChange?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSettings(getSettings());
    onOpenChange(false);
  };

  const settingsCard =
    <div className="bg-white rounded-xl p-4 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <Label htmlFor="auto-navigate" className="text-sm leading-snug cursor-pointer flex-1">
          Navegar automaticamente para o próximo piloti ao definir a altura do piloti selecionado
        </Label>
        <Switch
          id="auto-navigate"
          checked={tempSettings.autoNavigatePiloti}
          onCheckedChange={(v) => handleToggle('autoNavigatePiloti', v)}/>

      </div>

      <div className="flex items-start justify-between gap-4">
        <Label htmlFor="zoom-enabled" className="text-sm leading-snug cursor-pointer flex-1">
          Habilitar funcionalidade de Zoom/Minimap por padrão
        </Label>
        <Switch
          id="zoom-enabled"
          checked={tempSettings.zoomEnabledByDefault}
          onCheckedChange={(v) => handleToggle('zoomEnabledByDefault', v)}/>

      </div>
    </div>;

  const actionButtons = (extraClass = '') =>
    <div className={`flex gap-[16px] ${extraClass}`}>
      <Button variant="outline" className="flex-1 bg-white" onClick={handleCancel}>
        Cancelar
      </Button>
      <Button className="flex-1" onClick={handleConfirm}>
        Confirmar
      </Button>
    </div>;


  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center text-2xl">Configurações</DialogTitle>
          </DialogHeader>
          {settingsCard}
          {actionButtons()}
        </DialogContent>
      </Dialog>);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-center text-2xl">Configurações</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {settingsCard}
          {actionButtons('mt-4')}
        </div>
      </DrawerContent>
    </Drawer>);
}
