import type {ComponentProps, MouseEventHandler} from 'react';
import {RacEditorMenus} from '@/components/rac-editor/menus/ui/RacEditorMenus.tsx';
import {RacEditorCanvas} from '@/components/rac-editor/ui/RacEditorCanvas.tsx';
import {RacEditorHouseTypeSelector} from '@/components/rac-editor/modals/ui/RacEditorHouseTypeSelector.tsx';
import {RacEditorModalEditors} from '@/components/rac-editor/modals/ui/RacEditorModalEditors.tsx';
import {RacEditorModals} from '@/components/rac-editor/modals/ui/RacEditorModals.tsx';
import {RacEditorTutorial} from '@/components/rac-editor/ui/RacEditorTutorial.tsx';
import {House3DViewerOverlay} from '@/components/rac-editor/viewer3d/ui/House3DViewerOverlay.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/canvas/ui/workspace-style.ts';

type RacEditorMenusProps = ComponentProps<typeof RacEditorMenus>;
type CanvasProps = ComponentProps<typeof RacEditorCanvas>;
type HouseTypeSelectorProps = ComponentProps<typeof RacEditorHouseTypeSelector>;
type ModalEditorsProps = ComponentProps<typeof RacEditorModalEditors>;
type ModalsProps = ComponentProps<typeof RacEditorModals>;
type TutorialProps = ComponentProps<typeof RacEditorTutorial>;
type ViewerProps = ComponentProps<typeof House3DViewerOverlay>;

export interface RacEditorLayoutProps {
  root: {
    onClick: MouseEventHandler<HTMLDivElement>;
  };
  menus: RacEditorMenusProps;
  canvas: CanvasProps;
  houseTypeSelector: HouseTypeSelectorProps;
  modalEditors: ModalEditorsProps;
  modals: ModalsProps;
  tutorial: TutorialProps;
  viewer: ViewerProps;
}

export function RacEditorLayout({
  root,
  menus,
  canvas,
  houseTypeSelector,
  modalEditors,
  modals,
  tutorial,
  viewer,
}: RacEditorLayoutProps) {
  return (
    <div
      className='relative h-full overflow-hidden'
      style={CANVAS_WORKSPACE_STYLE}
      onClick={root.onClick}
    >
      <RacEditorMenus {...menus}/>
      <RacEditorCanvas {...canvas}/>
      <RacEditorHouseTypeSelector {...houseTypeSelector}/>
      <RacEditorModalEditors {...modalEditors}/>
      <RacEditorModals {...modals}/>
      <RacEditorTutorial {...tutorial}/>
      <House3DViewerOverlay {...viewer}/>
    </div>
  );
}
