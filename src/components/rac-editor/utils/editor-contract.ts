export interface EditorAnchorPosition {
  x: number;
  y: number;
}

export interface EditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  anchorPosition?: EditorAnchorPosition;
}

export interface EditorApplyHandler<TDraft> {
  apply: (draft: TDraft) => void;
}
