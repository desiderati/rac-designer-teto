import {
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Archive,
  ArchiveRestore,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {getPhotoOrientation, type PhotoOrientation} from '@/components/construction-site/lib/photo-orientation.ts';
import {parseMapCoordinates} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  isSupportedPhotoDataUrl,
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_UPLOAD_ERROR_MESSAGE,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';
import {GRIDDED_WORKSPACE_STYLE} from '@/shared/ui/workspace-style.ts';
import type {StatusChangeAction, VisualSelectOption} from './types.ts';
import {buildGoogleMapsEmbedUrl} from './view-model.ts';

export function StatusActionButton({
  action,
  label,
  onClick,
  guidedTourId,
  disabled = false,
}: {
  action: StatusChangeAction;
  label: string;
  onClick(event: MouseEvent<HTMLButtonElement>): void;
  guidedTourId?: string;
  disabled?: boolean;
}) {
  if (
    action === 'markBuilt'
    || action === 'markDraft'
    || action === 'markCompleted'
    || action === 'markInProgress'
  ) {
    return (
      <RoundIconActionButton
        label={label}
        tone='neutral'
        onClick={onClick}
        guidedTourId={guidedTourId}
        disabled={disabled}
      >
        {action === 'markBuilt' || action === 'markCompleted'
          ? <CheckCircle2 className='h-4 w-4'/>
          : <RotateCcw className='h-4 w-4'/>}
      </RoundIconActionButton>
    );
  }

  return (
    <RoundIconActionButton
      label={label}
      tone={action === 'unarchive' ? 'unarchive' : 'archive'}
      onClick={onClick}
      guidedTourId={guidedTourId}
      disabled={disabled}
    >
      {action === 'unarchive' ? <ArchiveRestore className='h-4 w-4'/> : <Archive className='h-4 w-4'/>}
    </RoundIconActionButton>
  );
}

export function RoundIconActionButton({
  label,
  onClick,
  children,
  tone = 'neutral',
  guidedTourId,
  disabled = false,
}: {
  label: string;
  onClick(event: MouseEvent<HTMLButtonElement>): void;
  children: ReactNode;
  tone?: 'neutral' | 'archive' | 'unarchive';
  guidedTourId?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      data-guided-tour-id={guidedTourId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors focus:outline-none focus:ring-2',
        disabled ? 'cursor-not-allowed opacity-45' : null,
        tone === 'archive' ? 'hover:bg-red-50 hover:text-red-600 focus:ring-red-100' : null,
        tone === 'unarchive' ? 'hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-100' : null,
        tone === 'neutral' ? 'hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-100' : null,
      )}
    >
      {children}
    </button>
  );
}

