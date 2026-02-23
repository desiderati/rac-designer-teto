import {useEffect, useRef, useState} from "react";

export function useEditorDraft<TDraft>(initialDraft: TDraft, isOpen: boolean) {
  const [draft, setDraft] = useState(initialDraft);
  const latestInitialDraftRef = useRef(initialDraft);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    latestInitialDraftRef.current = initialDraft;
  }, [initialDraft]);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    if (justOpened) {
      setDraft(latestInitialDraftRef.current);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const resetDraft = () => {
    setDraft(latestInitialDraftRef.current);
  };

  return {
    draft,
    setDraft,
    resetDraft,
  };
}
