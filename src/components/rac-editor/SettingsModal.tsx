import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { getSettings, updateSetting } from '@/lib/settings';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({ open, onOpenChange, onSettingsChange }: SettingsModalProps) {
  const [tempSettings, setTempSettings] = useState(getSettings);

  // Reset temp state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempSettings(getSettings());
    }
    if (!isOpen) {
      // Revert on close without confirm
      setTempSettings(getSettings());
    }
    onOpenChange(isOpen);
  };

  const handleToggle = (key: 'autoNavigatePiloti' | 'zoomEnabledByDefault', value: boolean) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" hideCloseButton>
        <div className="flex flex-col gap-4">
          {/* Header: icon + title + close */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faGear} className="text-2xl text-muted-foreground" />
            </div>
            <span className="font-bold text-2xl flex-1 text-center">Configurações</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 rounded-full bg-white flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* White card body */}
          <div className="bg-white rounded-xl p-4 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <Label htmlFor="auto-navigate" className="text-sm leading-snug cursor-pointer flex-1">
                Navegar automaticamente para o próximo piloti ao definir a altura do piloti selecionado
              </Label>
              <Switch
                id="auto-navigate"
                checked={tempSettings.autoNavigatePiloti}
                onCheckedChange={(v) => handleToggle('autoNavigatePiloti', v)}
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <Label htmlFor="zoom-enabled" className="text-sm leading-snug cursor-pointer flex-1">
                Habilitar funcionalidade de Zoom/Minimap por padrão
              </Label>
              <Switch
                id="zoom-enabled"
                checked={tempSettings.zoomEnabledByDefault}
                onCheckedChange={(v) => handleToggle('zoomEnabledByDefault', v)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-white" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
