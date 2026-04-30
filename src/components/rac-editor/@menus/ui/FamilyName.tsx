import {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface FamilyNameProps {
  /** Current family name. Empty string hides the label entirely. */
  familyName: string;
  /** Persists the new name when the user commits the inline edit. */
  onRename: (newName: string) => void;
}

/**
 * Top-left family-name label with inline edit-in-place.
 *
 * - Click name (or pencil icon) → input takes over, prefilled with the current value.
 * - Enter or blur commits a non-empty, changed value via `onRename`.
 * - Esc cancels.
 * - Hidden on small viewports — the family name is desktop-only.
 */
export function FamilyName({familyName, onRename}: FamilyNameProps) {
  const trimmed = familyName.trim();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(trimmed);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync if the upstream value changes while not editing.
  useEffect(() => {
    if (!isEditing) setDraft(trimmed);
  }, [trimmed, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!trimmed && !isEditing) return null;

  const startEdit = () => {
    setDraft(trimmed);
    setIsEditing(true);
  };

  const commit = () => {
    const next = draft.trim();
    if (next && next !== trimmed) {
      onRename(next);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(trimmed);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type='text'
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        aria-label='Editar nome da família'
        className={cn(
          // Hidden on mobile, matches the resting label spacing on desktop
          'hidden sm:inline-flex',
          'px-2 py-2 text-lg font-bold text-slate-800 font-display',
          'bg-white/80 rounded-lg outline-none',
          'border border-blue-300 ring-2 ring-blue-200/60',
          'min-w-[12rem]',
        )}
        style={{fontFamily: '"Space Grotesk", "Inter", sans-serif'}}
      />
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      title='Editar nome da família'
      aria-label={`Editar nome da família (atual: ${trimmed})`}
      className={cn(
        // Hidden on mobile per design spec.
        'hidden sm:flex',
        'group items-center gap-2 px-2 py-2 rounded-lg cursor-pointer',
        'hover:bg-slate-100/60 transition-colors',
      )}
    >
      <span
        className='text-lg font-bold text-slate-800 font-display'
        style={{fontFamily: '"Space Grotesk", "Inter", sans-serif'}}
      >
        {trimmed}
      </span>
      <FontAwesomeIcon
        icon={TOP_BAR_ICONS.edit}
        className='text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'
      />
    </button>
  );
}
