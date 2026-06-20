import {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {HOUSE_FAMILY_NAME_MAX_LENGTH} from '@/shared/constants.ts';

interface FamilyNameProps {
  /** Current family name. Empty string hides the label entirely. */
  familyName: string;
  /** Persists the new name when the user commits the inline edit. */
  onRename: (newName: string) => void;
  /** Bloqueia edição inline quando a casa ativa está em modo somente leitura. */
  disabled?: boolean;
}

/**
 * Top-left family-name label with inline edit-in-place.
 *
 * - Click name (or pencil icon) → input takes over, prefilled with the current value.
 * - Enter or blur commits a non-empty, changed value via `onRename`.
 * - Esc cancels.
 * - Hidden on small viewports — the family name is desktop-only.
 */
export function FamilyName({familyName, onRename, disabled = false}: FamilyNameProps) {
  const trimmed = familyName.trim();
  const displayName = limitFamilyName(trimmed);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync if the upstream value changes while not editing.
  useEffect(() => {
    if (!isEditing) setDraft(displayName);
  }, [displayName, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!trimmed && !isEditing) return null;

  const startEdit = () => {
    if (disabled) return;
    setDraft(displayName);
    setIsEditing(true);
  };

  const commit = () => {
    const next = limitFamilyName(draft.trim());
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
        onChange={(e) => setDraft(limitFamilyName(e.target.value))}
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
        maxLength={HOUSE_FAMILY_NAME_MAX_LENGTH}
        className={cn(
          // Hidden on mobile, matches the resting label spacing on desktop
          'hidden sm:inline-flex',
          'px-2 py-2 text-lg font-bold text-slate-800 font-display',
          'bg-white/80 rounded-lg outline-none',
          'border border-blue-300 ring-2 ring-blue-200/60',
          'min-w-[12rem] w-[min(12rem,calc(100vw-7rem))] max-w-[min(12rem,calc(100vw-7rem))]',
        )}
        style={{fontFamily: '"Space Grotesk", "Inter", sans-serif'}}
      />
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      data-testid='top-bar-family-button'
      title={disabled ? 'Nome bloqueado para casa construída' : 'Editar nome da família'}
      aria-label={disabled ? `Nome da família bloqueado (atual: ${displayName})` : `Editar nome da família (atual: ${displayName})`}
      disabled={disabled}
      className={cn(
        // Hidden on mobile per design spec.
        'hidden sm:flex',
        'group min-w-0 max-w-[min(32rem,calc(100vw-7rem))] items-center gap-2 px-2 py-2 rounded-lg cursor-pointer',
        'hover:bg-slate-100/60 transition-colors',
        disabled ? 'cursor-not-allowed opacity-70 hover:bg-transparent' : null,
      )}
    >
      <span
        data-testid='top-bar-family-name'
        title={trimmed}
        className='block min-w-0 max-w-full truncate text-lg font-bold text-slate-800 font-display'
        style={{fontFamily: '"Space Grotesk", "Inter", sans-serif'}}
      >
        {displayName}
      </span>
      <FontAwesomeIcon
        icon={TOP_BAR_ICONS.edit}
        className={cn('shrink-0 text-sm text-slate-400 opacity-0 transition-opacity', disabled ? null : 'group-hover:opacity-100')}
      />
    </button>
  );
}

function limitFamilyName(value: string): string {
  return value.slice(0, HOUSE_FAMILY_NAME_MAX_LENGTH);
}
