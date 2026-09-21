import {useEffect, useState} from 'react';
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
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion.tsx';
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
  const [openSections, setOpenSections] = useState(['monitor-data']);
  const {errors, dirtyFields, submitCount} = form.formState;
  const hasSectionError = Boolean(errors.name || errors.phone || errors.email || errors.photoDataUrl);
  const hasSectionChanges = Boolean(dirtyFields.name || dirtyFields.phone || dirtyFields.email || dirtyFields.photoDataUrl);

  useEffect(() => {
    form.reset(getMonitorInitialState(monitor));
  }, [form, monitor]);
  useEffect(() => {
    if (!submitCount || !hasSectionError) return;
    setOpenSections((current) => current.includes('monitor-data') ? current : [...current, 'monitor-data']);
  }, [hasSectionError, submitCount]);
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
      className='grid items-stretch gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='h-full'>
        <Accordion type='multiple' value={openSections} onValueChange={setOpenSections} className='space-y-2'>
          <AccordionItem value='monitor-data' className='!border-0 bg-transparent px-0 shadow-none'>
            <AccordionTrigger aria-label='Alternar seção Dados do Monitor' className='gap-3 py-3 hover:no-underline'>
              <FormSectionHeader number='01' title='Dados do Monitor' dirty={hasSectionChanges}/>
            </AccordionTrigger>
            <AccordionContent>
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
                          disabled={readOnly}
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
                          disabled={readOnly}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div data-testid='monitor-actions-grid' className='sticky bottom-0 z-20 -mx-2 mt-4 grid gap-4 bg-white/95 px-2 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:mt-4 sm:bg-transparent sm:px-0 sm:py-0 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]'>
          <PrimaryButton type='submit' className='w-full md:col-start-2' disabled={readOnly || isSubmitting}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
