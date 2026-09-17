import {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {CalendarDays, X} from 'lucide-react';
import type {
  CreateConstructionSiteInput,
  UpdateConstructionSiteInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import {
  CONSTRUCTION_COMMUNITY_MAX_LENGTH,
  constructionFormSchema,
  normalizeConstructionCodeDraft,
  type ConstructionFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {Button} from '@/components/ui/button.tsx';
import {Calendar} from '@/components/ui/calendar.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {FORM_ACTION_BUTTON_CLASS} from '@/components/construction-site/ui/lib/constants.ts';
import {
  inputClassName,
  PhotoUploadField,
  PrimaryButton,
  TextField,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';
import {formatDateOnly, parseDateOnly, toDateOnly} from '@/components/construction-site/ui/lib/view-model.ts';

export function ConstructionFormScreen({
  mode,
  externalCode,
  unavailableExternalCodes = [],
  photoDataUrl,
  constructionDate,
  communityName,
  onSubmit,
  onDirtyChange,
  readOnly = false,
}: {
  mode: 'create' | 'edit';
  externalCode: string;
  unavailableExternalCodes?: string[];
  photoDataUrl: string;
  constructionDate: string;
  communityName: string;
  onSubmit(input: CreateConstructionSiteInput & UpdateConstructionSiteInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}) {
  const form = useForm<ConstructionFormValues>({
    resolver: zodResolver(constructionFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      externalCode,
      photoDataUrl: photoDataUrl || '',
      constructionDate,
      communityName,
    },
  });

  useEffect(() => {
    form.reset({
      externalCode,
      photoDataUrl: photoDataUrl || '',
      constructionDate,
      communityName,
    });
  }, [communityName, constructionDate, externalCode, form, photoDataUrl]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    if (readOnly) return;

    const normalizedExternalCode = values.externalCode.trim().toUpperCase();
    if (mode === 'create' && unavailableExternalCodes.includes(normalizedExternalCode)) {
      form.setError('externalCode', {
        type: 'validate',
        message: 'Já existe uma Construção TETO com este código.',
      });
      return;
    }

    const input: CreateConstructionSiteInput & UpdateConstructionSiteInput = {
      externalCode: normalizedExternalCode,
      photoDataUrl: values.photoDataUrl || undefined,
      constructionDate: values.constructionDate,
      communityName: values.communityName.trim(),
    };
    await onSubmit(input);
  });

  return (
    <form className='w-full space-y-6' onSubmit={submitForm} noValidate>
      <div data-testid='construction-form-grid' className='grid gap-5 md:grid-cols-2 md:items-stretch'>
        <Controller
          control={form.control}
          name='photoDataUrl'
          render={({field}) => (
            <PhotoUploadField
              label='Foto da Construção'
              testId='construction-photo-field'
              value={field.value ?? ''}
              onChange={field.onChange}
              dropZoneClassName='h-56'
              disabled={readOnly}
            />
          )}
        />
        <div className='grid gap-4'>
          <Controller
            control={form.control}
            name='externalCode'
            render={({field, fieldState}) => (
              <TextField
                label='Código da CC'
                placeholder='ex: CC2603'
                value={field.value}
                onChange={(value) => field.onChange(normalizeConstructionCodeDraft(value))}
                onBlur={field.onBlur}
                required
                maxLength={6}
                pattern='CC[0-9]{4}'
                error={fieldState.error?.message}
                disabled={readOnly}
              />
            )}
          />
          <Controller
            control={form.control}
            name='constructionDate'
            render={({field, fieldState}) => (
              <ConstructionDatePicker
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                disabled={readOnly}
              />
            )}
          />
          <Controller
            control={form.control}
            name='communityName'
            render={({field, fieldState}) => (
              <CommunityField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                disabled={readOnly}
              />
            )}
          />
        </div>
      </div>
      <div className='flex flex-col justify-end gap-3 sm:flex-row'>
        <PrimaryButton type='submit' className={FORM_ACTION_BUTTON_CLASS} disabled={readOnly}>
          {mode === 'create' ? 'Criar Construção' : 'Salvar Construção'}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function CommunityField({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}: {
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <label htmlFor='construction-communities'>
        Comunidade
      </label>
      <input
        id='construction-communities'
        type='text'
        placeholder='ex: Tiradentes'
        value={value}
        required
        maxLength={CONSTRUCTION_COMMUNITY_MAX_LENGTH}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'construction-communities-error' : undefined}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className='min-h-10 rounded-lg border border-transparent bg-blue-50/80 px-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 disabled:focus:border-transparent disabled:focus:ring-0'
      />
      {error ? (
        <span id='construction-communities-error' className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function ConstructionDatePicker({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}: {
  value: string;
  onChange(value: string): void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateOnly(value);
  const label = formatDateOnly(value);

  const selectDate = (date?: Date) => {
    if (disabled) return;
    onChange(date ? toDateOnly(date) : '');
    onBlur?.();
    setOpen(false);
  };

  return (
    <div className='flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
      <span id='construction-date-label'>Data da Construção</span>
      <div className='flex gap-2'>
        <Popover open={disabled ? false : open} onOpenChange={(nextOpen) => {
          if (!disabled) setOpen(nextOpen);
        }}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              aria-label='Data da Construção'
              aria-labelledby='construction-date-label'
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'construction-date-error' : undefined}
              disabled={disabled}
              className={cn(
                inputClassName,
                'w-full cursor-pointer justify-between border-transparent bg-blue-50/80 px-3 text-left normal-case tracking-normal hover:bg-white',
                disabled ? 'hover:bg-slate-100' : null,
              )}
            >
              <span className={cn('min-w-0 flex-1 truncate', selectedDate ? 'text-slate-800' : 'text-slate-400')}>
                {selectedDate ? label : 'Selecionar data'}
              </span>
              <CalendarDays className='h-4 w-4 shrink-0 text-slate-400'/>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            sideOffset={8}
            data-testid='construction-date-picker-calendar'
            className='w-auto rounded-xl border border-slate-200 bg-white/95 p-0 text-slate-700 shadow-xl backdrop-blur-xl'
          >
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={selectDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {selectedDate ? (
          <button
            type='button'
            aria-label='Limpar Data da Construção'
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onChange('');
              onBlur?.();
            }}
            onBlur={onBlur}
            className='grid min-h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-500'
          >
            <X className='h-4 w-4'/>
          </button>
        ) : null}
      </div>
      {error ? (
        <span id='construction-date-error' className='text-xs font-semibold normal-case tracking-normal text-red-600'>
          {error}
        </span>
      ) : null}
    </div>
  );
}
