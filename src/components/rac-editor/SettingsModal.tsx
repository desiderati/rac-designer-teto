import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getSettings, updateSetting } from '@/lib/settings';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({ open, onOpenChange, onSettingsChange }: SettingsModalProps) {
  const [settings, setSettings] = useState(getSettings);

  const handleToggle = (key: 'autoNavigatePiloti' | 'zoomDisabledByDefault', value: boolean) => {
    updateSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    onSettingsChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Preferências do editor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex items-start justify-between gap-4">
            <Label htmlFor="auto-navigate" className="text-sm leading-snug cursor-pointer flex-1">
              Navegar automaticamente para o próximo piloti ao definir a altura na edição de piloti
            </Label>
            <Switch
              id="auto-navigate"
              checked={settings.autoNavigatePiloti}
              onCheckedChange={(v) => handleToggle('autoNavigatePiloti', v)}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <Label htmlFor="zoom-disabled" className="text-sm leading-snug cursor-pointer flex-1">
              Funcionalidade de Zoom/Minimap desabilitada por padrão
            </Label>
            <Switch
              id="zoom-disabled"
              checked={settings.zoomDisabledByDefault}
              onCheckedChange={(v) => handleToggle('zoomDisabledByDefault', v)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