export function PhotoUploadField({
  label,
  value,
  onChange,
  testId = 'family-photo-field',
  className,
  dropZoneClassName,
  loadedDropZoneClassName,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  testId?: string;
  className?: string;
  dropZoneClassName?: string;
  loadedDropZoneClassName?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoOrientation, setPhotoOrientation] = useState<PhotoOrientation | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) setPhotoOrientation(undefined);
    if (value) setUploadError(null);
  }, [value]);

  const updatePhoto = async (file: File) => {
    const validationError = await validatePhotoFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!isSupportedPhotoDataUrl(dataUrl)) {
        setUploadError(PHOTO_UPLOAD_ERROR_MESSAGE);
        return;
      }
      setUploadError(null);
      onChange(dataUrl);
    });

    reader.addEventListener('error', () => {
      setUploadError('Não foi possível ler a foto selecionada.');
    });

    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (!file) return;
    void updatePhoto(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void updatePhoto(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (disabled) return;
    openFilePicker();
  };

  const clearPhoto = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setUploadError(null);
    onChange('');
  };

  return (
    <div data-testid={testId} className={cn('flex w-full flex-col gap-2', className)}>
      <span className='block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>{label}</span>
      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        data-photo-orientation={photoOrientation}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-blue-200 bg-blue-50/80 px-3 py-4 text-center text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200',
          disabled ? 'cursor-not-allowed opacity-60 hover:border-blue-200 hover:bg-blue-50/80 focus:ring-0' : null,
          uploadError ? 'border-red-300 bg-red-50/70 text-red-700 hover:border-red-300 hover:bg-red-50 focus:ring-red-100' : null,
          dropZoneClassName,
          value ? cn('p-0', loadedDropZoneClassName) : null,
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              onLoad={(event) => {
                setPhotoOrientation(getPhotoOrientation(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight));
              }}
              className='absolute inset-0 h-full w-full rounded-xl object-cover object-center'
            />
            <button
              type='button'
              aria-label={`Remover ${label}`}
              onClick={clearPhoto}
              disabled={disabled}
              className='absolute right-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/75 text-slate-700/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <X className='h-4 w-4'/>
            </button>
            <span className='absolute bottom-4 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-white/75 px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700/90 shadow-sm backdrop-blur-sm'>
              Clique para fazer upload ou arraste uma foto
            </span>
          </>
        ) : (
          <>
            <Camera className='h-6 w-6 text-slate-500'/>
            <span>Clique para fazer upload ou arraste uma foto</span>
          </>
        )}
        <input
          ref={inputRef}
          aria-label={`${label} arquivo`}
          type='file'
          accept={PHOTO_UPLOAD_ACCEPT}
          className='sr-only'
          onClick={(event) => event.stopPropagation()}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {uploadError ? (
        <p role='alert' className='text-xs font-semibold text-red-600'>{uploadError}</p>
      ) : null}
    </div>
  );
}

export function RadioField({
  icon,
  label,
  name,
  value,
  checked,
  onChange,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange(value: string): void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'relative flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-200',
        checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent bg-slate-50 text-slate-950 hover:bg-slate-100',
        disabled ? 'cursor-not-allowed opacity-60 hover:bg-slate-50' : null,
      )}
    >
      <input
        type='radio'
        aria-label={label}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className='absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
      />
      <span className={cn('shrink-0', checked ? 'text-blue-600' : 'text-slate-500')}>{icon}</span>
      <span className='min-w-0 flex-1'>{label}</span>
      <span
        aria-hidden='true'
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
          checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent',
        )}
      >
        {checked ? <Check className='h-3.5 w-3.5'/> : null}
      </span>
    </label>
  );
}

export function StaticMapPreview({locationQuery}: { locationQuery: string }) {
  const coordinates = parseMapCoordinates(locationQuery);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;
  const googleMapsUrl = coordinates && googleMapsApiKey
    ? buildGoogleMapsEmbedUrl(coordinates, googleMapsApiKey)
    : null;

  if (googleMapsUrl) {
    return (
      <div
        data-testid='static-map-preview'
        aria-label='Mapa do local informado'
        className='relative min-h-40 overflow-hidden rounded-[28px] bg-blue-50'
      >
        <iframe
          title='Mapa do local informado'
          data-testid='google-maps-embed'
          src={googleMapsUrl}
          className='absolute inset-0 h-full w-full border-0'
          loading='lazy'
          allowFullScreen
          referrerPolicy='no-referrer-when-downgrade'
        />
      </div>
    );
  }

  const fallbackLabel = locationQuery.trim()
    ? coordinates ? 'Configure a chave do Google Maps' : 'Coordenadas inválidas'
    : 'Localização a definir';

  return (
    <div
      data-testid='static-map-preview'
      aria-label='Mapa visual estático do local'
      className='relative min-h-40 overflow-hidden rounded-[28px] bg-blue-50'
    >
      <div className='absolute inset-0 opacity-40' style={GRIDDED_WORKSPACE_STYLE}/>
      <div className='absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/50 p-2'>
        <div className='h-full w-full rounded-full bg-blue-600 shadow-sm'/>
      </div>
      <div className='absolute bottom-4 left-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm'>
        <MapPin className='h-3.5 w-3.5 shrink-0 text-blue-600'/>
        {fallbackLabel}
      </div>
    </div>
  );
}

