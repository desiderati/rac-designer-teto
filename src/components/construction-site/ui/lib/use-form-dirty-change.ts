import {useEffect} from 'react';

export function useFormDirtyChange(
  isDirty: boolean,
  onDirtyChange?: (isDirty: boolean) => void,
) {
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => () => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);
}
