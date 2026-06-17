import {useEffect} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {CreateMonitorInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteState, MonitorRecord} from '@/shared/types/construction-site.ts';
import {
  formatPhoneInput,
  MONITOR_EMAIL_MAX_LENGTH,
  MONITOR_NAME_MAX_LENGTH,
  monitorFormSchema,
  PHONE_MASK_MAX_LENGTH,
  type MonitorFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {
  PhotoUploadField,
  PrimaryButton,
  TextField,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {
  getMonitorInitialState,
  toMonitorInput,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';
import {HouseConfigurationSidebar} from './HouseConfigurationScreen.tsx';

export function MonitorFormScreen({
  mode,
  constructionSite,
  monitor,
  onSave,
  onDirtyChange,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  monitor: MonitorRecord | null;
  onSave(input: CreateMonitorInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const form = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getMonitorInitialState(monitor),
  });

  useEffect(() => {
    form.reset(getMonitorInitialState(monitor));
  }, [form, monitor]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    await onSave(toMonitorInput(values));
  });
  const isSubmitting = form.formState.isSubmitting;
  const submitLabel = isSubmitting
    ? 'Salvando...'
    : mode === 'create'
      ? 'Cadastrar Monitor'
      : 'Salvar Monitor';

  return (
    <form
      data-testid='monitor-form'
      className='grid items-stretch gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='h-full'>
        <div
          data-testid='monitor-form-layout'
          className='grid h-full items-stretch gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]'
        >
          <Controller
            control={form.control}
            name='photoDataUrl'
            render={({field}) => (
              <PhotoUploadField
                label='Foto do Monitor'
                value={field.value ?? ''}
                onChange={field.onChange}
                testId='monitor-photo-field'
                className='h-full'
                dropZoneClassName='min-h-[16rem] flex-1'
                loadedDropZoneClassName='min-h-[16rem] flex-1'
              />
            )}
          />
          <div data-testid='monitor-fields-column' className='grid h-full grid-cols-1 gap-4 md:grid-rows-[auto_auto_auto_minmax(0,1fr)]'>
            <Controller
              control={form.control}
              name='name'
              render={({field, fieldState}) => (
                <TextField
                  label='Nome do Monitor'
                  placeholder='Nome completo'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  required
                  maxLength={MONITOR_NAME_MAX_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name='phone'
              render={({field, fieldState}) => (
                <TextField
                  label='Telefone'
                  placeholder='(41) 00000-0000'
                  value={field.value}
                  onChange={(phone) => field.onChange(formatPhoneInput(phone))}
                  onBlur={field.onBlur}
                  required
                  maxLength={PHONE_MASK_MAX_LENGTH}
                  inputMode='numeric'
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name='email'
              render={({field, fieldState}) => (
                <TextField
                  label='E-mail'
                  type='email'
                  placeholder='monitor@dominio.com'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={MONITOR_EMAIL_MAX_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
            <PrimaryButton type='submit' className='w-full md:self-end' disabled={isSubmitting}>
              {submitLabel}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </form>
  );
}
