import {useEffect} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {CreateMonitorInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteState, MonitorRecord} from '@/shared/types/construction-site.ts';
import {
  formatPhoneInput,
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
import {HouseConfigurationSidebar} from './HouseConfigurationScreen.tsx';

export function MonitorFormScreen({
  mode,
  constructionSite,
  monitor,
  onSave,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  monitor: MonitorRecord | null;
  onSave(input: CreateMonitorInput): void | Promise<void>;
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
      className='grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='space-y-6'>
        <div
          data-testid='monitor-form-layout'
          className='grid items-stretch gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]'
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
                dropZoneClassName='h-full min-h-[13.5rem]'
                loadedDropZoneClassName='h-full min-h-[13.5rem]'
              />
            )}
          />
          <div data-testid='monitor-fields-column' className='grid grid-cols-1 gap-4'>
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
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]'>
          <PrimaryButton type='submit' className='w-full md:col-start-2' disabled={isSubmitting}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
