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
import {FormSectionHeader} from '@/components/construction-site/ui/lib/FormSectionHeader.tsx';
import {HouseConfigurationSidebar} from './HouseConfigurationScreen.tsx';

export function MonitorFormScreen({
  mode,
  constructionSite,
  monitor,
  onSave,
  onDirtyChange,
  readOnly = false,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  monitor: MonitorRecord | null;
  onSave(input: CreateMonitorInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}) {
  const form = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getMonitorInitialState(monitor),
  });
  const {dirtyFields} = form.formState;
  const hasSectionChanges = Boolean(dirtyFields.name || dirtyFields.phone || dirtyFields.email || dirtyFields.photoDataUrl);

  useEffect(() => {
    form.reset(getMonitorInitialState(monitor));
  }, [form, monitor]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    if (readOnly) return;
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
      className='grid min-w-0 items-stretch gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='h-full min-w-0'>
        <section className='space-y-2'>
          <div className='flex items-center gap-3 py-3'>
            <FormSectionHeader number='01' title='Dados do Monitor' dirty={hasSectionChanges}/>
          </div>
          <div
            data-testid='monitor-form-layout'
            className='h-full items-stretch space-y-5'
          >
                <Controller
                  control={form.control}
                  name='photoDataUrl'
                  render={({field}) => (
                    <PhotoUploadField
                      label='Foto do Monitor'
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      dirty={Boolean(dirtyFields.photoDataUrl)}
                      testId='monitor-photo-field'
                      className='flex-1 min-h-[16rem]'
                      dropZoneClassName='h-56 min-h-[16rem] flex-1'
                      loadedDropZoneClassName='h-56 min-h-[16rem] flex-1'
                      disabled={readOnly}
                    />
                  )}
                />
                <div data-testid='monitor-fields-column' className='flex h-full flex-col'>
                  <div data-testid='monitor-fields-stack' className='flex flex-col gap-5'>
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
                          dirty={Boolean(dirtyFields.name)}
                          disabled={readOnly}
                        />
                      )}
                    />
                    <div data-testid='monitor-contact-grid' className='grid grid-cols-2 gap-5'>
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
                            dirty={Boolean(dirtyFields.phone)}
                            disabled={readOnly}
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
                            dirty={Boolean(dirtyFields.email)}
                            disabled={readOnly}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
          </div>
        </section>
        <div data-testid='monitor-actions-grid' className='sticky bottom-0 z-20 -mx-2 mt-4 grid w-full min-w-0 gap-4 bg-white/95 px-2 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:mt-4 sm:bg-transparent sm:px-0 sm:py-0 md:grid-cols-2'>
          <PrimaryButton type='submit' className='w-full min-w-0' disabled={readOnly || isSubmitting}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
