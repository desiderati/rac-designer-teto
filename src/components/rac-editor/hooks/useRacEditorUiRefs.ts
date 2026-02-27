import {useEffect, useRef} from 'react';

export function useRacEditorUiRefs(showTips: boolean, showZoomControls: boolean) {
  const showTipsRef = useRef(showTips);
  const showZoomControlsRef = useRef(showZoomControls);

  useEffect(() => {
    showTipsRef.current = showTips;
  }, [showTips]);

  useEffect(() => {
    showZoomControlsRef.current = showZoomControls;
  }, [showZoomControls]);

  return {
    showTipsRef,
    showZoomControlsRef,
  };
}