export function PaginationButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type='button'
      className={cn(
        'grid h-8 w-8 cursor-pointer place-items-center rounded-full text-base font-bold text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200',
        props.disabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : null,
        props.className,
      )}
    />
  );
}

export function MobilePagination({
  text,
  page,
  pageCount,
  entityLabel,
  onPageChange,
  testId,
}: {
  text: string;
  page: number;
  pageCount: number;
  entityLabel: string;
  onPageChange(page: number): void;
  testId?: string;
}) {
  const paginationItems = pageCount > 1 ? getMobilePaginationItems(page, pageCount) : [];
  const hasPagination = paginationItems.length > 0;

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500 sm:hidden',
        hasPagination ? 'justify-between' : 'justify-center text-center',
      )}
    >
      <span className={cn('min-w-fit', hasPagination ? null : 'w-full')}>{text}</span>
      {hasPagination ? (
        <nav aria-label={`Paginação de ${entityLabel}`} className='flex shrink-0 items-center gap-1'>
          <MobilePaginationArrow
            label={`Página anterior de ${entityLabel}`}
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ‹
          </MobilePaginationArrow>
          {paginationItems.map((item) => item.kind === 'ellipsis' ? (
            <span
              key={item.key}
              aria-hidden='true'
              className='grid h-7 w-4 place-items-center text-xs font-bold text-slate-300'
            >
              ...
            </span>
          ) : (
            <button
              key={item.page}
              type='button'
              aria-label={`Ir para página ${item.page} de ${entityLabel}`}
              aria-current={item.page === page ? 'page' : undefined}
              onClick={() => onPageChange(item.page)}
              className={cn(
                'grid h-7 w-7 cursor-pointer place-items-center rounded-full text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
                item.page === page
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-blue-50 text-slate-600 hover:bg-blue-100 hover:text-blue-700',
              )}
            >
              {item.page}
            </button>
          ))}
          <MobilePaginationArrow
            label={`Próxima página de ${entityLabel}`}
            disabled={page >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            ›
          </MobilePaginationArrow>
        </nav>
      ) : null}
    </div>
  );
}

type MobilePaginationItem =
  | {kind: 'page'; page: number}
  | {kind: 'ellipsis'; key: string};

function getMobilePaginationItems(page: number, pageCount: number): MobilePaginationItem[] {
  if (pageCount <= 5) {
    return Array.from({length: pageCount}, (_, index) => ({kind: 'page', page: index + 1}));
  }

  if (page <= 3) {
    return [
      {kind: 'page', page: 1},
      {kind: 'page', page: 2},
      {kind: 'page', page: 3},
      {kind: 'page', page: 4},
      {kind: 'ellipsis', key: 'end'},
      {kind: 'page', page: pageCount},
    ];
  }

  if (page >= pageCount - 2) {
    return [
      {kind: 'page', page: 1},
      {kind: 'ellipsis', key: 'start'},
      {kind: 'page', page: pageCount - 3},
      {kind: 'page', page: pageCount - 2},
      {kind: 'page', page: pageCount - 1},
      {kind: 'page', page: pageCount},
    ];
  }

  return [
    {kind: 'page', page: 1},
    {kind: 'ellipsis', key: 'start'},
    {kind: 'page', page: page - 1},
    {kind: 'page', page},
    {kind: 'page', page: page + 1},
    {kind: 'ellipsis', key: 'end'},
    {kind: 'page', page: pageCount},
  ];
}

function MobilePaginationArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-blue-50 text-base font-bold text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
        disabled ? 'cursor-not-allowed bg-blue-50/60 text-slate-300' : 'hover:bg-blue-100',
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({title, description}: { title: string; description: string }) {
  return (
    <section className='mt-4 rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center'>
      <h2 className='text-base font-semibold text-slate-900'>{title}</h2>
      <p className='mt-2 text-sm text-slate-600'>{description}</p>
    </section>
  );
}

