import type {ComponentProps, MouseEventHandler} from 'react';
import {RacEditorMenus} from '@/components/rac-editor/@menus/ui/RacEditorMenus.tsx';
import {RacEditorCanvas} from '@/components/rac-editor/ui/RacEditorCanvas.tsx';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {RacEditorHouseTypeSelector} from '@/components/rac-editor/@modals/ui/RacEditorHouseTypeSelector.tsx';
import {RacEditorModalEditors} from '@/components/rac-editor/@modals/ui/RacEditorModalEditors.tsx';
import {RacEditorModals} from '@/components/rac-editor/@modals/ui/RacEditorModals.tsx';
import {House3DViewerOverlay} from '@/components/rac-editor/@viewer-3d/ui/House3DViewerOverlay.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/@canvas/ui/workspace-style.ts';

type RacEditorMenusProps = ComponentProps<typeof RacEditorMenus>;
type CanvasProps = ComponentProps<typeof RacEditorCanvas>;
type HouseTypeSelectorProps = ComponentProps<typeof RacEditorHouseTypeSelector>;
type ModalEditorsProps = ComponentProps<typeof RacEditorModalEditors>;
type ModalsProps = ComponentProps<typeof RacEditorModals>;
type ViewerProps = ComponentProps<typeof House3DViewerOverlay>;
type ConstructionSiteManagementPanelProps = ComponentProps<typeof ConstructionSiteManagementPanel>;

export interface RacEditorLayoutProps {
  root: {
    onClick: MouseEventHandler<HTMLDivElement>;
  };
  menus: RacEditorMenusProps;
  canvas: CanvasProps;
  houseTypeSelector: HouseTypeSelectorProps;
  modalEditors: ModalEditorsProps;
  modals: ModalsProps;
  viewer: ViewerProps;
  workspace: {
    open: boolean;
    onClose: () => void;
    panel: ConstructionSiteManagementPanelProps;
  };
}

export function RacEditorLayout({
  root,
  menus,
  canvas,
  houseTypeSelector,
  modalEditors,
  modals,
  viewer,
  workspace,
}: RacEditorLayoutProps) {
  return (
    <div
      className='relative h-full overflow-hidden'
      style={CANVAS_WORKSPACE_STYLE}
      onClick={root.onClick}
    >
      {workspace.open ? (
        <ConstructionSiteManagementPanel {...workspace.panel} onBackToCanvas={workspace.onClose}/>
      ) : (
        <>
          <RacEditorMenus {...menus}/>
          <RacEditorCanvas {...canvas}/>
          <RacEditorHouseTypeSelector {...houseTypeSelector}/>
          <RacEditorModalEditors {...modalEditors}/>
          <RacEditorModals {...modals}/>
          <House3DViewerOverlay {...viewer}/>
        </>
      )}
    </div>
  );
}
