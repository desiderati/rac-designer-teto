import type {ComponentProps, MouseEventHandler} from 'react';
import {Toolbar} from '@/components/rac-editor/ui/toolbar/Toolbar.tsx';
import {RacEditorCanvas} from '@/components/rac-editor/ui/RacEditorCanvas.tsx';
import {RacEditorHouseTypeSelector} from '@/components/rac-editor/ui/RacEditorHouseTypeSelector.tsx';
import {RacEditorModalEditors} from '@/components/rac-editor/ui/RacEditorModalEditors.tsx';
import {RacEditorModals} from '@/components/rac-editor/ui/RacEditorModals.tsx';
import {RacEditorTutorial} from '@/components/rac-editor/ui/RacEditorTutorial.tsx';
import {RacEditor3DViewerOverlay} from '@/components/rac-editor/ui/RacEditor3DViewerOverlay.tsx';
import {CANVAS_WORKSPACE_STYLE} from '@/components/rac-editor/ui/canvas/workspace-style.ts';

type ToolbarProps = ComponentProps<typeof Toolbar>;
type CanvasProps = ComponentProps<typeof RacEditorCanvas>;
type HouseTypeSelectorProps = ComponentProps<typeof RacEditorHouseTypeSelector>;
type ModalEditorsProps = ComponentProps<typeof RacEditorModalEditors>;
type ModalsProps = ComponentProps<typeof RacEditorModals>;
type TutorialProps = ComponentProps<typeof RacEditorTutorial>;
type ViewerProps = ComponentProps<typeof RacEditor3DViewerOverlay>;

export interface RacEditorLayoutProps {
  root: {
    onClick: MouseEventHandler<HTMLDivElement>;
  };
  toolbar: ToolbarProps;
  canvas: CanvasProps;
  houseTypeSelector: HouseTypeSelectorProps;
  modalEditors: ModalEditorsProps;
  modals: ModalsProps;
  tutorial: TutorialProps;
  viewer: ViewerProps;
}

export function RacEditorLayout({
  root,
  toolbar,
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
      <Toolbar {...toolbar}/>
      <RacEditorCanvas {...canvas}/>
      <RacEditorHouseTypeSelector {...houseTypeSelector}/>
      <RacEditorModalEditors {...modalEditors}/>
      <RacEditorModals {...modals}/>
      <RacEditorTutorial {...tutorial}/>
      <RacEditor3DViewerOverlay {...viewer}/>
    </div>
  );
}