export function TextField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onKeyDown,
  required,
  maxLength,
  pattern,
  inputMode,
  error,
  disabled = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  error?: string;
  disabled?: boolean;
}) {
  const inputId = `text-field-${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor={inputId}>{label}</label>
      <span className='relative block h-10 w-full'>
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={cn(inputClassName, 'h-full w-full')}
        />
      </span>
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function VisualSelect<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  className,
  disabled = false,
}: {
  label: string;
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(
      'flex min-h-10 min-w-0 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 sm:min-h-9',
      className,
    )}>
      <span className='min-w-0 shrink truncate'>{label}</span>
      <VisualSelectMenu
        ariaLabel={ariaLabel}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        triggerClassName='min-h-7 min-w-0 flex-1 bg-transparent px-0 py-0 text-xs font-semibold text-slate-700'
      />
    </div>
  );
}

export function VisualSelectField<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  error,
  disabled = false,
}: {
  label: string;
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = `${ariaLabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <span>{label}</span>
      <VisualSelectMenu
        ariaLabel={ariaLabel}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        triggerClassName={cn(inputClassName, 'justify-between text-left')}
        ariaInvalid={Boolean(error)}
        ariaDescribedBy={error ? errorId : undefined}
      />
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function VisualSelectMenu<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  triggerClassName,
  ariaInvalid,
  ariaDescribedBy,
  disabled = false,
}: {
  ariaLabel: string;
  value: T;
  options: VisualSelectOption<T>[];
  onChange(value: T): void;
  triggerClassName: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const selectOption = (nextValue: T) => {
    if (disabled) return;
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={(nextOpen) => {
      if (!disabled) setOpen(nextOpen);
    }}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-100',
            disabled ? 'cursor-not-allowed opacity-60 focus:ring-0' : null,
            triggerClassName,
          )}
        >
          <span className='min-w-0 flex-1 truncate text-left normal-case tracking-normal'>
            {selectedOption?.triggerLabel ?? selectedOption?.label ?? 'Selecionar'}
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open ? 'rotate-180' : null)}/>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={8}
        data-testid={`${ariaLabel}-menu`}
        className='w-56 rounded-xl border border-slate-200 bg-white/95 p-1 text-slate-700 shadow-xl backdrop-blur-xl'
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type='button'
              role='menuitemradio'
              aria-checked={selected}
              aria-label={option.ariaLabel}
              onClick={() => selectOption(option.value)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                selected ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <Check className={cn('h-4 w-4 shrink-0', selected ? 'text-blue-600 opacity-100' : 'opacity-0')}/>
              <span className='min-w-0 flex-1 truncate text-left'>{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function TextArea({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  maxLength,
  error,
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = `textarea-${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor={inputId}>{label}</label>
      <textarea
        id={inputId}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        rows={4}
        className={cn(inputClassName, 'resize-y py-3')}
      />
      {error ? (
        <span id={errorId} className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange(value: boolean): void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'relative flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-slate-50 px-4 text-sm transition-colors hover:bg-slate-100 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-200',
        disabled ? 'cursor-not-allowed opacity-60 hover:bg-slate-50' : null,
      )}
    >
      <input
        type='checkbox'
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className='absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
      />
      <span
        aria-hidden='true'
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded-[3px]',
          checked ? 'bg-blue-600 text-white' : 'bg-blue-100 text-transparent',
        )}
      >
        {checked ? <Check className='h-3 w-3'/> : null}
      </span>
      <span className='min-w-0'>
        <span className='block font-semibold text-slate-950'>{label}</span>
        <span className='mt-0.5 block text-[11px] font-medium text-slate-500'>{description}</span>
      </span>
    </label>
  );
}

export const inputClassName = 'min-h-10 rounded-lg border border-transparent bg-blue-50/80 px-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 disabled:focus:border-transparent disabled:focus:ring-0';

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn(buttonClassName, 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700', props.className)}/>;
}

export const buttonClassName = 'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50';
